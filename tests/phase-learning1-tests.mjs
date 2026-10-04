import assert from "node:assert/strict";
import {createRegistry} from "../js/learning/registry.js";
import {createProgressStore, createMemoryAdapter} from "../js/learning/progressStore.js";
import {createTourEngine, PHASE, stepKind} from "../js/learning/tourEngine.js";
import {renderIntro, renderHelp, renderLevels, renderWhereAmI, availableLevels, maxLevelFor} from "../js/learning/contextEngine.js";
import {STATES, STATES_BY_TYPE, CONTEXT_TYPES} from "../js/learning/model.js";
import {registerSectionContent} from "../js/learning/content/sections.js";
import {registerDemoContent} from "../js/learning/content/demo.js";
import {registerLegacyContent} from "../js/learning/content/legacy.js";
import {registerAllContent} from "../js/learning/content/index.js";

let n = 0;
const t = (name, fn) => { try { const r = fn(); if (r?.then) throw new Error("use tAsync"); n++; } catch (e) { console.error("FAIL:", name, "\n", e.stack); process.exit(1); } };
const tAsync = async (name, fn) => { try { await fn(); n++; } catch (e) { console.error("FAIL:", name, "\n", e.stack); process.exit(1); } };

const ctx = (o = {}) => ({id: "c1", type: "SECTION", title: "Sección <X>", shortDescription: "Qué es", purpose: "Para qué", whatYouCanDo: ["a", "b"], recommendedFirstAction: "Primero", howItWorks: "Cómo", examples: [{good: "ok", bad: "mal"}], commonMistakes: ["err"], whyItMatters: "Porque", ...o});
const fresh = () => { const r = createRegistry(); registerSectionContent(c => r.register("context", c)); return r; };

