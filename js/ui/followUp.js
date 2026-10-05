import {buildFollowUp, STALE_DAYS} from "../engines/followUpEngine.js";
import {buildAlerts} from "../engines/alertEngine.js";
import {openInitiativeDetail} from "./initiativeDetail.js";
import {esc} from "../core/html.js";

const row = (x, note = "") => `<div class="row"><span><b>${esc(x.id)}</b> · ${esc(x.title)} <small class=mini>${esc(x.pillar)} · ${esc(String(x.status).replaceAll("_", " "))}${note ? " · " + esc(note) : ""}</small></span><button class="btn" data-open-id="${esc(x.id)}">Abrir</button></div>`;
const block = (title, sub, rows, empty) => `<section class=panel><div class=section-head><div><h2>${title}</h2><div class=sub>${sub}</div></div><span class=status>${rows.length}</span></div>${rows.length ? rows.join("") : `<div class=empty>${empty}</div>`}</section>`;
/** Seguimiento: what is happening with my execution? (Absorbs the former "Alertas" screen; Execution Health stays in Revisar.) */
export function followUp(d) {
  const f = buildFollowUp(d), a = buildAlerts(d);
  return `<div class=head><div><div class=eyebrow>Ejecutar</div><h1>Seguimiento</h1><div class=sub>Qué se atora, qué se atrasa y qué necesita una decisión. La salud global está en <a href="#/execution/revisar/execution-health">Execution Health</a>.</div></div></div>
  <section class=panel data-rgt-target="alerts"><div class=section-head><div><h2>Alertas</h2><div class=sub>Señales determinísticas; no sustituyen tu criterio.</div></div><span class=status>${a.length}</span></div>${a.length ? a.map(x => `<article class="alert-card ${esc(x.level.toLowerCase())}"><b>${esc(x.level)}</b><h3>${esc(x.title)}</h3><p>${esc(x.detail)}</p></article>`).join("") : '<div class="empty">No hay alertas activas.</div>'}</section>
  <div class=grid2 style="margin-top:14px">
  ${block("Retrasadas", "Trabajo abierto en un Sprint cuya fecha de fin ya pasó (las iniciativas no tienen fecha propia).", f.overdue.map(x => row(x)), f.sprint ? "Nada retrasado." : "No hay Sprint ACTIVE.")}
  ${block("Bloqueadas", "Consumen capacidad y piden una decisión.", f.blocked.map(x => row(x)), "Sin bloqueos.")}
  ${block("Próximas", "READY: listas para iniciar.", f.upcoming.map(x => row(x)), "No hay iniciativas READY.")}
  ${block("Carry-over", "Continúan desde la última Weekly Review.", f.carryOver.map(x => row(x)), "Sin carry-over.")}
  ${block("Sin movimiento", `Abiertas y sin actividad registrada en ${STALE_DAYS}+ días.`, f.stale.map(r => row(r.initiative, r.days == null ? "sin actividad registrada" : `${r.days} días`)), "Todo tiene movimiento reciente.")}
  ${block("Acciones pendientes", "DoD sin completar en iniciativas abiertas.", f.pendingDod.map(r => row(r.initiative, `${r.pending.length} DoD pendiente(s)`)), "No hay DoD pendientes.")}
  </div>`;
}
export function bindFollowUp() { document.querySelectorAll("[data-open-id]").forEach(b => b.addEventListener("click", () => openInitiativeDetail(b.dataset.openId))); }
