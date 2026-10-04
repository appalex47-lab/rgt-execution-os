// Real-browser e2e (Chromium via Playwright). Run: node tests/e2e/rgt-e2e.mjs
// Playwright is resolved from PLAYWRIGHT_DIR or the global npm dir (ESM ignores NODE_PATH).
import {createRequire} from "node:module";
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import {fileURLToPath} from "node:url";
const req = createRequire(import.meta.url);
const {chromium} = req(process.env.PLAYWRIGHT_DIR || "/home/claude/.npm-global/lib/node_modules/playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"};
const PORT = 4101, URL = `http://localhost:${PORT}/`;
const server = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split("?")[0])); if (p.endsWith(path.sep)) p += "index.html"; fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, {"content-type": mime[path.extname(p)] || "text/plain"}); r.end(d); } }); }).listen(PORT);
const browser = await chromium.launch();
const rows = []; let failed = 0;
const IGNORE = /ERR_TUNNEL|ERR_NAME|ERR_INTERNET|net::ERR|404 \(Not Found\)|fonts\.g/;

async function fresh(viewport) {
  const context = await browser.newContext({viewport: viewport || {width: 1280, height: 900}});
  const page = await context.newPage(); const errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error" && !IGNORE.test(m.text())) errs.push(m.text()); });
  page.on("dialog", d => d.accept());
  page.errs = errs; return page;
}
async function open(page, hash = "#/dashboard") { await page.goto(URL + hash); await page.waitForSelector("#rgt-fab, #view h1, #view .head"); await page.waitForTimeout(150); }
const dbAll = (page, s) => page.evaluate(async s => (await import("/js/db/indexedDB.js")).db.all(s), s);
async function flushLearning(page) { await page.evaluate(async () => (await import("/js/learning/index.js")).progress.flush()); }
async function check(name, fn) {
  const page = await fresh();
  try { await fn(page); if (page.errs.length) throw new Error("errores de consola: " + page.errs.join(" | ")); rows.push([name, "PASS", ""]); }
  catch (e) { failed++; rows.push([name, "FAIL", String(e.message).split("\n")[0].slice(0, 200)]); }
  finally { await page.context().close(); }
}
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || "eq"}: esperado ${JSON.stringify(b)}, obtenido ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m || "assert"); };
const VIEWS = ["dashboard", "board", "planning", "deep-work", "review", "history", "alerts", "execution-health", "performance", "assistant", "ai-settings", "academy", "backup"];