/* ===== Context engine ===== */
t("registrar y recuperar contexto de los 6 tipos", () => {
  const r = createRegistry();
  CONTEXT_TYPES.forEach(type => r.register("context", ctx({id: `x:${type}`, type})));
  CONTEXT_TYPES.forEach(type => assert.equal(r.get("context", `x:${type}`).type, type));
  assert.equal(r.list("context").length, 6);
});
t("rechaza tipo inválido, id vacío, duplicado y ruta sin pasos", () => {
  const r = createRegistry();
  assert.throws(() => r.register("context", ctx({type: "NOPE"})));
  assert.throws(() => r.register("context", {type: "SECTION"}));
  assert.throws(() => r.register("foo", {id: "a"}));
  r.register("context", ctx()); assert.throws(() => r.register("context", ctx()));
  assert.throws(() => r.register("route", {id: "r", steps: []}));
});
t("contexto registrado es inmutable", () => {
  const r = createRegistry(); const c = r.register("context", ctx());
  assert.throws(() => { "use strict"; c.title = "otro"; });
});
t("renderIntro expanded/minimized/hidden con aria y escape HTML", () => {
  const c = ctx();
  const e = renderIntro(c, {mode: "expanded"});
  assert.match(e, /role="region"/); assert.match(e, /aria-labelledby=/); assert.match(e, /Entendido/);
  assert.ok(!e.includes("<X>")); assert.match(e, /Sección &lt;X&gt;/);
  assert.match(renderIntro(c, {mode: "minimized"}), /rgt-intro--minimized[\s\S]*Expandir/);
  const h = renderIntro(c, {mode: "hidden"});
  assert.match(h, /rgt-intro--hidden/); assert.match(h, /data-rgt-intro-action="expand"/); assert.ok(!h.includes("Para qué"));
  assert.match(renderIntro(c, {mode: "raro"}), /rgt-intro--expanded/);
  assert.equal(renderIntro(null), "");
});
t("progressive disclosure: cada nivel agrega capa", () => {
  const c = ctx(), lv = n => renderLevels(c, n);
  assert.match(lv(1), /Qué es/); assert.ok(!lv(1).includes("Para qué"));
  assert.match(lv(2), /Para qué/); assert.ok(!lv(2).includes("Primero"));
  assert.match(lv(3), /Primero/); assert.ok(!lv(3).includes("ok"));
  assert.match(lv(4), /Sí:[\s\S]*Evita:/);
  assert.equal(maxLevelFor(c), 4); assert.deepEqual(availableLevels(ctx({examples: null, commonMistakes: null})), [1, 2, 3]);
  const intro = renderIntro(c, {mode: "expanded", level: 1});
  assert.match(intro, /Ver más/); assert.ok(!intro.includes("Ver menos"));
  assert.match(renderIntro(c, {mode: "expanded", level: 4}), /Ver menos/);
  assert.ok(!/Ver más/.test(renderIntro(c, {mode: "expanded", level: 4})));
});
t("renderHelp: patrones inline/popover/modal/panel", () => {
  const c = ctx({type: "FIELD"});
  for (const p of ["inline", "popover"]) { const h = renderHelp(c, {pattern: p}); assert.match(h, /aria-expanded="false"/); assert.match(h, /aria-controls=/); assert.match(h, /role="note"/); assert.match(h, /hidden/); }
  for (const p of ["modal", "panel"]) { const h = renderHelp(c, {pattern: p}); assert.match(h, new RegExp(`data-pattern="${p}"`)); assert.ok(!h.includes("role=\"note\"")); }
  assert.equal(renderHelp(null), "");
});
t("¿Dónde estoy? responde las 5 preguntas", () => {
  const r = fresh(); const s = r.contextForView("planning"); const m = r.get("context", "module:must-win");
  const h = renderWhereAmI(s, [m]);
  for (const q of ["¿Dónde estoy?", "¿Qué es esto?", "¿Para qué sirve?", "¿Qué puedo hacer aquí?", "¿Qué debería hacer primero?"]) assert.ok(h.includes(q), q);
  assert.match(h, /Planning Semanal › Must-Win Battles/);
  assert.match(renderWhereAmI(null), /todavía no tiene guía/);
});
t("relatedX se resuelven como enlaces en nivel 5 y no se muestran huérfanos", () => {
  const r = createRegistry();
  r.register("context", ctx({id: "a", relatedConcepts: ["b", "zzz"], relatedLessons: ["l1"], relatedGuides: ["rt"]}));
  r.register("context", ctx({id: "b", type: "CONCEPT", title: "B"}));
  r.register("lesson", {id: "l1", title: "Lección 1"});
  r.register("route", {id: "rt", title: "Ruta", steps: [{id: "s"}]});
  const out = renderLevels(r.get("context", "a"), 5, (k, id) => r.get(k, id));
  assert.match(out, /data-rgt-open-context="b"/); assert.match(out, /data-rgt-open-lesson="l1"/); assert.match(out, /data-rgt-start-route="rt"/); assert.ok(!out.includes("zzz"));
});
t("contexto de sección por vista (SECTION → view)", () => {
  const r = fresh();
  assert.equal(r.contextForView("board").title, "RGT Board"); assert.equal(r.contextForView("nope"), null);
});

/* ===== Persistencia de preferencias ===== */
await tAsync("preferencias de intro/nivel/guía persisten tras 'reload' (nuevo store, mismo adapter)", async () => {
  const ad = createMemoryAdapter(); let p = await createProgressStore(ad).load();
  assert.equal(p.introMode("board"), "expanded"); assert.equal(p.introMode("board", "minimized"), "minimized");
  p.setIntroMode("board", "hidden"); p.setLevel("board", 3); p.setGuidePrefs({open: true, minimized: true});
  assert.throws(() => p.setIntroMode("board", "xx"));
  await p.flush();
  p = await createProgressStore(ad).load();
  assert.equal(p.introMode("board"), "hidden"); assert.equal(p.level("board"), 3);
  assert.deepEqual(p.guidePrefs(), {open: true, minimized: true, hidden: false});
  p.setIntroMode("board", "expanded"); p.setLevel("board", 99); assert.equal(p.level("board"), 5); p.setLevel("board", -5); assert.equal(p.level("board"), 1);
  p.resetIntros(); assert.equal(p.introMode("board"), "expanded");
  p.setGuidePrefs({open: false, evil: true}); assert.equal(p.guidePrefs().evil, undefined);
});

