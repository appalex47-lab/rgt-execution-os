import assert from "node:assert/strict";
import fs from "node:fs";
import {GROUPS, UTILITIES, ALIASES, allViews, allRoutes, pathFor, buildRoute, resolveHash, breadcrumbs, locate} from "../js/core/nav.js";
import {parseRoute} from "../js/core/router.js";
import {registerAllContent} from "../js/learning/content/index.js";
import {renderWhereAmI, renderIntro} from "../js/learning/contextEngine.js";
import {createProgressStore, createMemoryAdapter} from "../js/learning/progressStore.js";
import {getNextAction} from "../js/engines/nextActionEngine.js";
import {buildFollowUp} from "../js/engines/followUpEngine.js";
import {buildMyTasks} from "../js/engines/tasksEngine.js";
import {canStartTask, WIP_LIMIT} from "../js/engines/wipEngine.js";
import {canCompleteTask} from "../js/engines/dodEngine.js";
import {validateMustWins} from "../js/engines/mustWinEngine.js";
import {canStartTaskReady} from "../js/engines/readyEngine.js";
import {validateNewSprint} from "../js/engines/sprintEngine.js";
import {validateReviewInput} from "../js/engines/reviewEngine.js";
import {validateTransition} from "../js/engines/transitionEngine.js";
import {COURSES, PLANNED_ROUTES} from "../js/learning/content/planned.js";

let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.error("FAIL:", name, "\n", e.stack); process.exit(1); } };
const reg = registerAllContent();
const LEGACY_VIEWS = ["dashboard", "board", "planning", "deep-work", "review", "history", "alerts", "execution-health", "performance", "assistant", "ai-settings", "academy", "backup"];