await check("Regresión: las 13 vistas renderizan sin errores", async p => {
  await open(p);
  for (const v of VIEWS) { await p.evaluate(v => (location.hash = "#/" + v), v); await p.waitForTimeout(120); const t = await p.locator("#view").innerText(); ok(t.length > 40, `${v} vacío`); ok(!/No se pudo mostrar/.test(t), `${v} falló: ${t.slice(0, 80)}`); }
});
await check("Navegación: sidebar activa y crumb correctos", async p => {
  await open(p, "#/board"); eq(await p.locator("#crumb").innerText(), "RGT Board");
  await p.click('nav button[data-view="planning"]'); await p.waitForTimeout(150); eq(await p.locator("#crumb").innerText(), "Planning Semanal");
  ok(await p.locator('nav button[data-view="planning"].active').count() === 1);
});
await check("Intro de sección: expandida por defecto en Board con 5 preguntas de contexto", async p => {
  await open(p, "#/board"); const i = p.locator('[data-rgt-intro="section:board"]');
  ok(await i.locator(".rgt-intro--expanded").count() + (await i.evaluate(e => e.classList.contains("rgt-intro--expanded") ? 1 : 0)) >= 1);
  ok(/Limitar|tablero donde se mueve/.test(await i.innerText()));
});
await check("Intro: minimizar / ocultar / reabrir / Entendido y persistencia tras recargar (IndexedDB)", async p => {
  await open(p, "#/board"); const i = '[data-rgt-intro="section:board"]';
  await p.click(`${i} [data-rgt-intro-action="minimize"]`); ok(await p.locator(`${i}.rgt-intro--minimized`).count() === 1);
  await p.click(`${i} [data-rgt-intro-action="expand"]`); ok(await p.locator(`${i}.rgt-intro--expanded`).count() === 1);
  await p.click(`${i} [data-rgt-intro-action="more"]`); ok(await p.locator(`${i} [data-level="2"]`).count() === 1, "nivel 2");
  await p.click(`${i} [data-rgt-intro-action="more"]`); await p.click(`${i} [data-rgt-intro-action="more"]`); await p.click(`${i} [data-rgt-intro-action="more"]`);
  const txt = await p.locator(i).innerText(); ok(/ejemplo/i.test(txt), "nivel 4 con ejemplo"); ok(/aprender más/i.test(txt) && /Introducción a WIP/.test(txt), "nivel 5 con relaciones resueltas");
  ok(await p.locator(`${i} [data-rgt-intro-action="more"]`).count() === 0, "sin 'Ver más' en el último nivel");
  await p.click(`${i} [data-rgt-intro-action="hide"]`); ok(await p.locator(`${i}.rgt-intro--hidden`).count() === 1);
  await flushLearning(p); await p.reload(); await p.waitForSelector(i);
  ok(await p.locator(`${i}.rgt-intro--hidden`).count() === 1, "oculta tras reload");
  const rec = (await dbAll(p, "prefs")).find(r => r.id === "context"); eq(rec.intro["section:board"], "hidden"); eq(rec.level["section:board"], 5);
  await p.click(`${i} [data-rgt-intro-action="expand"]`); ok(await p.locator(`${i}.rgt-intro--expanded`).count() === 1, "reabrir");
  await p.click(`${i} .rgt-intro-actions .btn.primary`); ok(await p.locator(`${i}.rgt-intro--hidden`).count() === 1, "Entendido oculta");
});
await check("Secciones del legado se adoptan minimizadas (no estorban)", async p => {
  await open(p, "#/history"); ok(await p.locator('[data-rgt-intro="section:history"].rgt-intro--minimized').count() === 1);
});
await check("Módulo Must-Win en Planning reutiliza el mismo sistema de intro", async p => {
  await open(p, "#/planning"); const i = '[data-rgt-intro="module:must-win"]'; ok(await p.locator(i).count() === 1);
  ok(!/1 RUN \+ 1 GROW/.test(await p.locator(i).innerText()), "nivel 1 no muestra la regla todavía");
  await p.click(`${i} [data-rgt-intro-action="more"]`); await p.click(`${i} [data-rgt-intro-action="more"]`);
  ok(/1 RUN \+ 1 GROW \+ 1 TRANSFORM/.test(await p.locator(i).innerText()), "regla visible en nivel 3");
  await p.click(`${i} [data-rgt-intro-action="hide"]`); ok(await p.locator(`${i}.rgt-intro--hidden`).count() === 1);
});
await check("Ayuda contextual: popover en campo y chip WIP; cierra al hacer clic fuera", async p => {
  await open(p, "#/board");
  const chipHelp = p.locator('.rgt-help-btn[data-rgt-help="component:wip-chip"]'); await chipHelp.click();
  eq(await chipHelp.getAttribute("aria-expanded"), "true"); ok(await p.locator("#rgt-help-component_wip-chip").isVisible());
  await p.click("h1"); eq(await chipHelp.getAttribute("aria-expanded"), "false");
  await p.click("#new-initiative"); await p.locator('.rgt-help-btn[data-rgt-help="field:initiative-success-criteria"]').click();
  const body = p.locator("#rgt-help-field_initiative-success-criteria"); ok(await body.isVisible());
  const t = await body.innerText(); ok(/Reducir errores críticos del checkout a 0/.test(t) && /Trabajar en checkout/.test(t) && /Permite evaluar/.test(t), t);
});
await check("Botón flotante: abrir, pestañas, minimizar, recordar estado, Escape, ocultar y recuperar con «?»", async p => {
  await open(p, "#/board"); const fab = p.locator("#rgt-fab"); ok(await fab.isVisible());
  eq(await fab.getAttribute("aria-expanded"), "false"); await fab.click(); ok(await p.locator("#rgt-panel").isVisible());
  eq(await p.locator("#rgt-panel").getAttribute("aria-modal"), "false");
  const here = await p.locator("#rgt-panel").innerText(); for (const q of ["¿Dónde estoy?", "¿Qué es esto?", "¿Para qué sirve?", "¿Qué puedo hacer aquí?", "¿Qué debería hacer primero?"]) ok(here.includes(q), q);
  await p.click('[data-g-tab="routes"]'); ok(/Demo — Crear iniciativa/.test(await p.locator("#rgt-panel").innerText()));
  await p.click('[data-g-tab="progress"]'); ok(/Lecciones/.test(await p.locator("#rgt-panel").innerText()));
  await p.keyboard.press("Escape"); ok(await p.locator("#rgt-panel").count() === 0, "Escape cierra"); ok((await p.evaluate(() => document.activeElement.id)) === "rgt-fab", "foco vuelve al botón");
  await fab.click(); await p.click('[data-g="minimize"]'); ok(await p.locator("#rgt-fab.is-min").count() === 1);
  await flushLearning(p); await p.reload(); await p.waitForSelector("#rgt-fab"); ok(await p.locator("#rgt-fab.is-min").count() === 1, "minimizado persiste");
  await p.click("#rgt-fab"); await p.click('[data-g="hide-fab"]'); ok(await p.locator("#rgt-fab").count() === 0, "oculto");
  await p.click("#guide"); ok(await p.locator("#rgt-panel").isVisible(), "«?» recupera la guía"); ok(await p.locator("#rgt-fab").count() === 1);
});
await check("Accesibilidad por teclado: Tab llega al botón, Enter abre, el foco entra al panel", async p => {
  await open(p, "#/board"); await p.focus("#rgt-fab"); await p.keyboard.press("Enter");
  ok(await p.locator("#rgt-panel").isVisible()); ok((await p.evaluate(() => document.activeElement.closest("#rgt-panel") != null)), "foco dentro del panel");
  ok(await p.locator("#rgt-panel [aria-label]").count() >= 2);
});

