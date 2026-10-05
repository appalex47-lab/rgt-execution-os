import {db} from "../db/indexedDB.js";
import {state} from "../core/state.js";
import {getActiveSprint} from "../engines/sprintEngine.js";
import {PILLARS, getMustWinIds, validateMustWins, getEligibleByPillar} from "../engines/mustWinEngine.js";
import {requestRender} from "../core/events.js";
import {esc} from "../core/html.js";

/** Must-Win: selection, status and progress in one place (moved out of Planning; same engine, same rule: 1 RUN + 1 GROW + 1 TRANSFORM). */
export function mustWin(d) {
  const s = getActiveSprint(d.sprints) || d.sprints[0];
  if (!s) return `<div class=head><div><div class=eyebrow>Planificar</div><h1>Must-Win</h1></div></div><section class=panel><p class=sub>No hay Sprint. Crea uno en <a href="#/execution/planificar/planning">Planning Semanal</a>.</p></section>`;
  const ids = getMustWinIds(s, d.initiatives), sel = ids.map(id => d.initiatives.find(x => x.id === id)).filter(Boolean);
  const done = sel.filter(x => x.status === "DONE").length;
  return `<div class=head><div><div class=eyebrow>Planificar</div><h1>Must-Win</h1><div class=sub>Una batalla por pilar. Las iniciativas elegibles son las READY, IN_PROGRESS o BLOCKED.</div></div><div><span class=status>Semana ${esc(s.week_number)}</span> <span class=status>${done}/${sel.length || 3} completados</span></div></div>
  <section class=panel data-rgt-target="must-win-panel"><div class=section-head><div><h2>Must-Win Battles</h2><div class=sub>Guardar exige 1 RUN + 1 GROW + 1 TRANSFORM.</div></div><button class="btn primary" id="save-mustwins">Guardar 3 Must-Win</button></div>
  <div class=grid3>${PILLARS.map(pillar => { const cur = sel.find(x => x.pillar === pillar), options = getEligibleByPillar(d.initiatives, pillar);
    const pend = cur ? d.checklist.filter(c => c.task_id === cur.id && c.category === "DOD" && !c.is_completed).length : 0;
    return `<div class="mw-card ${pillar.toLowerCase()}"><b>${pillar}</b><select data-mw="${pillar}" aria-label="Must-Win ${pillar}"><option value="">Seleccionar iniciativa…</option>${options.map(x => `<option value="${esc(x.id)}" ${x.id === cur?.id ? "selected" : ""}>${esc(x.id)} · ${esc(x.title)}</option>`).join("")}</select><small>${options.length} elegible(s)</small>
    ${cur ? `<div class=mini><span class=status>${esc(String(cur.status).replaceAll("_", " "))}</span> · ${pend} DoD pendiente(s) · <button class="link-btn" data-open-id="${esc(cur.id)}">Ver iniciativa</button></div>` : `<div class=mini>Sin definir</div>`}</div>`; }).join("")}</div></section>
  <div class=callout><b>Regla:</b> Must-Win no crea trabajo nuevo: apunta a una iniciativa real. El cierre de semana revisa su cumplimiento en <a href="#/execution/revisar/weekly-review">Weekly Review</a>.</div>`;
}
export function bindMustWin() {
  document.querySelector("#save-mustwins")?.addEventListener("click", saveMustWins);
  document.querySelectorAll("[data-open-id]").forEach(b => b.addEventListener("click", async () => (await import("./initiativeDetail.js")).openInitiativeDetail(b.dataset.openId)));
}
const q = s => document.querySelector(s);
async function saveMustWins() {
  const d = state.get(), s = getActiveSprint(d.sprints); if (!s) return;
  const ids = PILLARS.map(p => q(`[data-mw="${p}"]`)?.value).filter(Boolean);
  const check = validateMustWins(ids, d.initiatives); if (!check.allowed) return toast(check.reason, "error");
  const set = new Set(ids);
  for (const x of d.initiatives.map(x => ({...x, is_must_win: set.has(x.id)}))) await db.put("initiatives", x);
  await db.put("sprints", {...s, must_win_ids: ids, updated_at: new Date().toISOString()});
  await db.put("activity", {id: crypto.randomUUID(), timestamp: new Date().toISOString(), entity_id: s.id, action: "MUST_WINS_UPDATED", detail: ids.join(", ")});
  state.set(await db.snapshot()); requestRender(); toast("3 Must-Win Battles guardadas.", "success");
}
function toast(message, type) { let el = q("#rgt-toast"); if (!el) { el = document.createElement("div"); el.id = "rgt-toast"; document.body.appendChild(el); } el.className = `toast ${type}`; el.textContent = message; clearTimeout(window.__rgtToast); window.__rgtToast = setTimeout(() => el.remove(), 3500); }
