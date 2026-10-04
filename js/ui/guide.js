import {registry, progress, tour, resolve} from "../learning/index.js";
import {renderIntro, renderLevels, renderWhereAmI, maxLevelFor, TYPE_LABEL} from "../learning/contextEngine.js";
import {onLearning} from "../learning/events.js";
import {PHASE, targetKey} from "../learning/tourEngine.js";
import {isDone} from "../learning/model.js";
import {router, parseRoute} from "../core/router.js";
import {esc} from "../core/html.js";
import {openLesson} from "./academy.js";

/**
 * Floating "🧭 Guía RGT", intro banners, help patterns and the guided-tour overlay.
 * Everything reads the shared registry; nothing here owns content or rules.
 */
const $ = s => document.querySelector(s);
let root = null, tab = "here", lastStepId = null, highlighted = null, panelContext = null;
const currentView = () => parseRoute(location.hash).view || "dashboard";

/* ---------------- floating guide ---------------- */
function guideHtml() {
  const g = progress.guidePrefs(), t = tour.snapshot();
  const active = t.phase === PHASE.ACTIVE || t.phase === PHASE.PAUSED;
  const fab = g.hidden ? "" : `<button id="rgt-fab" class="rgt-fab ${g.minimized ? "is-min" : ""}" data-rgt-target="guide-fab" aria-expanded="${g.open}" aria-controls="rgt-panel" aria-label="Guía RGT" title="Guía RGT">🧭${g.minimized ? "" : " <span>Guía RGT</span>"}</button>`;
  const panel = g.open ? panelHtml() : "";
  return `${fab}${panel}${active ? tourCardHtml(t) : ""}`;
}

