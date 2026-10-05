import {GROUPS, buildRoute} from "../core/nav.js";
import {registry} from "../learning/index.js";
import {esc} from "../core/html.js";

/** Landing for a navigation group: one card per module, described from the shared Context System. */
export function groupLanding(group) {
  const g = typeof group === "string" ? GROUPS.find(x => x.id === group) : group;
  if (!g) return "";
  const ctx = registry.contextForView(g.view);
  return `<div class=head><div><div class=eyebrow>${g.icon} Execution OS</div><h1>${esc(g.label)}</h1><div class=sub>${esc(ctx?.shortDescription || "")}</div></div></div>
  <div class="grid3 group-cards">${g.modules.map(m => { const c = registry.contextForView(m.view); return `<a class="panel group-card" href="${buildRoute(m.view)}" data-rgt-target="module-${esc(m.view)}"><h3>${esc(m.label)}</h3><p>${esc(c?.shortDescription || "")}</p><span class="link-btn">Abrir →</span></a>`; }).join("")}</div>`;
}