/* ===== Navegación ===== */
t("exactamente seis grupos con los módulos pedidos, en orden", () => {
  assert.deepEqual(GROUPS.map(g => g.label), ["Command Center", "Planificar", "Ejecutar", "Revisar", "Aprender", "Configuración"]);
  const mods = id => GROUPS.find(g => g.id === id).modules.map(m => m.label);
  assert.deepEqual(mods("planificar"), ["Planning Semanal", "RGT Board", "Iniciativas", "Must-Win"]);
  assert.deepEqual(mods("ejecutar"), ["Mis tareas", "Deep Work", "Seguimiento"]);
  assert.deepEqual(mods("revisar"), ["Weekly Review", "Execution Health", "Performance", "Historial"]);
  assert.deepEqual(mods("aprender"), ["RGT Academy", "Ruta Guiada", "Casos Prácticos"]);
  assert.deepEqual(mods("configuracion"), ["IA / Cohere", "Datos y Backup", "Preferencias"]);
});
t("URLs canónicas normalizadas /execution/<grupo>/<módulo>", () => {
  const expect = {dashboard: "execution", "group:planificar": "execution/planificar", planning: "execution/planificar/planning", board: "execution/planificar/board", initiatives: "execution/planificar/iniciativas", "must-win": "execution/planificar/must-win",
    tasks: "execution/ejecutar/tareas", "deep-work": "execution/ejecutar/deep-work", "follow-up": "execution/ejecutar/seguimiento", review: "execution/revisar/weekly-review", "execution-health": "execution/revisar/execution-health", performance: "execution/revisar/performance", history: "execution/revisar/historial",
    academy: "execution/aprender/academy", "guided-routes": "execution/aprender/rutas", cases: "execution/aprender/casos", "ai-settings": "execution/configuracion/ia", backup: "execution/configuracion/datos", preferences: "execution/configuracion/preferencias", assistant: "execution/asistente"};
  for (const [v, p] of Object.entries(expect)) assert.equal(pathFor(v), p, v);
});
t("cada ruta es única y hace ida y vuelta (view → URL → view); ningún enlace huérfano", () => {
  const routes = allRoutes(), paths = routes.map(r => r.path);
  assert.equal(new Set(paths).size, paths.length, "URLs duplicadas");
  assert.equal(new Set(routes.map(r => r.view)).size, routes.length, "dos lugares para la misma vista");
  for (const r of routes) { const x = resolveHash("#/" + r.path); assert.equal(x.view, r.view); assert.equal(x.unknown, false); assert.equal(x.legacy, false); assert.equal(x.canonical, "#/" + r.path); }
});
t("compatibilidad: toda URL antigua resuelve y se normaliza; Alertas se absorbió en Seguimiento", () => {
  for (const v of LEGACY_VIEWS) { const r = resolveHash("#/" + v); assert.equal(r.unknown, false, v); assert.equal(r.legacy, true, v); assert.ok(r.canonical.startsWith("#/execution"), v); assert.ok(allViews().includes(r.view), v); }
  assert.equal(resolveHash("#/alerts").view, "follow-up"); assert.equal(ALIASES.alerts, "follow-up");
  assert.equal(resolveHash("#/board?initiative=T001").canonical, "#/execution/planificar/board?initiative=T001");
  const u = resolveHash("#/no-existe"); assert.equal(u.unknown, true); assert.equal(u.view, "dashboard");
  assert.equal(resolveHash("#/execution/planificar/zzz").unknown, true); assert.equal(resolveHash("").view, "dashboard"); assert.equal(parseRoute("#/execution/revisar/historial").view, "history");
});
t("params se conservan; buildRoute ignora vacíos", () => {
  assert.deepEqual(resolveHash("#/execution/ejecutar/tareas?pillar=RUN&mustWin=1").params, {pillar: "RUN", mustWin: "1"});
  assert.equal(buildRoute("tasks", {pillar: "RUN", q: "", x: null}), "#/execution/ejecutar/tareas?pillar=RUN");
});
t("breadcrumbs: EXECUTION OS / GRUPO / MÓDULO / extra, el último sin enlace, todos los anteriores enlazan", () => {
  const b = breadcrumbs(resolveHash("#/execution/planificar/board"), "Iniciativa · T001");
  assert.deepEqual(b.map(x => x.label), ["EXECUTION OS", "Planificar", "RGT Board", "Iniciativa · T001"]);
  assert.equal(b.at(-1).href, null); assert.ok(b.slice(0, -1).every(x => x.href));
  assert.equal(b[1].href, "#/execution/planificar"); assert.equal(b[2].href, "#/execution/planificar/board");
  assert.deepEqual(breadcrumbs(resolveHash("#/execution")).map(x => x.label), ["EXECUTION OS", "Command Center"]);
  assert.deepEqual(breadcrumbs(resolveHash("#/execution/revisar")).map(x => x.label), ["EXECUTION OS", "Revisar"]);
  assert.deepEqual(breadcrumbs(resolveHash("#/execution/asistente")).map(x => x.label), ["EXECUTION OS", "RGT Assistant"]);
  for (const r of allRoutes()) { const bc = breadcrumbs(resolveHash("#/" + r.path)); assert.equal(bc.at(-1).href, null, r.path); assert.ok(bc.length >= 2); }
});
t("cada módulo del menú tiene un renderer en app.js (ROUTES) y viceversa", () => {
  const app = fs.readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  const block = app.slice(app.indexOf("export const ROUTES = {"), app.indexOf("const GROUP_ROUTE"));
  const keys = [...block.matchAll(/^\s{2}"?([a-z-]+)"?: \{label:/gm)].map(m => m[1]);
  const navViews = allViews().filter(v => !v.startsWith("group:"));
  for (const v of navViews) assert.ok(keys.includes(v), `sin renderer: ${v}`);
  for (const k of keys) assert.ok(navViews.includes(k), `ruta sin entrada de menú (huérfana): ${k}`);
  assert.ok(app.includes("routeFor") && app.includes("group:"));
});
t("locate() devuelve grupo y módulo; aliases incluidos", () => {
  assert.equal(locate("board").group.id, "planificar"); assert.equal(locate("alerts").module.view, "follow-up"); assert.equal(locate("assistant").group, null); assert.equal(locate("nope"), null);
  assert.equal(UTILITIES.length, 1);
});

/* ===== Context System ===== */
t("cada sección, grupo y módulo tiene contexto con las preguntas universales", () => {
  for (const r of allRoutes()) {
    const c = reg.contextForView(r.view); assert.ok(c, `sin contexto: ${r.view}`);
    assert.ok(c.shortDescription && c.recommendedFirstAction && c.successCheck, `incompleto: ${r.view}`);
    const h = renderWhereAmI(c, []);
    for (const q of ["¿Dónde estoy?", "¿Qué es esto?", "¿Qué debería hacer primero?", "¿Cómo sé si lo hice correctamente?"]) assert.ok(h.includes(q), `${r.view}: ${q}`);
  }
});
t("los 6 grupos + módulos nuevos tienen contexto completo (propósito, qué puedo hacer, por qué importa)", () => {
  for (const id of ["command-center", "planificar", "ejecutar", "revisar", "aprender", "configuracion"]) { const c = reg.get("context", `section.${id}`); assert.equal(c.type, "SECTION", id); assert.ok(c.purpose && c.whatYouCanDo?.length >= 2, id); }
  for (const id of ["module.planificar.initiatives", "module:must-win", "module.ejecutar.tasks", "module.ejecutar.follow-up", "module.aprender.routes", "module.aprender.cases", "module.configuracion.preferences"]) { const c = reg.get("context", id); assert.equal(c.type, "MODULE", id); assert.ok(c.purpose && c.whatYouCanDo?.length >= 1, id); }
  assert.deepEqual(reg.validateIntegrity(), []);
  assert.ok(renderWhereAmI(reg.get("context", "section.planificar"), [], {parents: [{title: "Execution OS"}], nextStep: {title: "Hacer X", why: "porque", view: "board", label: "Ir"}}).includes("Tu siguiente paso recomendado"));
});
t("intro universal reutiliza el componente de Fase 1 y muestra «cómo sé si lo hice bien» en nivel 3", () => {
  const c = reg.get("context", "module:must-win");
  assert.ok(!renderIntro(c, {mode: "expanded", level: 1}).includes("¿Cómo sé si lo hice correctamente?"));
  assert.ok(renderIntro(c, {mode: "expanded", level: 3}).includes("¿Cómo sé si lo hice correctamente?"));
  assert.equal(reg.contextForView("must-win").id, "module:must-win");
});
t("Academy: cursos pedidos y rutas próximas son datos honestos (no rutas ni lecciones inventadas)", () => {
  assert.deepEqual(COURSES.map(c => c.title), ["Fundamentos RGT", "RUN / GROW / TRANSFORM", "Planning", "WIP", "Must-Win", "DoR / DoD", "Deep Work", "Weekly Review"]);
  for (const c of COURSES) for (const id of c.lessons) assert.ok(reg.get("lesson", id), `lección inexistente ${id}`);
  assert.equal(PLANNED_ROUTES.length, 6); for (const p of PLANNED_ROUTES) assert.equal(reg.get("route", p.id), null, "una ruta próxima no puede estar registrada como real");
});

/* ===== Preferencias de navegación ===== */
await (async () => {
  const ad = createMemoryAdapter(); let p = await createProgressStore(ad).load();
  t("prefs de nav/ux: defaults, validación y sanitización", () => {
    assert.deepEqual(p.navPrefs(), {collapsed: {}, lastRoute: null}); assert.equal(p.uxPrefs().learningMode, "standard"); assert.equal(p.uxPrefs().startPage, "command-center");
    assert.throws(() => p.setUxPrefs({learningMode: "x"})); assert.throws(() => p.setUxPrefs({startPage: "x"}));
    p.setNavPrefs({lastRoute: "javascript:alert(1)"}); assert.equal(p.navPrefs().lastRoute, null); p.setNavPrefs({lastRoute: "https://evil.example"}); assert.equal(p.navPrefs().lastRoute, null);
  });
  p.setNavPrefs({collapsed: {planificar: false, revisar: true}, lastRoute: "#/execution/revisar/historial"}); p.setUxPrefs({learningMode: "expert", startPage: "last"}); p.setGuidePrefs({hidden: true});
  await p.flush(); p = await createProgressStore(ad).load();
  t("navegación, preferencias y guía persisten tras cerrar/reabrir", () => {
    assert.deepEqual(p.navPrefs().collapsed, {planificar: false, revisar: true}); assert.equal(p.navPrefs().lastRoute, "#/execution/revisar/historial");
    assert.equal(p.uxPrefs().learningMode, "expert"); assert.equal(p.uxPrefs().startPage, "last"); assert.equal(p.guidePrefs().hidden, true);
  });
})();

/* ===== Engines nuevos (composición de los existentes) ===== */
const I = (o = {}) => ({id: "X1", title: "t", description: "d", pillar: "RUN", status: "READY", owner: "o", objective: "o", success_criteria: "s", dependencies: "Ninguna", priority: "Media", ...o});
const base = (over = {}) => {
  const items = [I({id: "R1", pillar: "RUN", status: "IN_PROGRESS"}), I({id: "G1", pillar: "GROW", status: "IN_PROGRESS"}), I({id: "T1", pillar: "TRANSFORM", status: "IN_PROGRESS"})];
  return {sprints: [{id: "S1", week_number: 1, status: "ACTIVE", start_date: "2026-09-28", end_date: "2026-10-04", must_win_ids: ["R1", "G1", "T1"]}], initiatives: items, checklist: [], evidence: [], activity: [], reviews: [], ...over};
};
const NOW = new Date("2026-10-02T10:00:00");
t("siguiente paso: prioridad de reglas", () => {
  assert.equal(getNextAction(base({sprints: []}), NOW).id, "no-sprint");
  assert.equal(getNextAction(base(), new Date("2026-10-10T10:00:00")).id, "sprint-overdue");
  const over = base(); over.initiatives.push(I({id: "T2", pillar: "TRANSFORM", status: "IN_PROGRESS"}), I({id: "T3", pillar: "TRANSFORM", status: "BLOCKED"})); assert.equal(getNextAction(over, NOW).id, "wip-over");
  const two = base(); two.sprints[0].must_win_ids = ["R1", "G1"]; assert.equal(getNextAction(two, NOW).id, "define-must-win");
  const dup = base(); dup.sprints[0].must_win_ids = ["R1", "G1", "R1"]; assert.equal(getNextAction(dup, NOW).id, "define-must-win");
  const blocked = base(); blocked.initiatives[1].status = "BLOCKED"; assert.equal(getNextAction(blocked, NOW).id, "unblock-must-win");
  const backlog = base(); backlog.initiatives[2].status = "BACKLOG"; assert.equal(getNextAction(backlog, NOW).id, "prepare-must-win");
  const ready = base(); ready.initiatives[0].status = "READY"; assert.equal(getNextAction(ready, NOW).id, "start-must-win");
  const adv = getNextAction(base(), NOW); assert.equal(adv.id, "advance-must-win"); assert.equal(adv.cta.view, "deep-work");
  const runOnly = base(); runOnly.initiatives[1].status = "DONE"; runOnly.initiatives[2].status = "DONE"; const r = getNextAction(runOnly, NOW); assert.equal(r.id, "advance-must-win"); assert.equal(r.cta.view, "tasks");
  const done = base(); done.initiatives.forEach(x => (x.status = "DONE")); assert.equal(getNextAction(done, NOW).id, "weekly-review");
  for (const s of [base({sprints: []}), base(), done]) { const a = getNextAction(s, NOW); assert.ok(a.title && a.why && a.cta.label && a.cta.view); assert.ok(allViews().includes(a.cta.view), a.cta.view); }
});
t("siguiente paso: no escribe ni muta y no calcula cifras comerciales", () => {
  const s = base(), copy = JSON.stringify(s); getNextAction(s, NOW); assert.equal(JSON.stringify(s), copy);
  const src = fs.readFileSync(new URL("../js/engines/nextActionEngine.js", import.meta.url), "utf8"); assert.ok(!/forecast|pacing|reforecast|recovery|revenue|target/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "")));
});
t("seguimiento: retrasadas, bloqueadas, próximas, carry-over, sin movimiento, DoD", () => {
  const d = base(); d.initiatives[0].status = "BLOCKED"; d.initiatives.push(I({id: "P1", status: "READY", created_at: "2026-09-01T00:00:00"}), I({id: "C1", status: "READY"}));
  d.activity = [{id: "a", entity_id: "G1", timestamp: "2026-10-02T09:00:00", action: "X"}]; d.reviews = [{id: "RV1", sprint_id: "S0", carry_over_ids: ["C1", "G1"]}];
  d.checklist = [{id: "c1", task_id: "G1", category: "DOD", is_completed: false}, {id: "c2", task_id: "G1", category: "DOD", is_completed: true}];
  const f = buildFollowUp(d, NOW);
  assert.deepEqual(f.blocked.map(x => x.id), ["R1"]); assert.deepEqual(f.upcoming.map(x => x.id).sort(), ["C1", "P1"]); assert.deepEqual(f.carryOver.map(x => x.id).sort(), ["C1", "G1"]);
  assert.ok(f.stale.some(r => r.initiative.id === "P1" && r.days > 5)); assert.ok(!f.stale.some(r => r.initiative.id === "G1")); assert.ok(f.stale.some(r => r.initiative.id === "T1" && r.days == null));
  assert.equal(f.pendingDod.length, 1); assert.equal(f.pendingDod[0].pending.length, 1); assert.equal(f.overdueSprint, false); assert.equal(f.overdue.length, 0);
  const late = buildFollowUp(d, new Date("2026-10-09T10:00:00")); assert.equal(late.overdueSprint, true); assert.equal(late.overdue.length, 5);
  assert.equal(buildFollowUp({initiatives: [], sprints: []}, NOW).blocked.length, 0);
});
t("mis tareas: solo accionables, filtros, orden (bloqueadas y Must-Win primero)", () => {
  const d = base(); d.initiatives.push(I({id: "B1", status: "BACKLOG"}), I({id: "D1", status: "DONE"}), I({id: "K1", status: "BLOCKED", owner: "Ana", priority: "Baja"}));
  d.checklist = [{id: "c", task_id: "R1", category: "DOD", is_completed: false}];
  const all = buildMyTasks(d); assert.ok(!all.some(r => ["B1", "D1"].includes(r.initiative.id))); assert.equal(all[0].initiative.id, "K1");
  assert.deepEqual(buildMyTasks(d, {mustWin: "1"}).map(r => r.initiative.id).sort(), ["G1", "K1", "R1", "T1"].filter(x => x !== "K1"));
  assert.deepEqual(buildMyTasks(d, {owner: "Ana"}).map(r => r.initiative.id), ["K1"]); assert.deepEqual(buildMyTasks(d, {status: "BLOCKED"}).map(r => r.initiative.id), ["K1"]); assert.deepEqual(buildMyTasks(d, {pillar: "GROW"}).map(r => r.initiative.id), ["G1"]);
  assert.equal(buildMyTasks(d, {q: "r1"})[0].dodPending, 1); assert.equal(buildMyTasks(d)[0].dueLabel, "2026-10-04");
});

