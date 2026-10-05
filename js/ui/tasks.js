import {buildMyTasks, taskOwners, TASK_STATUSES} from "../engines/tasksEngine.js";
import {openInitiativeDetail} from "./initiativeDetail.js";
import {router} from "../core/router.js";
import {PILLARS} from "../engines/transitionEngine.js";
import {esc} from "../core/html.js";

const opt = (list, sel, all) => `<option value="">${all}</option>${list.map(v => `<option ${v === sel ? "selected" : ""} value="${esc(v)}">${esc(String(v).replaceAll("_", " "))}</option>`).join("")}`;
/** Mis tareas: what do I have to do? (actionable initiatives + pending DoD). Filters live in the URL so they can be shared/restored. */
export function tasks(d, p = {}) {
  const rows = buildMyTasks(d, p);
  return `<div class=head><div><div class=eyebrow>Ejecutar</div><h1>Mis tareas</h1><div class=sub>Lo que puedes mover ahora: READY, IN_PROGRESS y BLOCKED. RGT no tiene usuarios: «mis» = filtrar por responsable.</div></div></div>
  <section class=panel><form class="filters" id="task-filters" role="search" aria-label="Filtrar tareas"><input name="q" placeholder="Buscar" value="${esc(p.q || "")}" aria-label="Buscar"><select name="pillar" aria-label="Pilar">${opt(PILLARS, p.pillar, "Todos los pilares")}</select><select name="status" aria-label="Estado">${opt(TASK_STATUSES, p.status, "Estados accionables")}</select><select name="owner" aria-label="Responsable">${opt(taskOwners(d), p.owner, "Todos los responsables")}</select><label class="check-row"><input type="checkbox" name="mustWin" value="1" ${p.mustWin === "1" ? "checked" : ""}> Solo Must-Win</label><a class="link-btn" href="#/execution/ejecutar/tareas">Limpiar</a></form>
  <div class=list data-rgt-target="task-list">${rows.map(r => { const x = r.initiative;
    return `<article class="mw-card ${x.pillar.toLowerCase()} task-row ${r.blocked ? "is-blocked" : ""}"><div><b>${esc(x.id)} · ${esc(x.title)}</b> ${r.mustWin ? '<span class=status>★ Must-Win</span>' : ""} ${r.blocked ? '<span class="status warn">BLOQUEADA</span>' : ""}
      <div class=mini>${esc(x.pillar)} · ${esc(String(x.status).replaceAll("_", " "))} · Prioridad ${esc(x.priority || "—")} · ${esc(x.owner || "sin responsable")} · Cierre de Sprint: ${esc(r.dueLabel || "—")}</div>
      <div class=mini>DoD pendiente: ${r.dodPending}/${r.dodTotal}${r.readyIssues ? ` · Ready: falta ${r.readyIssues}` : ""}</div></div><button class="btn" data-open-id="${esc(x.id)}" aria-label="Abrir ${esc(x.id)}">Abrir</button></article>`; }).join("") || `<div class=empty>No hay tareas con estos filtros.</div>`}</div><p class=mini>${rows.length} tarea(s).</p></section>`;
}
export function bindTasks() {
  document.querySelectorAll("[data-open-id]").forEach(b => b.addEventListener("click", () => openInitiativeDetail(b.dataset.openId)));
  const f = document.querySelector("#task-filters"), go = () => router.go("tasks", Object.fromEntries(new FormData(f)));
  f?.addEventListener("change", go); f?.addEventListener("submit", e => { e.preventDefault(); go(); });
}
