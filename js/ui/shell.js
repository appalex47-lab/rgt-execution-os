import {GROUPS, UTILITIES, buildRoute, breadcrumbs} from "../core/nav.js";
import {progress} from "../learning/index.js";
import {esc} from "../core/html.js";

/** Application shell: grouped sidebar, breadcrumbs and the mobile drawer. Reads nav.js, owns no routes. */
const $ = s => document.querySelector(s);
let current = null;

const expanded = (g, collapsed, activeId) => activeId === g.id || collapsed[g.id] === false;
const accordionState = (collapsed = {}, openId = null) => Object.fromEntries(GROUPS.filter(g => g.modules.length).map(g => [g.id, openId ? g.id !== openId : true]));

export function sidebarHtml(route, collapsed = {}) {
  const activeId = route.group?.id || null;
  const link = (view, label, icon = "", cls = "") => {
    const active = route.view === view;
    return `<a class="nav-link ${cls} ${active ? "active" : ""}" href="${buildRoute(view)}" data-nav="${esc(view)}" ${active ? 'aria-current="page"' : ""}>${icon ? `<span class="nav-ico" aria-hidden="true">${icon}</span>` : ""}${esc(label)}</a>`;
  };
  const groups = GROUPS.map(g => {
    if (!g.modules.length) return `<div class="nav-single">${link(g.view, g.label, g.icon)}</div>`;
    const open = expanded(g, collapsed, activeId), id = `nav-sub-${g.id}`;
    const groupActive = activeId === g.id;
    const groupView = g.modules[0]?.view || g.view;
    return `<div class="nav-group ${groupActive ? "has-active" : ""}" data-group="${g.id}">
      <div class="nav-group-row"><a class="nav-link nav-group-link ${groupActive ? "active" : ""}" href="${buildRoute(groupView)}" data-nav="${esc(groupView)}" ${groupActive ? 'aria-current="page"' : ""}><span class="nav-ico" aria-hidden="true">${g.icon}</span>${esc(g.label)}</a>
      <button class="nav-chev" data-nav-toggle="${g.id}" aria-expanded="${open}" aria-controls="${id}" aria-label="${open ? "Contraer" : "Expandir"} ${esc(g.label)}">${open ? "▾" : "▸"}</button></div>
      <div class="nav-sub" id="${id}" ${open ? "" : "hidden"}>${g.modules.map(m => link(m.view, m.label, "", "nav-sub-link")).join("")}</div></div>`;
  }).join("");
  return `<div class="nav-title">EXECUTION OS</div>${groups}<div class="nav-util">${UTILITIES.map(u => link(u.view, u.label, u.icon)).join("")}</div>`;
}

/** Text of the initiative modal (if open) so the breadcrumb can end in INICIATIVA without coupling to that view. */
export function crumbExtra() {
  const m = document.querySelector("#initiative-modal");
  if (!m) return null;
  const t = m.querySelector(".modal-head h2")?.textContent?.trim(), e = m.querySelector(".eyebrow")?.textContent?.trim();
  return e && /Nueva/i.test(e) ? "Nueva iniciativa" : (t ? `Iniciativa · ${t}` : "Iniciativa");
}
export function crumbHtml(route, extra = crumbExtra()) {
  const items = breadcrumbs(route, extra);
  return `<button class="crumb-back" data-crumb-back aria-label="Volver a la pantalla anterior" title="Volver">←</button><ol class="crumb-list">${items.map((it, i) => {
    const sep = i ? '<li class="crumb-sep" aria-hidden="true">/</li>' : "";
    return `${sep}<li>${it.href ? `<a href="${it.href}">${esc(it.label)}</a>` : `<span aria-current="page">${esc(it.label)}</span>`}</li>`;
  }).join("")}</ol>`;
}

export function renderShell(route) {
  current = route;
  $("#nav").innerHTML = sidebarHtml(route, progress.navPrefs().collapsed);
  const crumb = $("#crumb"); if (crumb) crumb.innerHTML = crumbHtml(route);
  document.title = `${route.module?.label || route.group?.label || "RGT"} · RGT Execution OS`;
  closeDrawer(false);
}
export const refreshCrumb = () => { if (current && $("#crumb")) $("#crumb").innerHTML = crumbHtml(current); };

/** Selecting a group (landing or module) opens it, so the user always sees where they are. */
export function openGroupFor(route) {
  const nav = progress.navPrefs();
  const g = route.group;

  // Command Center and utility views (RGT Assistant) live outside the
  // expandable groups. Entering either one must collapse every group so
  // no menu remains visually open while the user is on a top-level utility.
  if (!g || !g.modules.length) {
    const next = accordionState(nav.collapsed, null);
    const same = JSON.stringify(nav.collapsed) === JSON.stringify(next);
    if (!same) progress.setNavPrefs({collapsed: next});
    return;
  }

  const next = accordionState(nav.collapsed, g.id);
  const same = JSON.stringify(nav.collapsed) === JSON.stringify(next);
  if (!same) progress.setNavPrefs({collapsed: next});
}

/* ---- mobile drawer ---- */
function closeDrawer(restoreFocus = true) {
  const sb = $("#sidebar"); if (!sb) return;
  const was = sb.classList.contains("open");
  sb.classList.remove("open"); $("#nav-backdrop")?.classList.remove("on"); $("#menu")?.setAttribute("aria-expanded", "false");
  if (was && restoreFocus) $("#menu")?.focus();
}
function openDrawer() { $("#sidebar").classList.add("open"); $("#nav-backdrop")?.classList.add("on"); $("#menu")?.setAttribute("aria-expanded", "true"); $("#sidebar a.nav-link.active, #sidebar a.nav-link")?.focus(); }

export function mountShell() {
  const nav = $("#nav");
  nav.addEventListener("click", e => {
    const t = e.target.closest("[data-nav-toggle]");
    if (t) {
      const id = t.getAttribute("data-nav-toggle"), open = t.getAttribute("aria-expanded") === "true";
      const next = accordionState(progress.navPrefs().collapsed, open ? null : id);
      progress.setNavPrefs({collapsed: next});
      nav.innerHTML = sidebarHtml(current, next); nav.querySelector(`[data-nav-toggle="${id}"]`)?.focus();
      return;
    }
    if (e.target.closest("a.nav-link")) closeDrawer(false);
  });
  $("#menu").addEventListener("click", () => ($("#sidebar").classList.contains("open") ? closeDrawer() : openDrawer()));
  $("#nav-backdrop")?.addEventListener("click", () => closeDrawer());
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#sidebar")?.classList.contains("open")) closeDrawer(); });
  document.addEventListener("click", e => { if (e.target.closest("[data-crumb-back]")) { if (history.length > 1) history.back(); else location.hash = buildRoute("dashboard"); } });
  new MutationObserver(() => refreshCrumb()).observe(document.body, {childList: true});
}
