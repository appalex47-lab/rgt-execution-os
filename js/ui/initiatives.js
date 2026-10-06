import {getReadyIssues} from "../engines/readyEngine.js";
import {getTransformWip, WIP_LIMIT} from "../engines/wipEngine.js";
import {openCreateInitiative, openInitiativeDetail} from "./initiativeDetail.js";
import {openInitiativeCopilot} from "./initiativeCopilot.js";
import {router} from "../core/router.js";
import {PILLARS, STATUSES} from "../engines/transitionEngine.js";
import {help} from "../learning/html.js";
import {esc} from "../core/html.js";

const opt = (list, sel, all) => `<option value="">${all}</option>${list.map(v => `<option ${v === sel ? "selected" : ""} value="${esc(v)}">${esc(String(v).replaceAll("_", " "))}</option>`).join("")}`;
/** Iniciativas: the one place to create/administer initiatives. Rules come from readyEngine / dodEngine / transitionEngine. */
export function initiatives(d, p = {}) {
  const q = String(p.q || "").toLowerCase();
  const rows = d.initiatives.filter(x => (!p.pillar || x.pillar === p.pillar) && (!p.status || x.status === p.status) && (!p.owner || x.owner === p.owner) && (!q || `${x.id} ${x.title}`.toLowerCase().includes(q)));
  const owners = [...new Set(d.initiatives.map(x => x.owner).filter(Boolean))].sort(), wip = getTransformWip(d.initiatives);
  return `<div class=head data-rgt-target="initiatives-header"><div><div class=eyebrow>Planificar</div><h1>Iniciativas</h1><div class=sub>Crea y administra iniciativas. Las reglas de Ready, DoD y WIP las aplica RGT.</div></div>
    <div><span class="wip-chip ${wip >= WIP_LIMIT ? "wip-full" : ""}" data-rgt-target="wip-chip">TRANSFORM WIP <b>${wip}/${WIP_LIMIT}</b></span> ${help("component:wip-chip", "popover")} <button class="btn" id="ai-copilot">✦ Crear con IA</button> <button class="btn primary" id="new-initiative" data-rgt-target="new-initiative">+ Nueva iniciativa</button></div></div>
  <section class=panel><form class="filters" id="init-filters" role="search" aria-label="Filtrar iniciativas"><input name="q" placeholder="Buscar por ID o nombre" value="${esc(p.q || "")}" aria-label="Buscar"><select name="pillar" aria-label="Pilar">${opt(PILLARS, p.pillar, "Todos los pilares")}</select><select name="status" aria-label="Estado">${opt(STATUSES, p.status, "Todos los estados")}</select><select name="owner" aria-label="Responsable">${opt(owners, p.owner, "Todos los responsables")}</select><a class="link-btn" href="#/execution/planificar/iniciativas">Limpiar</a></form>
  <div class=table-wrap><table class="table"><caption class="sr-only">Iniciativas</caption><thead><tr><th>ID</th><th>Iniciativa</th><th>Pilar</th><th>Estado</th><th>Responsable</th><th>Prioridad</th><th>Ready</th><th>DoD</th><th>Evid.</th><th></th></tr></thead><tbody>
  ${rows.map(x => { const dod = d.checklist.filter(c => c.task_id === x.id && c.category === "DOD"), ok = dod.filter(c => c.is_completed).length, issues = getReadyIssues(x, d.checklist).length;
    return `<tr><td>${esc(x.id)}${x.is_must_win ? " ★" : ""}</td><td>${esc(x.title)}</td><td>${esc(x.pillar)}</td><td><span class=status>${esc(String(x.status).replaceAll("_", " "))}</span></td><td>${esc(x.owner || "—")}</td><td>${esc(x.priority || "—")}</td><td>${issues ? `Falta ${issues}` : "✓"}</td><td>${ok}/${dod.length}</td><td>${d.evidence.filter(e => e.task_id === x.id).length}</td><td><button class="btn" data-open-id="${esc(x.id)}" aria-label="Abrir ${esc(x.id)}">Abrir</button></td></tr>`; }).join("") || `<tr><td colspan=10 class=empty>No hay iniciativas con estos filtros.</td></tr>`}
  </tbody></table></div><p class=mini>${rows.length} de ${d.initiatives.length} iniciativas.</p></section>`;
}
export function bindInitiatives(params = {}) {
  document.querySelector("#new-initiative")?.addEventListener("click", () => openCreateInitiative());
  document.querySelector("#ai-copilot")?.addEventListener("click", () => openInitiativeCopilot());
  document.querySelectorAll("[data-open-id]").forEach(b => b.addEventListener("click", () => openInitiativeDetail(b.dataset.openId)));
  const f = document.querySelector("#init-filters");
  f?.addEventListener("change", () => router.go("initiatives", Object.fromEntries(new FormData(f))));
  f?.addEventListener("submit", e => { e.preventDefault(); router.go("initiatives", Object.fromEntries(new FormData(f))); });
}
