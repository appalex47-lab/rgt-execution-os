/**
 * Navigation architecture (pure, no DOM): the single source of truth for groups, modules, labels and URLs.
 * Canonical URL (GitHub Pages friendly, hash based):  #/execution[/<grupo>[/<módulo>]][?params]
 * `view` is the stable internal id every view/engine/preference already uses (e.g. "board").
 * Legacy URLs (#/board, #/review …) still resolve and are normalised to the canonical form.
 */
export const ROOT = "execution";

export const GROUPS = Object.freeze([
  {id: "command-center", slug: "", icon: "🏠", label: "Command Center", view: "dashboard", modules: []},
  {id: "planificar", slug: "planificar", icon: "🎯", label: "Planificar", view: "group:planificar", modules: [
    {view: "planning", slug: "planning", label: "Planning Semanal"},
    {view: "board", slug: "board", label: "RGT Board"},
    {view: "initiatives", slug: "iniciativas", label: "Iniciativas"},
    {view: "must-win", slug: "must-win", label: "Must-Win"}]},
  {id: "ejecutar", slug: "ejecutar", icon: "⚡", label: "Ejecutar", view: "group:ejecutar", modules: [
    {view: "tasks", slug: "tareas", label: "Mis tareas"},
    {view: "deep-work", slug: "deep-work", label: "Deep Work"},
    {view: "follow-up", slug: "seguimiento", label: "Seguimiento"}]},
  {id: "revisar", slug: "revisar", icon: "🔎", label: "Revisar", view: "group:revisar", modules: [
    {view: "review", slug: "weekly-review", label: "Weekly Review"},
    {view: "execution-health", slug: "execution-health", label: "Execution Health"},
    {view: "performance", slug: "performance", label: "Performance"},
    {view: "history", slug: "historial", label: "Historial"}]},
  {id: "aprender", slug: "aprender", icon: "🧠", label: "Aprender", view: "group:aprender", modules: [
    {view: "academy", slug: "academy", label: "RGT Academy"},
    {view: "guided-routes", slug: "rutas", label: "Ruta Guiada"},
    {view: "cases", slug: "casos", label: "Casos Prácticos"}]},
  {id: "configuracion", slug: "configuracion", icon: "⚙️", label: "Configuración", view: "group:configuracion", modules: [
    {view: "ai-settings", slug: "ia", label: "IA / Cohere"},
    {view: "backup", slug: "datos", label: "Datos y Backup"},
    {view: "preferences", slug: "preferencias", label: "Preferencias"}]}
]);

/** Cross-cutting tool that is not one of the six groups (kept reachable, never orphaned). */
export const UTILITIES = Object.freeze([{view: "assistant", slug: "asistente", icon: "✦", label: "RGT Assistant", utility: true}]);

/** Views that no longer exist as a screen: they were absorbed (not removed) and still resolve for old links. */
export const ALIASES = Object.freeze({alerts: "follow-up", dashboard: "dashboard", academia: "academy"});

const byView = new Map();
for (const g of GROUPS) {
  byView.set(g.view, {group: g, module: null});
  if (g.id === "command-center") byView.set("dashboard", {group: g, module: null});
  for (const m of g.modules) byView.set(m.view, {group: g, module: m});
}
for (const u of UTILITIES) byView.set(u.view, {group: null, module: u});

export const allViews = () => [...byView.keys()];
export const isKnownView = v => byView.has(v);
export const locate = view => byView.get(ALIASES[view] || view) || null;

export function pathFor(view) {
  const view2 = ALIASES[view] || view, loc = byView.get(view2);
  if (!loc) return ROOT;
  if (!loc.group) return `${ROOT}/${loc.module.slug}`;          // utility
  if (loc.group.id === "command-center") return ROOT;
  return loc.module ? `${ROOT}/${loc.group.slug}/${loc.module.slug}` : `${ROOT}/${loc.group.slug}`;
}

export function buildRoute(view, params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== "")).toString();
  return `#/${pathFor(view)}${q ? "?" + q : ""}`;
}

/** Resolves any hash (canonical or legacy) → {view, group, module, params, canonical, legacy, unknown}. */
export function resolveHash(hash = "") {
  const raw = String(hash).replace(/^#\/?/, "");
  const [pathRaw, query = ""] = raw.split("?");
  const params = Object.fromEntries(new URLSearchParams(query));
  const segs = pathRaw.split("/").filter(Boolean);
  let view = null, legacy = false;
  if (segs[0] === ROOT) {
    const [, g, m] = segs;
    if (!g) view = "dashboard";
    else {
      const util = UTILITIES.find(u => u.slug === g);
      const grp = GROUPS.find(x => x.slug === g && x.slug);
      if (util && !m) view = util.view;
      else if (grp && !m) view = grp.view;
      else if (grp) view = grp.modules.find(x => x.slug === m)?.view || null;
    }
  } else if (segs.length === 0) view = "dashboard";
  else if (segs.length === 1 && (byView.has(segs[0]) || ALIASES[segs[0]])) { view = ALIASES[segs[0]] || segs[0]; legacy = true; }
  const unknown = !view;
  if (unknown) view = "dashboard";
  const loc = byView.get(view);
  const canonical = buildRoute(view, params);
  return {view, params, group: loc?.group || null, module: loc?.module || null, canonical, legacy, unknown, isGroup: view.startsWith("group:")};
}

/** Breadcrumb model: EXECUTION OS / GRUPO / MÓDULO [/ extra]. `href` is null for the current (last) item. */
export function breadcrumbs(route, extra = null) {
  const items = [{label: "EXECUTION OS", href: buildRoute("dashboard")}];
  const {group, module} = route;
  if (group && group.id !== "command-center") items.push({label: group.label, href: buildRoute(group.view)});
  if (group?.id === "command-center") items.push({label: group.label, href: null});
  else if (module) items.push({label: module.label, href: buildRoute(module.view, {})});
  if (extra) items.push({label: extra, href: null});
  else if (items.length) { /* last item is current */ }
  const last = items.length - 1;
  items.forEach((it, i) => { if (i === last) it.href = null; });
  return items;
}

/** Every module must be reachable and have exactly one canonical URL (used by tests). */
export function allRoutes() {
  const out = [];
  for (const g of GROUPS) { out.push({view: g.view, path: pathFor(g.view), group: g.id}); for (const m of g.modules) out.push({view: m.view, path: pathFor(m.view), group: g.id}); }
  for (const u of UTILITIES) out.push({view: u.view, path: pathFor(u.view), group: null});
  return out;
}