/* ===== Progress ===== */
await tAsync("progreso: guardar, recuperar, completar, reiniciar, persistir", async () => {
  const ad = createMemoryAdapter(); let p = await createProgressStore(ad).load();
  assert.equal(p.statusOf("lesson", "l1"), STATES.NOT_STARTED);
  p.start("lesson", "l1"); assert.equal(p.get("lesson", "l1").status, "IN_PROGRESS"); assert.ok(p.get("lesson", "l1").startedAt);
  p.complete("lesson", "l1"); const c = p.get("lesson", "l1"); assert.equal(c.status, "COMPLETED"); assert.ok(c.completedAt);
  await p.flush(); p = await createProgressStore(ad).load();
  assert.equal(p.get("lesson", "l1").status, "COMPLETED");
  p.reset("lesson", "l1"); const r = p.get("lesson", "l1");
  assert.equal(r.status, "NOT_STARTED"); assert.equal(r.startedAt, null); assert.equal(r.completedAt, null);
  await p.flush(); p = await createProgressStore(ad).load(); assert.equal(p.statusOf("lesson", "l1"), "NOT_STARTED");
});
await tAsync("estados válidos por tipo", async () => {
  const p = await createProgressStore(createMemoryAdapter()).load();
  assert.throws(() => p.set("lesson", "x", "PASSED")); assert.throws(() => p.set("lesson", "x", "PAUSED"));
  assert.throws(() => p.set("assessment", "x", "COMPLETED")); assert.throws(() => p.set("cosa", "x", "COMPLETED"));
  p.set("route", "r", "PAUSED"); p.set("assessment", "a", "FAILED"); p.set("practice", "pr", "FAILED");
  assert.equal(STATES_BY_TYPE.route.includes("PAUSED"), true);
  assert.equal(p.complete("assessment", "a").status, "PASSED");
  const f = p.recordAttempt("assessment", "b", {passed: false, score: 40}); assert.equal(f.status, "FAILED"); assert.equal(f.attempts, 1); assert.equal(f.score, 40);
  assert.equal(p.recordAttempt("assessment", "b", {passed: true, score: 90}).attempts, 2);
});
await tAsync("get devuelve copia (no muta el caché)", async () => {
  const p = await createProgressStore(createMemoryAdapter()).load(); p.start("lesson", "z");
  const g = p.get("lesson", "z"); g.status = "COMPLETED"; g.completedSteps.push("x");
  assert.equal(p.get("lesson", "z").status, "IN_PROGRESS"); assert.deepEqual(p.get("lesson", "z").completedSteps, []);
});
await tAsync("migración de localStorage legado sin pérdida y una sola vez", async () => {
  const mem = {"rgt.academy.progress.v1": JSON.stringify({a: true, b: false, c: true})};
  const storage = {getItem: k => mem[k] ?? null, removeItem: k => delete mem[k]};
  const p = await createProgressStore(createMemoryAdapter()).load();
  assert.equal(p.migrateLegacy(storage), 2); assert.equal(p.statusOf("lesson", "a"), "COMPLETED"); assert.equal(p.statusOf("lesson", "b"), "NOT_STARTED");
  assert.equal(mem["rgt.academy.progress.v1"], undefined); assert.equal(p.migrateLegacy(storage), 0);
  mem["rgt.academy.progress.v1"] = "{roto"; assert.equal(p.migrateLegacy(storage), 0);
});
const demo = () => { const r = fresh(); registerDemoContent({context: c => r.register("context", c), lesson: c => r.register("lesson", c), practice: c => r.register("practice", c), route: c => r.register("route", c)}); return r; };