async function startDemo(p) {
  await p.click("#rgt-fab"); await p.click('[data-g-tab="routes"]'); await p.click('[data-start-route="demo-create-initiative"]');
  await p.waitForSelector("#rgt-tour");
}
const tourTitle = p => p.locator("#rgt-tour-t").innerText();
await check("Ruta guiada demo completa: validación por engines, TRANSFORM vs RUN, creación real, COMPLETED en IndexedDB", async p => {
  await open(p, "#/dashboard"); await startDemo(p);
  ok(await p.locator("#rgt-tour").getAttribute("aria-modal") === "false"); ok(await p.locator("#rgt-tour [aria-live=polite]").count() === 1);
  await p.waitForTimeout(300); eq(await p.evaluate(() => location.hash), "#/board", "la ruta navega a la vista del paso");
  eq(await tourTitle(p), "Este es el Board"); ok(await p.locator(".rgt-target-highlight").count() === 1, "target resaltado");
  await p.click('[data-t="next"]'); eq(await tourTitle(p), "Mira el WIP"); ok(await p.locator('[data-rgt-target="wip-chip"].rgt-target-highlight').count() === 1);
  await p.click('[data-t="next"]'); eq(await tourTitle(p), "Abre el formulario");
  ok(await p.locator('[data-t="next"]').isDisabled(), "acción requerida bloquea Continuar");
  await p.click("#new-initiative"); await p.waitForSelector("#c-pillar"); ok(await p.locator('[data-t="next"]').isEnabled(), "click validado");
  await p.click('[data-t="next"]'); eq(await tourTitle(p), "Selecciona TRANSFORM");
  await p.selectOption("#c-pillar", "GROW"); await p.waitForTimeout(100);
  ok(/Todavía no[\s\S]*TRANSFORM[\s\S]*estructuralmente/.test(await p.locator("#rgt-tour").innerText()), "explica el error"); ok(await p.locator('[data-t="next"]').isDisabled());
  await p.selectOption("#c-pillar", "TRANSFORM"); await p.waitForTimeout(100);
  ok(/✓ Correcto/.test(await p.locator("#rgt-tour").innerText())); await p.click('[data-t="next"]');
  eq(await tourTitle(p), "Piensa en el DoD"); ok(await p.locator('[data-t="skip"]').count() === 1, "paso opcional ofrece Omitir"); await p.click('[data-t="skip"]');
  eq(await tourTitle(p), "Crea la iniciativa");
  await p.fill("#c-title", "Automatizar captura de compras"); await p.fill("#c-owner", "Dev"); await p.fill("#c-description", "Captura manual de datos de compras");
  await p.fill("#c-objective", "Automatizar captura"); await p.fill("#c-success", "Cero captura manual"); await p.fill("#c-dod", "Pipeline validado en producción");
  await p.click("#create-task"); await p.waitForTimeout(500);
  ok(/Iniciativa [A-Z]\d+ creada/.test(await p.locator("#rgt-tour").innerText()), "validado contra IndexedDB");
  const created = (await dbAll(p, "initiatives")).find(x => x.title === "Automatizar captura de compras"); ok(created && created.pillar === "TRANSFORM" && created.status === "BACKLOG");
  await p.click('[data-t="next"]'); eq(await tourTitle(p), "Listo"); ok(/Terminar/.test(await p.locator('[data-t="next"]').innerText()));
  await p.click('[data-t="next"]'); ok(await p.locator("#rgt-tour").count() === 0, "tour cerrado al terminar");
  await flushLearning(p); const r = (await dbAll(p, "learning")).find(x => x.id === "route:demo-create-initiative");
  eq(r.status, "COMPLETED"); ok(r.completedAt && r.startedAt); ok(r.completedSteps.length >= 6);
  await p.reload(); await p.waitForSelector("#rgt-fab"); await p.click("#rgt-fab"); await p.click('[data-g-tab="routes"]');
  ok(/Completada/.test(await p.locator("#rgt-panel").innerText()), "completada persiste tras reload");
});
await check("Ruta: cerrar guarda avance (PAUSED) y tras recargar se reanuda en el mismo paso; pausar/reanudar", async p => {
  await open(p, "#/board"); await startDemo(p); await p.click('[data-t="next"]'); eq(await tourTitle(p), "Mira el WIP");
  await p.click('[data-t="pause"]'); ok(/Guía en pausa/.test(await p.locator("#rgt-tour").innerText())); ok(await p.locator('[data-t="next"]').isDisabled());
  await p.click('[data-t="resume"]'); ok(await p.locator('[data-t="next"]').isEnabled());
  await p.keyboard.press("Escape"); ok(await p.locator("#rgt-tour").count() === 0, "Escape cierra la guía");
  await flushLearning(p); let r = (await dbAll(p, "learning")).find(x => x.id === "route:demo-create-initiative"); eq(r.status, "PAUSED"); eq(r.currentStep, "s2-wip");
  await p.reload(); await p.waitForSelector("#rgt-fab"); await p.click("#rgt-fab"); await p.click('[data-g-tab="routes"]');
  ok(/En pausa · 1\/7 pasos/.test(await p.locator("#rgt-panel").innerText()), "estado visible"); await p.click('[data-start-route="demo-create-initiative"]');
  await p.waitForSelector("#rgt-tour"); eq(await tourTitle(p), "Mira el WIP", "reanuda en el paso guardado");
});
await check("Ruta: target inexistente se informa en el paso (sin romper la guía)", async p => {
  await open(p, "#/board"); await startDemo(p); await p.click('[data-t="next"]');
  await p.evaluate(() => { document.querySelector('[data-rgt-target="wip-chip"]').remove(); window.dispatchEvent(new CustomEvent("rgt:tour")); });
  await p.waitForTimeout(100); ok(/No encuentro este elemento/.test(await p.locator("#rgt-tour").innerText())); ok(await p.locator('[data-t="next"]').isEnabled(), "paso informativo sigue siendo continuable");
});
await check("Academy: lecciones del registro (demo + legado), completar, reiniciar, persistir y relacionar con ruta", async p => {
  await open(p, "#/academy"); const t = await p.locator("#view").innerText(); ok(/Introducción a WIP/.test(t) && /WIP y capacidad/.test(t) && /Demo técnico/.test(t));
  await p.click('[data-lesson="demo-intro-wip"]'); ok(await p.locator(".academy-modal [data-route]").count() === 1, "lección enlaza ruta");
  await p.click("[data-complete]"); await p.waitForTimeout(200); ok(/1\/\d+/.test(await p.locator(".academy-progress").innerText()));
  await flushLearning(p); await p.reload(); await p.waitForSelector(".academy-progress"); ok(/^1\//.test((await p.locator(".academy-progress strong").innerText()).trim()), "persiste tras reload");
  const rec = (await dbAll(p, "learning")).find(x => x.id === "lesson:demo-intro-wip"); eq(rec.status, "COMPLETED");
  await p.click('[data-lesson="demo-intro-wip"]'); await p.click("[data-complete]"); await p.waitForTimeout(200);
  eq((await p.locator(".academy-progress strong").innerText()).trim().split("/")[0], "0", "reiniciar");
});
await check("Migración: progreso legado de localStorage pasa a IndexedDB sin pérdida", async p => {
  await p.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("rgt.academy.progress.v1", JSON.stringify({"foundations-wip": true, "weekly-mustwin": true})); sessionStorage.setItem("seeded", "1"); } });
  await open(p, "#/academy"); await flushLearning(p);
  const l = await dbAll(p, "learning"); ok(l.find(x => x.id === "lesson:foundations-wip")?.status === "COMPLETED" && l.find(x => x.id === "lesson:weekly-mustwin")?.status === "COMPLETED");
  eq(await p.evaluate(() => localStorage.getItem("rgt.academy.progress.v1")), null); ok(/^2\//.test((await p.locator(".academy-progress strong").innerText()).trim()));
});
await check("Backup/restore: el progreso de aprendizaje viaja en el snapshot y sobrevive a la restauración", async p => {
  await open(p, "#/academy"); await p.click('[data-lesson="foundations-wip"]'); await p.click("[data-complete]"); await flushLearning(p);
  const res = await p.evaluate(async () => {
    const {db} = await import("/js/db/indexedDB.js"), {progress} = await import("/js/learning/index.js"), {buildBackup, validateBackup} = await import("/js/engines/backupEngine.js");
    const snap = await db.snapshot(); const b = buildBackup(snap, {source: "e2e"}); const v = validateBackup(JSON.parse(JSON.stringify(b)));
    progress.reset("lesson", "foundations-wip"); await progress.flush();
    await db.replaceSnapshot(b.data); await progress.load();
    return {valid: v.valid ?? v.ok, status: progress.statusOf("lesson", "foundations-wip"), hasLearning: b.data.learning.length};
  });
  ok(res.valid !== false, "backup válido"); eq(res.status, "COMPLETED"); ok(res.hasLearning >= 1);
});
await check("Regresión Board: el Gatekeeper sigue bloqueando (WIP/Ready/DoD) y BLOCKED sigue permitido", async p => {
  await open(p, "#/board");
  await p.selectOption('.status-select[data-id="T003"]', "IN_PROGRESS"); await p.waitForTimeout(300);
  eq((await dbAll(p, "initiatives")).find(x => x.id === "T003").status, "BACKLOG", "T003 no debe entrar (WIP 2/2 / no Ready)");
  await p.selectOption('.status-select[data-id="T002"]', "BLOCKED"); await p.waitForTimeout(300);
  eq((await dbAll(p, "initiatives")).find(x => x.id === "T002").status, "BLOCKED", "BLOCKED sigue consumiendo WIP");
  await p.selectOption('.status-select[data-id="G002"]', "DONE"); await p.waitForTimeout(300);
  ok((await dbAll(p, "initiatives")).find(x => x.id === "G002").status !== "DONE", "DONE sin DoD no se permite");
});
await check("Regresión Planning: guardar Must-Win", async p => {
  await open(p, "#/planning"); ok(await p.locator("[data-mw]").count() === 3); await p.click("#save-mustwins"); await p.waitForTimeout(300);
  ok(/guardadas/.test(await p.locator("#rgt-toast").innerText()), "toast de guardado");
});
await check("Regresión Deep Work: iniciar y pausar sesión", async p => {
  await open(p, "#/deep-work"); await p.click("#dw-start"); await p.waitForTimeout(400);
  ok(await p.locator("#dw-pause").isEnabled(), "pausa habilitada"); await p.click("#dw-pause"); await p.waitForTimeout(200);
  ok((await dbAll(p, "deepWork")).length >= 2, "sesión persistida");
});
await check("Regresión Weekly Review: vista y acciones presentes", async p => {
  await open(p, "#/review"); ok(await p.locator("#save-review").count() === 1 && await p.locator("#save-carry").count() === 1);
});
await check("Regresión IndexedDB: v5 con 9 stores y semilla", async p => {
  await open(p, "#/dashboard");
  const info = await p.evaluate(async () => { const {db} = await import("/js/db/indexedDB.js"); return {v: db._db.version, s: [...db._db.objectStoreNames].sort()}; });
  eq(info.v, 5); eq(info.s.join(","), "activity,checklist,deepWork,evidence,initiatives,learning,prefs,reviews,sprints");
  ok((await dbAll(p, "initiatives")).length >= 7);
});
await check("Móvil 390×844: botón y panel caben, sin scroll horizontal", async () => {
  const p = await fresh({width: 390, height: 844}); try {
    await open(p, "#/board"); await p.click("#rgt-fab"); const box = await p.locator("#rgt-panel").boundingBox();
    ok(box.x >= 0 && box.x + box.width <= 390 + 1, `panel fuera de pantalla ${JSON.stringify(box)}`); ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "scroll horizontal");
    const fb = await p.locator("#rgt-fab").boundingBox(); ok(fb.height >= 44, "área táctil ≥44px");
    ok(p.errs.length === 0, p.errs.join("|"));
  } finally { await p.context().close(); }
});

console.log("| Check | Resultado | Detalle |\n|---|---|---|");
for (const r of rows) console.log(`| ${r[0]} | ${r[1]} | ${r[2].replace(/\|/g, "/")} |`);
console.log(`\nE2E: ${rows.length - failed}/${rows.length} PASS`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