function panelHtml() {
  const tabs = [["here", "Aquí"], ["routes", "Rutas"], ["progress", "Progreso"]];
  const body = panelContext ? contextView() : tab === "routes" ? routesTab() : tab === "progress" ? progressTab() : hereTab();
  return `<div id="rgt-panel" class="rgt-panel" role="dialog" aria-modal="false" aria-label="Guía RGT" data-rgt-target="guide-panel">
    <div class="rgt-panel-head"><b>🧭 Guía RGT</b><span>
      <button class="icon-btn" data-g="minimize" aria-label="Minimizar el botón de guía" title="Minimizar">–</button>
      <button class="icon-btn" data-g="close" aria-label="Cerrar guía" title="Cerrar">×</button></span></div>
    <div class="rgt-tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${!panelContext && tab === k}" class="${!panelContext && tab === k ? "on" : ""}" data-g-tab="${k}">${l}</button>`).join("")}</div>
    <div class="rgt-panel-body">${body}</div>
    <div class="rgt-panel-foot"><button class="link-btn" data-g="hide-fab">Ocultar el botón flotante</button> <button class="link-btn" data-g="reset-intros">Mostrar de nuevo las introducciones</button></div></div>`;
}
function hereTab() {
  const section = registry.contextForView(currentView());
  return renderWhereAmI(section, [], {level: 3, resolve}) + (section ? `<p><button class="btn" data-g="reopen-intro" data-ctx="${esc(section.id)}">Ver la introducción de la sección</button></p>` : "");
}
function contextView() {
  const c = registry.get("context", panelContext);
  if (!c) return "";
  return `<button class="link-btn" data-g="back">← Volver</button><div class="eyebrow">${esc(TYPE_LABEL[c.type] || c.type)}</div><h3>${esc(c.title)}</h3>${renderLevels(c, 5, resolve)}`;
}
const label = {NOT_STARTED: "Sin empezar", IN_PROGRESS: "En curso", PAUSED: "En pausa", COMPLETED: "Completada", PASSED: "Aprobada", FAILED: "No aprobada"};
function routesTab() {
  const routes = registry.list("route");
  if (!routes.length) return "<p>No hay rutas registradas.</p>";
  return routes.map(r => {
    const st = progress.get("route", r.id);
    const cta = st.status === "IN_PROGRESS" || st.status === "PAUSED" ? "Continuar" : st.status === "COMPLETED" ? "Repetir" : "Empezar";
    return `<article class="rgt-route"><div><b>${esc(r.title)}</b>${r.demo ? ' <span class="badge">demo técnico</span>' : ""}<small>${esc(label[st.status])} · ${st.completedSteps.length}/${r.steps.length} pasos</small><p>${esc(r.description || "")}</p></div>
      <button class="btn primary" data-start-route="${esc(r.id)}" data-restart="${st.status === "COMPLETED" ? 1 : 0}">${cta}</button></article>`;
  }).join("");
}
function progressTab() {
  const s = progress.summary(registry);
  const row = (n, t) => `<li><b>${esc(n)}</b>: ${s[t].done}/${s[t].total} completadas${s[t].inProgress ? ` · ${s[t].inProgress} en curso` : ""}</li>`;
  const lessons = registry.list("lesson").map(l => `<li>${isDone("lesson", progress.statusOf("lesson", l.id)) ? "✓" : "○"} <button class="link-btn" data-rgt-open-lesson="${esc(l.id)}">${esc(l.title)}</button></li>`).join("");
  return `<ul>${row("Lecciones", "lesson")}${row("Prácticas", "practice")}${row("Rutas guiadas", "route")}${row("Evaluaciones", "assessment")}</ul><h4>Lecciones</h4><ul class="rgt-lessons">${lessons}</ul>`;
}

/* ---------------- tour card ---------------- */
function tourCardHtml(t) {
  const s = t.step; if (!s) return t.phase === PHASE.COMPLETED ? "" : "";
  const paused = t.phase === PHASE.PAUSED;
  const fb = t.feedback ? `<p class="rgt-fb ${t.feedback.ok ? "ok" : "bad"}">${t.feedback.ok ? "✓ " : ""}${esc(t.feedback.message)}</p>` : "";
  const missing = t.targetMissing ? `<p class="rgt-fb bad">No encuentro este elemento en la pantalla actual. ${s.view ? `<button class="link-btn" data-t="goto">Ir a la vista</button>` : ""}</p>` : "";
  const kind = t.kind === "ACTION" ? (s.optional ? "Opcional" : "Acción requerida") : "Informativo";
  return `<aside id="rgt-tour" class="rgt-tour" role="dialog" aria-modal="false" aria-labelledby="rgt-tour-t" aria-describedby="rgt-tour-d" data-rgt-target="tour-card">
    <div class="rgt-tour-head"><span class="eyebrow">${esc(t.title)} · paso ${t.index + 1}/${t.total} · ${kind}</span><button class="icon-btn" data-t="close" aria-label="Cerrar guía (se guarda el avance)">×</button></div>
    <div class="rgt-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${t.percent}"><i style="width:${t.percent}%"></i></div>
    <h3 id="rgt-tour-t">${esc(s.title)}</h3><p id="rgt-tour-d">${esc(s.description)}</p>
    <div aria-live="polite" class="rgt-live">${paused ? '<p class="rgt-fb">Guía en pausa.</p>' : ""}${fb}${missing}</div>
    <div class="rgt-tour-actions">
      <button class="btn" data-t="prev" ${t.canPrevious ? "" : "disabled"}>← Anterior</button>
      ${paused ? '<button class="btn" data-t="resume">Reanudar</button>' : '<button class="btn" data-t="pause">Pausar</button>'}
      ${s.optional && !paused ? '<button class="btn" data-t="skip">Omitir</button>' : ""}
      <button class="btn primary" data-t="next" ${t.canNext && !paused ? "" : "disabled"}>${t.isLast ? "Terminar" : "Continuar →"}</button></div></aside>`;
}

/* ---------------- rendering / highlight ---------------- */
function clearHighlight() { highlighted?.classList.remove("rgt-target-highlight"); highlighted?.removeAttribute("data-rgt-highlight"); highlighted = null; }
export function refreshGuide() {
  if (!root) return;
  const keepFocus = document.activeElement?.closest?.("#rgt-guide") ? document.activeElement.getAttribute("data-g") || document.activeElement.getAttribute("data-t") || document.activeElement.id : null;
  root.innerHTML = guideHtml();
  if (keepFocus) { const el = root.querySelector(`[data-g="${keepFocus}"],[data-t="${keepFocus}"],#${CSS.escape(keepFocus)}`); el?.focus?.(); }
  clearHighlight();
  const t = tour.snapshot();
  if (t.phase === PHASE.ACTIVE && t.step) {
    if (lastStepId !== t.step.id && t.step.view && t.step.view !== currentView()) { lastStepId = t.step.id; router.go(t.step.view); return; }
    lastStepId = t.step.id;
    const el = t.step.target ? document.querySelector(t.step.target) : null;
    if (el) { el.classList.add("rgt-target-highlight"); highlighted = el; if (t.step.id !== refreshGuide._scrolled) { refreshGuide._scrolled = t.step.id; el.scrollIntoView?.({block: "center", behavior: "smooth"}); } }
  } else lastStepId = null;
}