/* ===== Reglas de negocio intactas tras la reorganización ===== */
t("WIP: TRANSFORM ≤ 2; un tercer proyecto activo (o BLOCKED) se bloquea", () => {
  assert.equal(WIP_LIMIT, 2);
  const items = [I({id: "a", pillar: "TRANSFORM", status: "IN_PROGRESS"}), I({id: "b", pillar: "TRANSFORM", status: "BLOCKED"})];
  assert.equal(canStartTask(I({id: "c", pillar: "TRANSFORM", status: "IN_PROGRESS"}), items).allowed, false);
  assert.equal(canStartTask(I({id: "c", pillar: "TRANSFORM", status: "BLOCKED"}), items).allowed, false);
  assert.equal(canStartTask(I({id: "c", pillar: "TRANSFORM", status: "IN_PROGRESS"}), items.slice(0, 1)).allowed, true);
  assert.equal(validateTransition(I({id: "c", pillar: "TRANSFORM", status: "READY"}), "IN_PROGRESS", {initiatives: items, checklist: [{task_id: "c", category: "DOD"}]}).allowed, false);
});
t("DoD: no se cierra con DoD incompleto; Ready; Must-Win; Sprint; Review", () => {
  const task = I({id: "c", status: "IN_PROGRESS"});
  assert.equal(canCompleteTask(task, [{id: "1", task_id: "c", category: "DOD", required: true, is_completed: false}], []).allowed, false);
  assert.equal(canCompleteTask(task, [{id: "1", task_id: "c", category: "DOD", required: true, is_completed: true}], []).allowed, true);
  assert.equal(canStartTaskReady(I({id: "c", objective: ""}), [{task_id: "c", category: "DOD"}]).allowed, false); assert.equal(canStartTaskReady(I({id: "c"}), []).allowed, false); assert.equal(canStartTaskReady(I({id: "c"}), [{task_id: "c", category: "DOD"}]).allowed, true);
  const items = [I({id: "r", pillar: "RUN"}), I({id: "g", pillar: "GROW"}), I({id: "t", pillar: "TRANSFORM"}), I({id: "r2", pillar: "RUN"})];
  assert.equal(validateMustWins(["r", "g", "t"], items).allowed, true); assert.equal(validateMustWins(["r", "r2", "t"], items).allowed, false); assert.equal(validateMustWins(["r", "g"], items).allowed, false);
  assert.equal(validateNewSprint([{status: "ACTIVE"}], {week_number: 2, start_date: "a", end_date: "b"}).allowed, false); assert.equal(validateNewSprint([], {week_number: 2, start_date: "2026-01-02", end_date: "2026-01-01"}).allowed, false);
  assert.equal(validateReviewInput({must_win_completed: "x", blocked_reason: "", next_week: "x", learning: "x"}).allowed, false);
  assert.equal(validateReviewInput({must_win_completed: "x", blocked_reason: "x", next_week: "x", learning: "x"}).allowed, true);
});
t("la capa de navegación no contiene lógica comercial ni reglas duplicadas", () => {
  for (const f of ["core/nav.js", "ui/shell.js", "ui/commandCenter.js", "ui/groupLanding.js"]) { const s = fs.readFileSync(new URL("../js/" + f, import.meta.url), "utf8"); assert.ok(!/forecast|pacing|reforecast|recovery/i.test(s), f); assert.ok(!/IN_PROGRESS.*<=?\s*2|WIP_LIMIT\s*=/.test(s), f); }
});

console.log(`PHASE NAV-2 TESTS: PASS (${n} tests)`);
