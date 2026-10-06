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
const PATHS = ["execution", "execution/planificar", "execution/planificar/planning", "execution/planificar/board", "execution/planificar/iniciativas", "execution/planificar/must-win", "execution/ejecutar", "execution/ejecutar/tareas", "execution/ejecutar/deep-work", "execution/ejecutar/seguimiento", "execution/revisar", "execution/revisar/weekly-review", "execution/revisar/execution-health", "execution/revisar/performance", "execution/revisar/historial", "execution/aprender", "execution/aprender/academy", "execution/aprender/rutas", "execution/aprender/casos", "execution/configuracion", "execution/configuracion/ia", "execution/configuracion/datos", "execution/configuracion/preferencias", "execution/asistente"];
const LEGACY = ["dashboard", "board", "planning", "deep-work", "review", "history", "alerts", "execution-health", "performance", "assistant", "ai-settings", "academy", "backup"];
const H = p => "#/execution" + (p ? "/" + p : "");

await check("Navegación: las 24 rutas canónicas (grupos y módulos) abren sin errores y con contexto", async p => {
  await open(p);
  for (const path of PATHS) { await p.evaluate(h => (location.hash = h), "#/" + path); await p.waitForTimeout(110); const t = await p.locator("#view").innerText(); ok(t.length > 40, `${path} vacío`); ok(!/No se pudo mostrar/.test(t), `${path} falló: ${t.slice(0, 80)}`);
    eq(await p.evaluate(() => location.hash), "#/" + path, "la URL canónica no debe cambiar"); ok(await p.locator("#view [data-rgt-intro]").count() >= 1, `${path} sin introducción de contexto`); }
});
await check("Navegación: URLs antiguas (#/board, #/review, #/alerts…) se normalizan y no quedan huérfanas", async p => {
  await open(p);
  for (const v of LEGACY) { await p.evaluate(h => (location.hash = h), "#/" + v); await p.waitForTimeout(120); ok(/^#\/execution/.test(await p.evaluate(() => location.hash)), `${v} no se normalizó`); ok(!/No se pudo mostrar/.test(await p.locator("#view").innerText()), v); }
  await p.evaluate(() => (location.hash = "#/alerts")); await p.waitForTimeout(150); eq(await p.evaluate(() => location.hash), "#/execution/ejecutar/seguimiento");
  await p.evaluate(() => (location.hash = "#/no-existe")); await p.waitForTimeout(150); eq(await p.evaluate(() => location.hash), "#/execution");
});
await check("Menú: seis grupos, submenús, activo, aria-current, clic navega y migas coinciden", async p => {
  await open(p);
  eq(await p.locator("#nav .nav-group, #nav .nav-single").count(), 6, "seis grupos"); ok(await p.locator('#nav a[href="#/execution/asistente"]').count() === 1, "utilidad Assistant");
  eq((await p.locator("#nav > .nav-title").innerText()), "EXECUTION OS");
  for (const [view, crumb] of [["board", "EXECUTION OS / PLANIFICAR / RGT BOARD"], ["deep-work", "EXECUTION OS / EJECUTAR / DEEP WORK"], ["history", "EXECUTION OS / REVISAR / HISTORIAL"], ["cases", "EXECUTION OS / APRENDER / CASOS PRÁCTICOS"], ["backup", "EXECUTION OS / CONFIGURACIÓN / DATOS Y BACKUP"]]) {
    const g = view === "board" ? "planificar" : view === "deep-work" ? "ejecutar" : view === "history" ? "revisar" : view === "cases" ? "aprender" : "configuracion";
    if ((await p.locator(`[data-nav-toggle="${g}"]`).getAttribute("aria-expanded")) !== "true") await p.click(`[data-nav-toggle="${g}"]`);
    await p.click(`#nav a[data-nav="${view}"]`); await p.waitForTimeout(150);
    eq((await p.locator("#crumb").innerText()).replace(/\s*\n\s*/g, " ").replace(/ \/ /g, " / ").replace("← ", "").trim(), crumb, view); eq(await p.locator("#nav a[aria-current='page']").getAttribute("data-nav"), view);
  }
  await p.click('#nav a[data-nav="dashboard"]'); await p.waitForTimeout(100); eq(await p.evaluate(() => location.hash), "#/execution"); eq((await p.locator("#crumb").innerText()).replace(/\s+/g, " ").trim(), "← EXECUTION OS / COMMAND CENTER");
});
await check("Migas: enlaces suben de nivel; el botón Atrás funciona; la miga del último nivel no es enlace", async p => {
  await open(p, H("planificar/board")); await p.click('#crumb a:has-text("Planificar")'); await p.waitForTimeout(150); eq(await p.evaluate(() => location.hash), H("planificar"));
  ok(await p.locator(".group-card").count() === 4, "landing con 4 módulos"); await p.click('.group-card:has-text("Must-Win")'); await p.waitForTimeout(150); eq(await p.evaluate(() => location.hash), H("planificar/must-win"));
  ok(await p.locator('#crumb [aria-current="page"]').innerText().then(t => /MUST-WIN/i.test(t))); ok(await p.locator('#crumb li:last-child a').count() === 0);
  await p.click("[data-crumb-back]"); await p.waitForTimeout(200); eq(await p.evaluate(() => location.hash), H("planificar"));
  await p.goBack(); await p.waitForTimeout(200); eq(await p.evaluate(() => location.hash), H("planificar/board"));
});
await check("Migas: la iniciativa abierta aparece como último nivel y se retira al cerrar", async p => {
  await open(p, H("planificar/iniciativas")); await p.click('[data-open-id="T001"]'); await p.waitForSelector("#initiative-modal"); await p.waitForTimeout(100);
  ok(/INICIATIVA/i.test(await p.locator("#crumb").innerText()), "miga de iniciativa"); await p.click("#close-modal"); await p.waitForTimeout(100); ok(!/INICIATIVA ·/i.test(await p.locator("#crumb").innerText()));
});
await check("Navegación persistente: grupos colapsados, última vista y recarga", async p => {
  await open(p, H("revisar/historial")); const t = p.locator('[data-nav-toggle="planificar"]'); eq(await t.getAttribute("aria-expanded"), "false");
  await t.click(); eq(await t.getAttribute("aria-expanded"), "true"); await flushLearning(p); await p.reload(); await p.waitForSelector("#nav a");
  eq(await p.evaluate(() => location.hash), H("revisar/historial"), "la URL conserva la vista"); eq(await p.locator('[data-nav-toggle="revisar"]').getAttribute("aria-expanded"), "true", "el grupo de la vista actual queda abierto"); eq(await p.locator('[data-nav-toggle="planificar"]').getAttribute("aria-expanded"), "false", "acordeón: solo un grupo abierto");
  const nav = (await dbAll(p, "prefs")).find(r => r.id === "nav"); eq(nav.lastRoute, H("revisar/historial")); eq(nav.collapsed.revisar, false); eq(nav.collapsed.planificar, true);
  await p.goto(URL + H("configuracion/preferencias")); await p.waitForSelector("#pref-start"); await p.selectOption("#pref-start", "last"); await flushLearning(p);
  await p.goto(URL); await p.waitForSelector("#nav a"); await p.waitForTimeout(200); eq(await p.evaluate(() => location.hash), H("configuracion/preferencias"), "abre en la última pantalla");
});
await check("Command Center es la pantalla inicial y su «Siguiente paso» navega al módulo correcto", async p => {
  await open(p, ""); eq(await p.evaluate(() => location.hash), "#/execution"); const ns = p.locator('[data-rgt-target="next-step"]'); ok(await ns.isVisible());
  const txt = await ns.innerText(); ok(/SIGUIENTE PASO/i.test(txt) && /¿Por qué\?/.test(txt), txt);
  for (const k of ["Sprint", "Must-Win", "WIP TRANSFORM", "Bloqueos", "DoD pendientes", "Execution Health"]) ok((await p.locator(".cc-kpis").innerText()).includes(k), k);
  ok(await p.locator('.cc-kpis .kpi').count() === 6, "resumen compacto: 6 señales");
  await p.click('[data-rgt-target="next-step-cta"]'); await p.waitForTimeout(200); ok(/^#\/execution\/(ejecutar|planificar|revisar)/.test(await p.evaluate(() => location.hash)));
});
await check("Command Center no es fuente comercial: sin forecast/pacing y sin panel comercial", async p => {
  await open(p, ""); const t = await p.locator("#view").innerText(); ok(!/forecast|pacing|reforecast|AOV target/i.test(t), "texto comercial"); eq(await p.locator(".commercial-context").count(), 0);
  await p.goto(URL + H("planificar/planning")); await p.waitForSelector(".commercial-context"); ok(/RevNavigator/.test(await p.locator(".commercial-context").innerText()), "contexto comercial solo-lectura vive en Planning");
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
await check("Módulo Must-Win (Planificar › Must-Win) reutiliza el mismo sistema de intro", async p => {
  await open(p, H("planificar/must-win")); const i = '[data-rgt-intro="module:must-win"]'; ok(await p.locator(i).count() === 1);
  ok(!/1 RUN \+ 1 GROW/.test(await p.locator(i).innerText()), "nivel 1 no muestra la regla todavía");
  await p.click(`${i} [data-rgt-intro-action="more"]`); await p.click(`${i} [data-rgt-intro-action="more"]`);
  ok(/1 RUN \+ 1 GROW \+ 1 TRANSFORM/.test(await p.locator(i).innerText()), "regla visible en nivel 3");
  await p.click(`${i} [data-rgt-intro-action="hide"]`); ok(await p.locator(`${i}.rgt-intro--hidden`).count() === 1);
});
await check("Ayuda contextual: popover en campo y chip WIP; cierra al hacer clic fuera", async p => {
  await open(p, H("planificar/iniciativas"));
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
  await p.waitForTimeout(300); eq(await p.evaluate(() => location.hash), H("planificar/iniciativas"), "la ruta navega a la vista del paso");
  eq(await tourTitle(p), "Estás en Iniciativas"); ok(await p.locator(".rgt-target-highlight").count() === 1, "target resaltado");
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
const passLesson = async (p, id, correct = true) => {
  await p.click(`[data-lesson="${id}"]`);
  const answers = await p.evaluate(async id => { const {registry} = await import("/js/learning/index.js"); return registry.get("lesson", id).questions.map(q => q.answer); }, id);
  for (let i = 0; i < answers.length; i++) { const n = (answers[i] + (correct ? 0 : 1)) % (await p.locator(`input[name="academy-q-${i}"]`).count()); await p.check(`input[name="academy-q-${i}"][value="${n}"]`); }
  await p.click("[data-evaluate]"); await p.waitForTimeout(250);
};
await check("Academy: lecciones del registro (demo + legado), completar, reiniciar, persistir y relacionar con ruta", async p => {
  await open(p, "#/academy"); const t = await p.locator("#view").innerText(); ok(/Introducción a WIP/.test(t) && /WIP y capacidad/.test(t) && /Tu aprendizaje/.test(t));
  await p.click('[data-lesson="demo-intro-wip"]'); ok(await p.locator(".academy-modal [data-route]").count() === 1, "lección enlaza ruta"); await p.click(".academy-modal [data-close]");
  ok(await p.locator('[data-rgt-target="academy-continue"] [data-lesson]').count() === 1, "bloque «Continuar» arriba");
  await passLesson(p, "foundations-wip", false); ok(/^0\//.test((await p.locator(".academy-progress strong").innerText()).trim()), "respuestas erróneas no dominan"); await p.keyboard.press("Escape");
  await p.click('[data-lesson="demo-intro-wip"]'); await p.click("[data-complete]"); await p.waitForTimeout(250); ok(/^1\//.test((await p.locator(".academy-progress strong").innerText()).trim()));
  await flushLearning(p); await p.reload(); await p.waitForSelector(".academy-progress"); ok(/^1\//.test((await p.locator(".academy-progress strong").innerText()).trim()), "persiste tras reload");
  const rec = (await dbAll(p, "learning")).find(x => x.id === "lesson:demo-intro-wip"); eq(rec.status, "COMPLETED");
});
await check("Migración: progreso legado de localStorage pasa a IndexedDB sin pérdida", async p => {
  await p.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("rgt.academy.progress.v1", JSON.stringify({"foundations-wip": true, "weekly-mustwin": true})); sessionStorage.setItem("seeded", "1"); } });
  await open(p, "#/academy"); await flushLearning(p);
  const l = await dbAll(p, "learning"); ok(l.find(x => x.id === "lesson:foundations-wip")?.status === "COMPLETED" && l.find(x => x.id === "lesson:weekly-mustwin")?.status === "COMPLETED");
  eq(await p.evaluate(() => localStorage.getItem("rgt.academy.progress.v1")), null); ok(/^2\//.test((await p.locator(".academy-progress strong").innerText()).trim()));
});
await check("Backup/restore: el progreso de aprendizaje viaja en el snapshot y sobrevive a la restauración", async p => {
  await open(p, "#/academy"); await passLesson(p, "foundations-wip"); await flushLearning(p);
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
await check("Planning Semanal conserva el Sprint (editar fechas/semana) y enlaza a Must-Win sin duplicarlo", async p => {
  await open(p, H("planificar/planning")); ok(await p.locator("#sp-week").count() === 1 && await p.locator("#close-sprint").count() === 1); eq(await p.locator("[data-mw]").count(), 0, "Must-Win ya no vive en Planning");
  await p.fill("#sp-week", "41"); await p.click("#save-sprint"); await p.waitForTimeout(300); eq((await dbAll(p, "sprints")).find(x => x.status === "ACTIVE").week_number, 41);
  await p.click('a:has-text("Ir a Must-Win")'); await p.waitForTimeout(200); eq(await p.evaluate(() => location.hash), H("planificar/must-win"));
});
await check("Must-Win: 1 RUN + 1 GROW + 1 TRANSFORM se guarda; falta uno → bloqueado con motivo", async p => {
  await open(p, H("planificar/must-win")); eq(await p.locator("[data-mw]").count(), 3); await p.click("#save-mustwins"); await p.waitForTimeout(300);
  ok(/guardadas/.test(await p.locator("#rgt-toast").innerText()), "toast de guardado");
  await p.selectOption('[data-mw="GROW"]', ""); await p.click("#save-mustwins"); await p.waitForTimeout(300); ok(/exactamente 3|3 Must-Win/.test(await p.locator("#rgt-toast").innerText()), await p.locator("#rgt-toast").innerText());
  const sp = (await dbAll(p, "sprints")).find(x => x.status === "ACTIVE"); eq(sp.must_win_ids.length, 3, "no se persistió el estado inválido");
});
await check("Iniciativas: crear aquí (DoR), filtrar por URL, abrir detalle; el Board ya no duplica la creación", async p => {
  await open(p, H("planificar/iniciativas")); ok(await p.locator('tbody tr').count() >= 7); await p.selectOption('#init-filters [name="pillar"]', "GROW"); await p.waitForTimeout(200);
  ok(/pillar=GROW/.test(await p.evaluate(() => location.hash))); ok(await p.locator("tbody tr").count() === 2, "filtro GROW"); await p.fill('#init-filters [name="q"]', "Cross"); await p.press('#init-filters [name="q"]', "Enter"); await p.waitForTimeout(200); eq(await p.locator("tbody tr").count(), 1);
  await p.click("#new-initiative"); await p.fill("#c-title", "X"); await p.click("#create-task"); await p.waitForTimeout(200); ok(/Completa/.test(await p.locator("#rgt-toast").innerText()), "DoR exigido"); await p.click("#close-create");
  await p.goto(URL + H("planificar/board")); await p.waitForSelector(".draggable-card"); eq(await p.locator("#new-initiative").count(), 0); ok(await p.locator('a:has-text("Gestionar iniciativas")').count() === 1);
});
await check("Mis tareas: solo accionables, filtros en URL, Must-Win y abrir detalle", async p => {
  await open(p, H("ejecutar/tareas")); const ids = await p.locator(".task-row b").allInnerTexts(); ok(ids.length >= 5, "hay tareas accionables"); ok(!(await p.locator("#view").innerText()).includes("T003 ·"), "BACKLOG no es tarea accionable");
  await p.check('#task-filters [name="mustWin"]'); await p.waitForTimeout(250); ok(/mustWin=1/.test(await p.evaluate(() => location.hash))); eq(await p.locator(".task-row").count(), 3);
  await p.goto(URL + H("ejecutar/tareas") + "?status=BLOCKED"); await p.waitForSelector(".task-row"); eq(await p.locator(".task-row").count(), 1); ok(await p.locator(".task-row.is-blocked").count() === 1);
  await p.click(".task-row [data-open-id]"); await p.waitForSelector("#initiative-modal");
});
await check("Seguimiento: absorbe Alertas y muestra bloqueadas/próximas/sin movimiento; Execution Health sigue en Revisar", async p => {
  await open(p, H("ejecutar/seguimiento")); const t = await p.locator("#view").innerText(); for (const k of ["Alertas", "Retrasadas", "Bloqueadas", "Próximas", "Carry-over", "Sin movimiento", "Acciones pendientes"]) ok(t.includes(k), k);
  ok(/Trabajo bloqueado/.test(t), "alerta determinística"); ok(!/Execution Health\s*\n.*\d+\/100/.test(t), "no duplica Execution Health");
  await p.goto(URL + H("revisar/execution-health")); await p.waitForSelector(".health-hero"); ok(/Señales complementarias/.test(await p.locator("#view").innerText()));
});
await check("Revisar: Weekly Review (preguntas + resumen por pilar), Performance e Historial sin XSS", async p => {
  await open(p, H("revisar/weekly-review")); const t = await p.locator("#view").innerText(); ok(/Resumen por pilar/.test(t) && /RUN/.test(t) && /GROW/.test(t) && /TRANSFORM/.test(t)); ok(await p.locator("#save-review").count() === 1);
  await p.click("#save-review"); await p.waitForTimeout(250); ok(/Completa/.test(await p.locator("#rgt-toast").innerText()), "reviewEngine exige respuestas");
  await p.goto(URL + H("revisar/performance")); await p.waitForSelector("#view h1"); ok(!/pacing|forecast/i.test(await p.locator("#view").innerText()));
  await p.evaluate(async () => { const {db} = await import("/js/db/indexedDB.js"); await db.put("activity", {id: "XSS", timestamp: new Date().toISOString(), entity_id: "<img src=x onerror=window.__xss=1>", action: "<b>x</b>", detail: "<script>window.__xss=1<\/script>"}); const {state} = await import("/js/core/state.js"); state.set(await db.snapshot()); });
  await p.goto(URL + H("revisar/historial")); await p.waitForSelector("#view h1"); await p.waitForTimeout(200); eq(await p.evaluate(() => window.__xss || 0), 0, "XSS en historial");
});
await check("Aprender: Academy con progreso y 8 cursos (Próximamente donde no hay lecciones), Rutas y Casos", async p => {
  await open(p, H("aprender/academy")); eq(await p.locator(".course").count(), 8); ok(await p.locator(".course.soon").count() >= 2, "cursos sin lecciones = Próximamente"); ok(/Próximamente/.test(await p.locator(".course.soon").first().innerText()));
  ok(await p.locator('[role="progressbar"]').count() >= 1 && /Tu aprendizaje/.test(await p.locator("#view").innerText()));
  for (const c of ["Fundamentos RGT", "RUN / GROW / TRANSFORM", "Planning", "WIP", "Must-Win", "DoR / DoD", "Deep Work", "Weekly Review"]) ok((await p.locator(".course h2").allInnerTexts()).includes(c), c);
  await p.goto(URL + H("aprender/rutas")); await p.waitForSelector('[data-rgt-target="master-route"]'); eq(await p.locator("[data-start-route]").count(), 1, "una sola ruta maestra"); ok(await p.locator('[data-start-route="rgt-master-route"]').count() === 1);
  await p.click('[data-start-route="rgt-master-route"]'); await p.waitForSelector("#rgt-tour"); await p.waitForTimeout(250); ok(/^#\/execution/.test(await p.evaluate(() => location.hash)));
  await p.goto(URL + H("aprender/casos")); await p.waitForSelector(".case-flow"); const c = await p.locator(".case-flow").innerText(); for (const k of ["Caso", "Decisión", "Respuesta", "Explicación", "Aplicación en RGT"]) ok(c.includes(k), k); ok(/Próximamente/.test(await p.locator("#view").innerText()));
});
await check("Configuración: IA (aviso de key no secreta), Datos y Backup (versión de datos), Preferencias persistentes", async p => {
  await open(p, H("configuracion/ia")); ok(/no es un secreto/.test(await p.locator("#view").innerText()), "limitación documentada en la UI"); ok(!(await p.content()).includes("sk-"), "sin keys");
  await p.goto(URL + H("configuracion/datos")); await p.waitForSelector('[data-rgt-target="data-version"]'); const t = await p.locator('[data-rgt-target="data-version"]').innerText(); ok(/v5/.test(t) && /learning/.test(t) && /prefs/.test(t) && /no destructivas/.test(t));
  await p.goto(URL + H("configuracion/preferencias")); await p.waitForSelector("#pref-start"); await p.check('input[name="learningMode"][value="expert"]'); await p.uncheck("#pref-guide-visible"); await flushLearning(p);
  ok(await p.locator("#rgt-fab").count() === 0, "botón oculto"); await p.reload(); await p.waitForSelector("#pref-start"); ok(await p.locator('input[name="learningMode"][value="expert"]').isChecked(), "modo persiste"); ok(!(await p.locator("#pref-guide-visible").isChecked()), "guía oculta persiste");
  await p.goto(URL + H("planificar/board")); await p.waitForSelector('[data-rgt-intro="section:board"]'); ok(await p.locator('[data-rgt-intro="section:board"].rgt-intro--minimized').count() === 1, "modo experto minimiza introducciones");
  await p.click("#guide"); ok(await p.locator("#rgt-panel").isVisible(), "«?» sigue abriendo la guía con el botón oculto");
});
await check("Guía RGT global: contexto correcto por pantalla, siguiente paso y ruta relacionada", async p => {
  await open(p, H("planificar/board")); await p.click("#rgt-fab"); const t = await p.locator("#rgt-panel").innerText();
  ok(/Planificar › RGT Board/.test(t), "ubicación"); ok(/¿Qué es esto\?/.test(t) && /¿Para qué sirve\?/.test(t) && /¿Qué puedo hacer aquí\?/.test(t) && /¿Qué debería hacer primero\?/.test(t) && /¿Cómo sé si lo hice correctamente\?/.test(t));
  ok(/Tu siguiente paso recomendado/.test(t), "siguiente paso"); ok(await p.locator('#rgt-panel [data-start-route="demo-create-initiative"]').count() === 1, "ruta relacionada");
  await p.keyboard.press("Escape"); await p.goto(URL + H("revisar/historial")); await p.waitForSelector("#rgt-fab"); await p.click("#rgt-fab"); ok(/Revisar › Historial/.test(await p.locator("#rgt-panel").innerText()), "cambia con la pantalla");
  await p.click('#rgt-panel [data-g="close"]'); await p.goto(URL + H("planificar")); await p.waitForSelector("#rgt-fab"); await p.click("#rgt-fab"); ok(/Planificar/.test(await p.locator("#rgt-panel").innerText()));
  eq(await p.locator("#nav #rgt-fab, #nav [data-g]").count(), 0, "la guía no se duplica en el menú"); eq(await p.locator("#rgt-fab").count(), 1);
});
await check("Responsive: móvil (drawer), tablet y laptop — menú usable, sin scroll horizontal", async () => {
  for (const [w, h, drawer] of [[390, 844, true], [768, 1024, true], [1024, 768, false], [1440, 900, false]]) {
    const p = await fresh({width: w, height: h}); try {
      await open(p, H("planificar/board")); ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `scroll horizontal a ${w}px`);
      if (drawer) {
        ok(!(await p.locator("#sidebar").evaluate(e => e.getBoundingClientRect().right > 0)), `drawer cerrado a ${w}px`); ok(await p.locator("#menu").isVisible());
        await p.click("#menu"); await p.waitForTimeout(300); ok(await p.locator("#sidebar").evaluate(e => e.getBoundingClientRect().left >= 0), "drawer abierto"); eq(await p.locator("#menu").getAttribute("aria-expanded"), "true");
        await p.keyboard.press("Escape"); await p.waitForTimeout(300); ok(!(await p.locator("#sidebar").evaluate(e => e.getBoundingClientRect().right > 0)), "Escape cierra");
        await p.click("#menu"); await p.waitForTimeout(250); await p.click('#nav [data-nav-toggle="ejecutar"]'); await p.waitForTimeout(150);
        if (await p.locator('#nav .nav-sub-link[data-nav="tasks"]').isVisible()) { await p.click('#nav .nav-sub-link[data-nav="tasks"]'); await p.waitForTimeout(300); }
        eq(await p.evaluate(() => location.hash), H("ejecutar/tareas")); ok(!(await p.locator("#sidebar").evaluate(e => e.getBoundingClientRect().right > 0)), "navegar cierra el drawer");
      } else { ok(await p.locator("#sidebar").evaluate(e => e.getBoundingClientRect().left >= 0), `sidebar visible a ${w}px`); ok(!(await p.locator("#menu").isVisible()), "sin hamburguesa"); }
      ok(await p.locator("#crumb").isVisible()); const view = await p.locator("#view").boundingBox(); ok(view.width > 280, "el menú no destruye el contenido");
      ok(p.errs.length === 0, p.errs.join("|"));
    } finally { await p.context().close(); }
  }
});
await check("Reglas intactas en la UI: tercer TRANSFORM bloqueado, DONE exige DoD, BLOCKED sigue consumiendo WIP", async p => {
  await open(p, H("planificar/board"));
  await p.selectOption('.status-select[data-id="T003"]', "IN_PROGRESS"); await p.waitForTimeout(300); eq((await dbAll(p, "initiatives")).find(x => x.id === "T003").status, "BACKLOG", "WIP/Ready");
  await p.selectOption('.status-select[data-id="T001"]', "DONE"); await p.waitForTimeout(300); eq((await dbAll(p, "initiatives")).find(x => x.id === "T001").status, "IN_PROGRESS", "DoD incompleto no cierra");
  await p.selectOption('.status-select[data-id="T002"]', "BLOCKED"); await p.waitForTimeout(300); eq((await dbAll(p, "initiatives")).find(x => x.id === "T002").status, "BLOCKED");
  await p.selectOption('.status-select[data-id="T003"]', "READY"); await p.waitForTimeout(200);
  ok((await dbAll(p, "activity")).length >= 1, "Execution Journal conserva eventos");
});
await check("Persistencia total: cerrar y reabrir conserva datos, preferencias, progreso de guía y navegación", async p => {
  await open(p, H("planificar/iniciativas")); await p.click('[data-rgt-intro="module.planificar.initiatives"] [data-rgt-intro-action="hide"]'); await p.click("#rgt-fab"); await p.click('[data-g-tab="routes"]'); await p.click('[data-start-route="demo-create-initiative"]'); await p.waitForSelector("#rgt-tour"); await p.click('[data-t="next"]'); await flushLearning(p);
  const before = (await dbAll(p, "initiatives")).length; await p.context().storageState(); await p.reload(); await p.waitForSelector("#nav a"); await p.waitForTimeout(200);
  eq(await p.evaluate(() => location.hash), H("planificar/iniciativas")); eq((await dbAll(p, "initiatives")).length, before); ok(await p.locator('[data-rgt-intro="module.planificar.initiatives"].rgt-intro--hidden').count() === 1, "preferencia de intro");
  await p.click("#rgt-fab"); await p.click('[data-g-tab="routes"]'); ok(/En curso · 1\/7 pasos/.test(await p.locator("#rgt-panel").innerText()), "progreso de la ruta");
  await p.click('[data-start-route="demo-create-initiative"]'); await p.waitForSelector("#rgt-tour"); eq(await p.locator("#rgt-tour-t").innerText(), "Mira el WIP", "la ruta se reanuda tras reabrir");
});
await check("Regresión Deep Work: iniciar y pausar sesión", async p => {
  await open(p, H("ejecutar/deep-work")); await p.click("#dw-start"); await p.waitForTimeout(400);
  ok(await p.locator("#dw-pause").isEnabled(), "pausa habilitada"); await p.click("#dw-pause"); await p.waitForTimeout(200);
  ok((await dbAll(p, "deepWork")).length >= 2, "sesión persistida");
});
await check("Regresión Weekly Review: vista y acciones presentes", async p => {
  await open(p, H("revisar/weekly-review")); ok(await p.locator("#save-review").count() === 1 && await p.locator("#save-carry").count() === 1);
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
