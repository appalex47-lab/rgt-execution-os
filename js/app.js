import {db} from "./db/indexedDB.js";
import {state} from "./core/state.js";
import {router, parseRoute, buildRoute} from "./core/router.js";
import {onRender} from "./core/events.js";
import {esc} from "./core/html.js";
import {seed} from "./data/seed.js";
import {commandCenter} from "./ui/commandCenter.js";
import {groupLanding} from "./ui/groupLanding.js";
import {initiatives, bindInitiatives} from "./ui/initiatives.js";
import {mustWin, bindMustWin} from "./ui/mustWin.js";
import {tasks, bindTasks} from "./ui/tasks.js";
import {followUp, bindFollowUp} from "./ui/followUp.js";
import {guidedRoutes} from "./ui/guidedRoutes.js";
import {cases} from "./ui/cases.js";
import {preferences, bindPreferences} from "./ui/preferences.js";
import {dataVersionPanel, pillarReviewPanel, healthSignalsPanel} from "./ui/extras.js";
import {renderShell, mountShell, openGroupFor} from "./ui/shell.js";
import {board, bindBoard} from "./ui/board.js";
import {openInitiativeDetail} from "./ui/initiativeDetail.js";
import {planning, bindPlanning} from "./ui/planning.js";
import {deepWork, bindDeepWork} from "./ui/deepWork.js";
import {review, bindReview} from "./ui/review.js";
import {history as historyView} from "./ui/history.js";
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
  dashboard: {label: "Command Center", render: commandCenter, bind: () => bindHomeBrief()},
  planning: {label: "Planning Semanal", render: planning, bind: bindPlanning},
  board: {label: "RGT Board", render: board, bind: (params) => { bindBoard(); if (params.initiative) { openInitiativeDetail(params.initiative); window.history.replaceState(null, "", buildRoute("board")); } }},
  initiatives: {label: "Iniciativas", render: initiatives, bind: (params) => { bindInitiatives(params); if (params.initiative) { openInitiativeDetail(params.initiative); window.history.replaceState(null, "", buildRoute("initiatives")); } }},
  "must-win": {label: "Must-Win", render: mustWin, bind: bindMustWin},
  tasks: {label: "Mis tareas", render: tasks, bind: bindTasks},
  "deep-work": {label: "Deep Work", render: deepWork, bind: bindDeepWork},
  "follow-up": {label: "Seguimiento", render: followUp, bind: bindFollowUp},
  review: {label: "Weekly Review", render: (d) => review(d) + pillarReviewPanel(d), bind: bindReview},
  "execution-health": {label: "Execution Health", render: (d) => executionHealth(d) + healthSignalsPanel(d)},
  performance: {label: "Performance", render: performance, bind: bindPerformance},
  history: {label: "Historial", render: historyView},
  academy: {label: "RGT Academy", render: academy, bind: bindAcademy},
  "guided-routes": {label: "Ruta Guiada", render: guidedRoutes},
  cases: {label: "Casos Prácticos", render: cases},
  "ai-settings": {label: "IA / Cohere", render: aiSettings, bind: bindAISettings},
  backup: {label: "Datos y Backup", render: (d) => backup(d) + dataVersionPanel(d), bind: bindBackup},
  preferences: {label: "Preferencias", render: preferences, bind: bindPreferences},
  assistant: {label: "RGT Assistant", render: assistant, bind: bindAssistant}
};
const GROUP_ROUTE = {label: "", render: (d, p, route) => groupLanding(route.group)};
export const routeFor = view => (view.startsWith("group:") ? GROUP_ROUTE : ROUTES[view]);

let lastPublished = "";
function publishExecution(d) {
  try {
    const ctx = buildExecutionContext(d);
    const key = JSON.stringify({...ctx, asOf: null});
    if (key !== lastPublished && revNavigatorBridge.publishExecutionContext(d)) lastPublished = key;
  } catch (e) { console.error("execution context", e); }
}

let lastRouteSaved = null;
function render(route = parseRoute(location.hash)) {
  if (route.legacy || route.unknown || !location.hash || location.hash === "#/") window.history.replaceState(null, "", route.canonical);
  const r = routeFor(route.view) || ROUTES.dashboard, d = state.get();
  openGroupFor(route);
  renderShell(route);
  try {
    document.querySelector("#view").innerHTML = viewIntro(route.view) + r.render(d, route.params || {}, route);
    r.bind?.(route.params || {});
  } catch (e) {
    console.error(e);
    document.querySelector("#view").innerHTML = `<div class="panel"><h2>No se pudo mostrar esta vista</h2><p>${esc(e.message)}</p><p class="sub">Tus datos no se modificaron. Puedes exportar un backup desde Datos y Backup.</p></div>`;
  }
  const base = route.canonical.split("?")[0];
  if (base !== lastRouteSaved) { lastRouteSaved = base; progress.setNavPrefs({lastRoute: route.canonical}); document.querySelector("#view").focus?.({preventScroll: true}); }
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
  mountShell();
  if ((!location.hash || location.hash === "#/") && progress.uxPrefs().startPage === "last" && progress.navPrefs().lastRoute) window.history.replaceState(null, "", progress.navPrefs().lastRoute);
  mountGuide();
  document.querySelector("#guide").onclick = () => toggleGuide(true);
  document.addEventListener("click", e => { const v = e.target.closest("[data-go]")?.dataset.go; if (v) router.go(v); });
  onRender(() => render());
  router.start(render);
}
init().catch(e => document.querySelector("#view").innerHTML = `<div class="panel"><h2>Error de arranque</h2><p>${esc(e.message)}</p></div>`);