/* ---------------- intros (delegated, persisted) ---------------- */
function onIntroAction(btn) {
  const host = btn.closest("[data-rgt-intro]"); if (!host) return;
  const id = host.getAttribute("data-rgt-intro"), ctx = registry.get("context", id); if (!ctx) return;
  const a = btn.getAttribute("data-rgt-intro-action");
  if (a === "minimize") progress.setIntroMode(id, "minimized");
  else if (a === "hide") progress.setIntroMode(id, "hidden");
  else if (a === "expand") progress.setIntroMode(id, "expanded");
  else if (a === "more") progress.setLevel(id, Math.min(maxLevelFor(ctx), progress.level(id) + 1));
  else if (a === "less") progress.setLevel(id, progress.level(id) - 1);
  host.outerHTML = renderIntro(ctx, {mode: progress.introMode(id), level: progress.level(id), resolve});
  document.querySelector(`[data-rgt-intro="${CSS.escape(id)}"] button`)?.focus();
}

/* ---------------- help patterns ---------------- */
function closeHelp(except) {
  document.querySelectorAll(".rgt-help-btn[aria-expanded='true']").forEach(b => {
    if (b === except) return;
    b.setAttribute("aria-expanded", "false"); document.getElementById(b.getAttribute("aria-controls"))?.setAttribute("hidden", "");
  });
}
function onHelp(btn) {
  const id = btn.getAttribute("data-rgt-help"), pattern = btn.getAttribute("data-pattern"), ctx = registry.get("context", id);
  if (!ctx) return;
  if (pattern === "inline" || pattern === "popover") {
    const body = document.getElementById(btn.getAttribute("aria-controls")), open = btn.getAttribute("aria-expanded") === "true";
    closeHelp(btn);
    btn.setAttribute("aria-expanded", String(!open)); body?.toggleAttribute("hidden", open);
  } else if (pattern === "panel") {
    const g = progress.guidePrefs(); progress.setGuidePrefs({open: true, hidden: g.hidden}); panelContext = id; refreshGuide();
    document.querySelector("#rgt-panel [data-g]")?.focus();
  } else if (pattern === "modal") openHelpModal(ctx, btn);
}
function openHelpModal(ctx, opener) {
  const o = document.createElement("div"); o.className = "modal-backdrop";
  o.innerHTML = `<div class="modal rgt-help-modal" role="dialog" aria-modal="true" aria-labelledby="rgt-hm-t"><div class="modal-head"><div><div class="eyebrow">${esc(TYPE_LABEL[ctx.type] || ctx.type)}</div><h2 id="rgt-hm-t">${esc(ctx.title)}</h2></div><button class="icon-btn" data-close aria-label="Cerrar">×</button></div><div class="copilot-body">${renderLevels(ctx, 4, resolve)}<div class="modal-actions"><button class="btn primary" data-close>Entendido</button></div></div></div>`;
  const close = () => { o.remove(); opener?.focus?.(); };
  o.addEventListener("click", e => { if (e.target === o || e.target.closest("[data-close]")) close(); });
  o.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); close(); } });
  document.body.appendChild(o); o.querySelector("[data-close]").focus();
}