/* ===== Relaciones ===== */
t("Concepto → Lección → Práctica → Ruta → función RGT", () => {
  const r = demo(); const ch = r.chain("concept:wip");
  assert.deepEqual(ch.lessons.map(l => l.id), ["demo-intro-wip"]);
  assert.deepEqual(ch.practices.map(p => p.id), ["demo-detect-wip"]);
  assert.deepEqual(ch.routes.map(x => x.id), ["demo-create-initiative"]);
  assert.deepEqual(ch.features, ["board"]);
  assert.equal(r.chain("no-existe"), null);
});
t("lección → práctica, lección → ruta, ruta → función RGT (por separado)", () => {
  const r = demo(), l = r.get("lesson", "demo-intro-wip");
  assert.ok(l.practices.every(id => r.get("practice", id))); assert.ok(l.routes.every(id => r.get("route", id)));
  assert.equal(r.get("route", l.routes[0]).feature, "board"); assert.ok(r.get("practice", "demo-detect-wip").routes.includes("demo-create-initiative"));
});
t("integridad de referencias: contenido real sin referencias rotas; detecta rotas", () => {
  assert.deepEqual(demo().validateIntegrity(), []);
  const r = createRegistry();
  r.register("context", ctx({id: "a", relatedLessons: ["falta"]})); r.register("lesson", {id: "l", practices: ["falta2"], routes: ["falta3"]});
  assert.equal(r.validateIntegrity().length, 3);
});
t("contenido global completo: demo + secciones + legado adoptado sin duplicar ni romper", () => {
  const reg = registerAllContent(); assert.equal(registerAllContent(), reg);
  assert.deepEqual(reg.validateIntegrity(), []);
  for (const id of ["concept:wip", "section:board", "module:must-win", "field:initiative-success-criteria", "component:wip-chip", "action:create-initiative"]) assert.ok(reg.get("context", id), id);
  assert.ok(reg.get("lesson", "demo-intro-wip")); assert.ok(reg.get("route", "demo-create-initiative"));
  assert.equal(reg.get("context", "section:board").defaultMode, undefined); // rico: expanded por defecto
  assert.equal(reg.get("context", "section:history").defaultMode, "minimized"); // legado adoptado
  assert.ok(reg.list("lesson").length >= 9);
  assert.deepEqual(reg.chain("concept:wip").lessons.map(l => l.id).sort(), ["demo-intro-wip", "foundations-wip"]);
  for (const v of ["dashboard", "board", "planning", "deep-work", "review", "history", "alerts", "backup", "ai-settings", "academy", "performance", "execution-health", "assistant"]) assert.ok(reg.contextForView(v), v);
});

