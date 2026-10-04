import {db} from "./db/indexedDB.js";
import {state} from "./core/state.js";
import {router, parseRoute, buildRoute} from "./core/router.js";
import {onRender} from "./core/events.js";
import {esc} from "./core/html.js";
import {seed} from "./data/seed.js";
import {dashboard} from "./ui/dashboard.js";
import {board, bindBoard} from "./ui/board.js";
import {openInitiativeDetail} from "./ui/initiativeDetail.js";
import {planning, bindPlanning} from "./ui/planning.js";
import {deepWork, bindDeepWork} from "./ui/deepWork.js";
import {review, bindReview} from "./ui/review.js";
import {history as historyView} from "./ui/history.js";
import {alerts} from "./ui/alerts.js";
import {executionHealth} from "./ui/executionHealth.js";
import {backup, bindBackup} from "./ui/backup.js";
import {aiSettings, bindAISettings} from "./ui/aiSettings.js";
import {assistant, bindAssistant} from "./ui/assistant.js";
import {bindHomeBrief} from "./ui/homeBrief.js";
import {performance, bindPerformance} from "./ui/performance.js";
import {academy, bindAcademy} from "./ui/academy.js";
import {mountGuide, toggleGuide, refreshGuide} from "./ui/guide.js";
import {progress} from "./learning/index.js";
import {viewIntro} from "./learning/html.js";
import {revNavigatorBridge} from "./integration/revNavigatorBridge.js";
import {buildExecutionContext} from "./integration/executionContext.js";
import {getMustWinIds} from "./engines/mustWinEngine.js";

/** Route table: single source of truth for views, labels and binders (reused by the RevNavigator host). */
export const ROUTES = {
  dashboard: {label: "Command Center", render: dashboard, bind: () => bindHomeBrief()},
  board: {label: "RGT Board", render: board, bind: (params) => { bindBoard(); if (params.initiative) { openInitiativeDetail(params.initiative); window.history.replaceState(null, "", buildRoute("board")); } }},
  planning: {label: "Planning Semanal", render: planning, bind: bindPlanning},
  "deep-work": {label: "Deep Work", render: deepWork, bind: bindDeepWork},
  review: {label: "Weekly Review", render: review, bind: bindReview},
  history: {label: "Historial", render: historyView},
  alerts: {label: "Alertas", render: alerts},
  "execution-health": {label: "Execution Health", render: executionHealth},
  performance: {label: "Performance", render: performance, bind: bindPerformance},
  assistant: {label: "RGT Assistant", render: assistant, bind: bindAssistant},
  "ai-settings": {label: "IA / Cohere", render: aiSettings, bind: bindAISettings},
  academy: {label: "RGT Academy", render: academy, bind: bindAcademy},
  backup: {label: "Backup & Datos", render: backup, bind: bindBackup}
};

let lastPublished = "";
function publishExecution(d) {
  try {
    const ctx = buildExecutionContext(d);
    const key = JSON.stringify({...ctx, asOf: null});
    if (key !== lastPublished && revNavigatorBridge.publishExecutionContext(d)) lastPublished = key;
  } catch (e) { console.error("execution context", e); }
}

function render(route = parseRoute(location.hash)) {
  const name = route.view in ROUTES ? route.view : "dashboard";
  const r = ROUTES[name], d = state.get();
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  document.querySelector("#crumb").textContent = r.label;
  try {
    document.querySelector("#view").innerHTML = viewIntro(name) + r.render(d);
    r.bind?.(route.params || {});
  } catch (e) {
    console.error(e);
    document.querySelector("#view").innerHTML = `<div class="panel"><h2>No se pudo mostrar esta vista</h2><p>${esc(e.message)}</p><p class="sub">Tus datos no se modificaron. Puedes exportar un backup desde Backup &amp; Datos.</p></div>`;
  }
  const s = d.sprints.find(x => x.status === "ACTIVE") || d.sprints[0];
  document.querySelector("#sprint").textContent = s ? `Semana ${s.week_number}` : "—";
  // Sidebar progress = Must-Win completion (execution), never a commercial figure.
  const ids = s ? getMustWinIds(s, d.initiatives) : [];
  const done = ids.filter(id => d.initiatives.find(x => x.id === id)?.status === "DONE").length;
  document.querySelector("#progress").style.width = ids.length ? Math.round(done / ids.length * 100) + "%" : "0%";
  publishExecution(d);
  refreshGuide();
}

async function init() {
  await db.open();
  await seed(db);
  state.set(await db.snapshot());
  await progress.load();
  progress.migrateLegacy();
  revNavigatorBridge.start({origin: window.RGT_REVNAVIGATOR_ORIGIN || null, allowedOriginList: window.RGT_REVNAVIGATOR_ORIGINS || []});
  revNavigatorBridge.requestCommercialContext();
  document.querySelectorAll("nav button").forEach(b => b.onclick = () => router.go(b.dataset.view));
  mountGuide();
  document.querySelector("#guide").onclick = () => toggleGuide(true);
  document.querySelector("#menu").onclick = () => document.querySelector("#sidebar").classList.toggle("open");
  document.addEventListener("click", e => { const v = e.target.closest("[data-go]")?.dataset.go; if (v) router.go(v); });
  onRender(() => render());
  router.start(render);
}
init().catch(e => document.querySelector("#view").innerHTML = `<div class="panel"><h2>Error de arranque</h2><p>${esc(e.message)}</p></div>`);