/* ---------------- tour / guide actions ---------------- */
export function startRoute(id, {restart = false} = {}) {
  const r = restart ? tour.restart(id) : tour.start(id);
  if (r.ok) { progress.setGuidePrefs({open: false}); }
  refreshGuide(); return r;
}
function onTourAction(a) {
  if (a === "next") tour.next(); else if (a === "prev") tour.previous(); else if (a === "pause") tour.pause();
  else if (a === "resume") tour.resume(); else if (a === "skip") tour.skip(); else if (a === "close") tour.close();
  else if (a === "goto") { const v = tour.snapshot().step?.view; if (v) router.go(v); }
  refreshGuide();
  document.querySelector("#rgt-tour [data-t='next']:not([disabled])")?.focus?.();
}
function onGuideAction(btn) {
  const a = btn.getAttribute("data-g"), g = progress.guidePrefs();
  if (a === "close") { progress.setGuidePrefs({open: false}); panelContext = null; }
  else if (a === "minimize") progress.setGuidePrefs({minimized: true, open: false});
  else if (a === "hide-fab") progress.setGuidePrefs({hidden: true, open: false});
  else if (a === "back") panelContext = null;
  else if (a === "reset-intros") { progress.resetIntros(); document.querySelectorAll("[data-rgt-intro]").forEach(h => { const c = registry.get("context", h.getAttribute("data-rgt-intro")); if (c) h.outerHTML = renderIntro(c, {mode: "expanded", level: 1, resolve}); }); }
  else if (a === "reopen-intro") { const id = btn.getAttribute("data-ctx"); progress.setIntroMode(id, "expanded"); progress.setGuidePrefs({open: false}); document.querySelectorAll(`[data-rgt-intro="${CSS.escape(id)}"]`).forEach(h => { h.outerHTML = renderIntro(registry.get("context", id), {mode: "expanded", level: progress.level(id), resolve}); }); document.querySelector(`[data-rgt-intro="${CSS.escape(id)}"]`)?.scrollIntoView?.({block: "start"}); }
  refreshGuide();
  if (a === "close" || a === "minimize") $("#rgt-fab")?.focus();
}
export function toggleGuide(open) {
  const g = progress.guidePrefs(), next = open ?? !g.open;
  progress.setGuidePrefs({open: next, minimized: false, hidden: false}); if (!next) panelContext = null;
  refreshGuide(); if (next) document.querySelector("#rgt-panel [data-g]")?.focus();
}

/* ---------------- mount ---------------- */
export function mountGuide() {
  if (root) return;
  root = document.createElement("div"); root.id = "rgt-guide"; document.body.appendChild(root);
  document.addEventListener("click", e => {
    const t = e.target;
    const intro = t.closest?.("[data-rgt-intro-action]"); if (intro) return onIntroAction(intro);
    const hb = t.closest?.("[data-rgt-help]"); if (hb) return onHelp(hb);
    if (!t.closest?.(".rgt-help")) closeHelp();
    if (t.closest?.("#rgt-fab")) return toggleGuide();
    const g = t.closest?.("[data-g]"); if (g) return onGuideAction(g);
    const gt = t.closest?.("[data-g-tab]"); if (gt) { tab = gt.getAttribute("data-g-tab"); panelContext = null; return refreshGuide(); }
    const tt = t.closest?.("[data-t]"); if (tt) return onTourAction(tt.getAttribute("data-t"));
    const sr = t.closest?.("[data-start-route]"); if (sr) return void startRoute(sr.getAttribute("data-start-route"), {restart: sr.getAttribute("data-restart") === "1"});
    const oc = t.closest?.("[data-rgt-open-context]"); if (oc) { const g2 = progress.guidePrefs(); progress.setGuidePrefs({open: true, hidden: g2.hidden}); panelContext = oc.getAttribute("data-rgt-open-context"); return refreshGuide(); }
    const ol = t.closest?.("[data-rgt-open-lesson]"); if (ol) return openLesson(ol.getAttribute("data-rgt-open-lesson"));
    const sr2 = t.closest?.("[data-rgt-start-route]"); if (sr2) return void startRoute(sr2.getAttribute("data-rgt-start-route"));
    // Feed real user actions to the tour (runs after the app's own handler thanks to microtask).
    const tg = t.closest?.("[data-rgt-target]"); const k = tg?.getAttribute("data-rgt-target");
    if (k && tour.phase === PHASE.ACTIVE) queueMicrotask(() => { tour.report({type: "click", target: k}); });
  });
  document.addEventListener("change", e => {
    const el = e.target, k = el.getAttribute?.("data-rgt-target");
    if (k && tour.phase === PHASE.ACTIVE) tour.report({type: el.tagName === "SELECT" ? "select" : "input", target: k, value: el.value});
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape" || document.querySelector(".modal-backdrop")) return;
    if (tour.phase === PHASE.ACTIVE && !progress.guidePrefs().open) { tour.close(); refreshGuide(); return; }
    if (progress.guidePrefs().open) { progress.setGuidePrefs({open: false}); panelContext = null; refreshGuide(); $("#rgt-fab")?.focus(); }
    else if (document.querySelector(".rgt-help-btn[aria-expanded='true']")) closeHelp();
  });
  window.addEventListener("rgt:tour", () => refreshGuide());
  onLearning(ev => { tour.report(ev); });
  refreshGuide();
}
export const guideRoot = () => root;