/* ===== Guided Tour ===== */
const snapshotWith = (extra = {}) => ({initiatives: [], checklist: [], evidence: [], ...extra});
const dom = new Set(["[data-rgt-target='board-header']", "[data-rgt-target='wip-chip']", "[data-rgt-target='new-initiative']", "[data-rgt-target='create-pillar']", "[data-rgt-target='create-dod']", "[data-rgt-target='create-task']"]);
async function makeTour(snap = snapshotWith(), present = dom) {
  const reg = demo(), progress = await createProgressStore(createMemoryAdapter()).load(); let current = snap; const events = [];
  const tour = createTourEngine({registry: reg, progress, resolveTarget: s => (present.has(s) ? {} : null), getSnapshot: () => current, onChange: s => events.push(s.phase)});
  return {tour, progress, reg, events, setSnap: s => { current = s; }};
}
await tAsync("tour: iniciar → avanzar → retroceder", async () => {
  const {tour} = await makeTour();
  assert.equal(tour.start("demo-create-initiative").ok, true);
  let s = tour.snapshot(); assert.equal(s.phase, PHASE.ACTIVE); assert.equal(s.index, 0); assert.equal(s.kind, "INFO"); assert.equal(s.required, false); assert.equal(s.canPrevious, false);
  assert.equal(tour.next().ok, true); assert.equal(tour.snapshot().index, 1);
  assert.equal(tour.previous().ok, true); assert.equal(tour.snapshot().index, 0);
  assert.equal(tour.previous().reason, "FIRST_STEP");
  assert.equal(tour.start("nope").reason, "ROUTE_NOT_FOUND");
});
await tAsync("tour: paso de acción exige validación; CLICK valida por data-rgt-target", async () => {
  const {tour} = await makeTour(); tour.start("demo-create-initiative"); tour.next(); tour.next();
  let s = tour.snapshot(); assert.equal(s.step.id, "s3-open"); assert.equal(s.kind, "ACTION"); assert.equal(s.required, true);
  assert.deepEqual(tour.next(), {ok: false, reason: "VALIDATION_REQUIRED"});
  assert.equal(tour.report({type: "click", target: "otra-cosa"}).ignored, true); assert.equal(tour.snapshot().validated, false);
  assert.equal(tour.report({type: "click", target: "new-initiative"}).ok, true); assert.equal(tour.snapshot().canNext, true);
  assert.equal(tour.next().ok, true); assert.equal(tour.snapshot().step.id, "s4-pillar");
});
await tAsync("tour: validar paso — TRANSFORM correcto vs RUN con explicación", async () => {
  const {tour} = await makeTour(); tour.start("demo-create-initiative"); tour.next(); tour.next();
  tour.report({type: "click", target: "new-initiative"}); tour.next();
  const bad = tour.report({type: "select", target: "create-pillar", value: "RUN"});
  assert.equal(bad.ok, false); assert.match(bad.message, /Todavía no[\s\S]*TRANSFORM[\s\S]*estructuralmente/); assert.equal(tour.snapshot().validated, false);
  assert.equal(tour.next().reason, "VALIDATION_REQUIRED");
  const good = tour.report({type: "select", target: "create-pillar", value: "TRANSFORM"});
  assert.equal(good.ok, true); assert.match(good.message, /Correcto/); assert.equal(tour.snapshot().feedback.ok, true);
  assert.equal(tour.report({type: "select", target: "otro-select", value: "RUN"}).ignored, true);
  assert.equal(tour.snapshot().validated, true);
});
await tAsync("tour: initiative_created se valida contra el snapshot persistido (no contra el DOM)", async () => {
  const {tour, setSnap} = await makeTour(); tour.start("demo-create-initiative");
  for (let i = 0; i < 2; i++) tour.next();
  tour.report({type: "click", target: "new-initiative"}); tour.next();
  tour.report({type: "select", target: "create-pillar", value: "TRANSFORM"}); tour.next();
  assert.equal(tour.snapshot().step.optional, true); assert.equal(tour.snapshot().required, false);
  tour.next(); assert.equal(tour.snapshot().step.id, "s6-create");
  assert.equal(tour.report({type: "initiative_created", id: "T777"}).ok, false); // aún no existe
  setSnap(snapshotWith({initiatives: [{id: "T777"}]}));
  assert.equal(tour.report({type: "initiative_created", id: "T777"}).ok, true);
  assert.equal(tour.next().ok, true); assert.equal(tour.snapshot().step.id, "s7-end");
  const end = tour.next(); assert.equal(end.completed, true); assert.equal(tour.snapshot().phase, PHASE.COMPLETED);
});
await tAsync("tour: paso opcional se puede omitir; obligatorio no", async () => {
  const {tour} = await makeTour(); tour.start("demo-create-initiative");
  assert.equal(tour.skip().reason, "STEP_REQUIRED");
  for (let i = 0; i < 2; i++) tour.next(); tour.report({type: "click", target: "new-initiative"}); tour.next();
  tour.report({type: "select", target: "create-pillar", value: "TRANSFORM"}); tour.next();
  assert.equal(tour.snapshot().step.id, "s5-dod"); assert.equal(tour.skip().ok, true);
  assert.equal(tour.snapshot().step.id, "s6-create"); assert.ok(!tour.snapshot().completed.includes("s5-dod"));
});
await tAsync("tour: pausar → reanudar y cerrar con progreso guardado y reanudable", async () => {
  const {tour, progress} = await makeTour(); tour.start("demo-create-initiative"); tour.next();
  assert.equal(tour.pause().ok, true); assert.equal(tour.phase, PHASE.PAUSED);
  assert.equal(tour.next().reason, "NOT_ACTIVE"); assert.equal(tour.report({type: "click", target: "new-initiative"}).ignored, true);
  assert.equal(progress.get("route", "demo-create-initiative").status, "PAUSED");
  assert.equal(tour.pause().reason, "NOT_ACTIVE");
  assert.equal(tour.resume().ok, true); assert.equal(tour.phase, PHASE.ACTIVE); assert.equal(tour.resume().reason, "NOT_PAUSED");
  tour.close(); assert.equal(tour.phase, PHASE.IDLE); assert.equal(tour.snapshot().routeId, null);
  const saved = progress.get("route", "demo-create-initiative");
  assert.equal(saved.status, "PAUSED"); assert.equal(saved.currentStep, "s2-wip"); assert.deepEqual(saved.completedSteps, ["s1-board"]);
  const r = tour.start("demo-create-initiative"); assert.equal(r.resumed, true); assert.equal(tour.snapshot().step.id, "s2-wip");
  tour.restart("demo-create-initiative"); assert.equal(tour.snapshot().index, 0); assert.deepEqual(tour.snapshot().completed, []);
  assert.equal(tour.close().ok, true); assert.equal(tour.close().ok, false);
});
await tAsync("tour: target inexistente se detecta sin romper (INFO sigue, ACCIÓN sigue exigiendo validación)", async () => {
  const {tour} = await makeTour(snapshotWith(), new Set()); tour.start("demo-create-initiative");
  let s = tour.snapshot(); assert.equal(s.targetMissing, true); assert.equal(s.targetFound, false);
  assert.equal(tour.next().ok, true);
  tour.next(); s = tour.snapshot(); assert.equal(s.step.id, "s3-open"); assert.equal(s.targetMissing, true); assert.equal(tour.next().reason, "VALIDATION_REQUIRED");
  // target que lanza excepción tampoco rompe
  const reg = demo(); const t2 = createTourEngine({registry: reg, resolveTarget: () => { throw new Error("selector inválido"); }});
  t2.start("demo-create-initiative"); assert.equal(t2.snapshot().targetMissing, true);
});
await tAsync("tour: validador desconocido y validador que lanza no rompen el motor", async () => {
  const reg = createRegistry();
  reg.register("route", {id: "r", title: "R", steps: [{id: "a", action: "EVENT", validation: "no_existe"}, {id: "b", action: "EVENT", validation: "boom"}, {id: "c", action: "NONE"}]});
  const tour = createTourEngine({registry: reg, validators: {boom: () => { throw new Error("x"); }}});
  tour.start("r"); assert.equal(tour.report({type: "no_existe"}).reason, "UNKNOWN_VALIDATOR");
  assert.equal(tour.snapshot().validated, false); assert.match(tour.snapshot().feedback.message, /desconocido/);
});
await tAsync("tour: next/previous explícitos del paso (ramificación) y no hardcodea una ruta", async () => {
  const reg = createRegistry();
  reg.register("route", {id: "r2", title: "R2", steps: [{id: "a", next: "c"}, {id: "b"}, {id: "c", previous: "a"}]});
  const tour = createTourEngine({registry: reg}); tour.start("r2");
  tour.next(); assert.equal(tour.snapshot().step.id, "c"); tour.previous(); assert.equal(tour.snapshot().step.id, "a");
  assert.equal(stepKind({id: "x"}), "INFO"); assert.equal(stepKind({id: "x", action: "CLICK"}), "ACTION"); assert.equal(stepKind({id: "x", validation: "v"}), "ACTION");
});
await tAsync("tour: ruta completada persiste COMPLETED y tras 'reload' no se reanuda", async () => {
  const ad = createMemoryAdapter(); let progress = await createProgressStore(ad).load(); const reg = createRegistry();
  reg.register("route", {id: "r3", title: "R3", steps: [{id: "a"}, {id: "b"}]});
  const tour = createTourEngine({registry: reg, progress}); tour.start("r3"); tour.next(); assert.equal(tour.next().completed, true);
  await progress.flush(); progress = await createProgressStore(ad).load();
  const s = progress.get("route", "r3"); assert.equal(s.status, "COMPLETED"); assert.deepEqual(s.completedSteps, ["a", "b"]); assert.ok(s.completedAt);
  const t2 = createTourEngine({registry: reg, progress}); assert.equal(t2.start("r3").resumed, false);
});

/* ===== Validadores respaldados por los engines de RGT ===== */
import {VALIDATORS} from "../js/learning/validators.js";
const T = (o = {}) => ({id: "T9", title: "x", description: "d", pillar: "TRANSFORM", status: "READY", owner: "o", objective: "o", success_criteria: "s", dependencies: "Ninguna", ...o});
t("validadores delegan en readyEngine / transitionEngine / wipEngine (sin duplicar reglas)", () => {
  const dod = id => ({id: "c" + id, task_id: id, category: "DOD", description: "d", required: true, is_completed: false});
  const snap = {initiatives: [T()], checklist: [dod("T9")], evidence: []};
  assert.equal(VALIDATORS.ready_complete({id: "T9"}, {snapshot: snap}).ok, true);
  assert.equal(VALIDATORS.ready_complete({id: "T9"}, {snapshot: {...snap, checklist: []}}).ok, false);
  assert.equal(VALIDATORS.transition_allowed({id: "T9", next: "IN_PROGRESS"}, {snapshot: snap}).ok, true);
  const full = {...snap, initiatives: [T(), T({id: "T1", status: "IN_PROGRESS"}), T({id: "T2", status: "BLOCKED"})]};
  assert.equal(VALIDATORS.transition_allowed({id: "T9", next: "IN_PROGRESS"}, {snapshot: full}).ok, false);
  const viol = VALIDATORS.transition_blocked({id: "T9", next: "IN_PROGRESS"}, {snapshot: full}); assert.equal(viol.ok, true); assert.match(viol.message, /WIP/);
  assert.equal(VALIDATORS.transition_blocked({id: "T9", next: "IN_PROGRESS"}, {snapshot: snap}).ok, false);
  assert.equal(VALIDATORS.transition_allowed({id: "NOPE", next: "DONE"}, {snapshot: snap}).ok, false);
  assert.equal(VALIDATORS.transition_allowed({id: "T9", next: "DONE"}, {snapshot: snap}).ok, false); // Ready → Done no permitido
});

/* ===== Estados ===== */
t("modelo de estados documentado: cada tipo usa un subconjunto válido de los 6 estados", () => {
  for (const [type, list] of Object.entries(STATES_BY_TYPE)) { assert.ok(list.includes("NOT_STARTED")); list.forEach(s => assert.ok(STATES[s], `${type}:${s}`)); }
  assert.deepEqual(Object.keys(STATES).sort(), ["COMPLETED", "FAILED", "IN_PROGRESS", "NOT_STARTED", "PASSED", "PAUSED"]);
});

console.log(`PHASE LEARNING-1 TESTS: PASS (${n} tests)`);
