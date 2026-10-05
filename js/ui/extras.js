import {DB_VERSION, DB_NAME, STORE_NAMES} from "../db/indexedDB.js";
import {BACKUP_VERSION} from "../engines/backupEngine.js";
import {getActiveSprint} from "../engines/sprintEngine.js";
import {buildFollowUp} from "../engines/followUpEngine.js";
import {getReadyIssues} from "../engines/readyEngine.js";
import {PILLARS} from "../engines/mustWinEngine.js";
import {esc} from "../core/html.js";

/** Read-only panels that complete existing views without adding rules or storage. */
export function dataVersionPanel(d) {
  return `<section class=panel style="margin-top:14px" data-rgt-target="data-version"><h2>Versión de datos</h2><div class=row><span>Base IndexedDB</span><b>${esc(DB_NAME)} · v${DB_VERSION}</b></div><div class=row><span>Formato de backup</span><b>${esc(BACKUP_VERSION)} (schema 4)</b></div>
  <div class=row><span>Migraciones</span><b>Automáticas al abrir · no destructivas · idempotentes</b></div>
  <table class=table><thead><tr><th>Store</th><th>Registros</th></tr></thead><tbody>${STORE_NAMES.map(s => `<tr><td>${esc(s)}</td><td>${(d[s] || []).length}</td></tr>`).join("")}</tbody></table>
  <p class=mini>Las preferencias, la navegación y el progreso de aprendizaje viven en los stores <code>prefs</code> y <code>learning</code> y viajan en el backup.</p></section>`;
}
export function pillarReviewPanel(d) {
  const s = getActiveSprint(d.sprints) || d.sprints[0]; if (!s) return "";
  const inS = t => { const x = String(t || "").slice(0, 10); return x && x >= String(s.start_date || "") && x <= String(s.end_date || ""); };
  const mw = new Set(s.must_win_ids || []);
  return `<section class=panel style="margin-top:14px" data-rgt-target="pillar-review"><h2>Resumen por pilar (solo lectura)</h2><div class=sub>Hechos del Sprint para responder las preguntas de cierre.</div><div class=grid3>${PILLARS.map(p => { const it = d.initiatives.filter(x => x.pillar === p);
    return `<div class="mw-card ${p.toLowerCase()}"><b>${p}</b><div class=mini>Terminadas en el Sprint: ${it.filter(x => x.status === "DONE" && inS(x.completed_at)).length}</div><div class=mini>En curso: ${it.filter(x => x.status === "IN_PROGRESS").length} · Bloqueadas: ${it.filter(x => x.status === "BLOCKED").length}</div><div class=mini>Must-Win: ${it.filter(x => mw.has(x.id)).map(x => `${esc(x.id)} (${esc(x.status)})`).join(", ") || "—"}</div></div>`; }).join("")}</div></section>`;
}
export function healthSignalsPanel(d) {
  const f = buildFollowUp(d), s = getActiveSprint(d.sprints), open = d.initiatives.filter(x => ["READY", "IN_PROGRESS", "BLOCKED"].includes(x.status));
  const notReady = open.filter(x => getReadyIssues(x, d.checklist).length).length, mw = s?.must_win_ids || [], done = mw.filter(id => d.initiatives.find(x => x.id === id)?.status === "DONE").length;
  return `<section class=panel style="margin-top:14px" data-rgt-target="health-signals"><h2>Señales complementarias</h2><div class=sub>Lectura de apoyo; no modifican el score.</div>
  <div class=row><span>Iniciativas abiertas sin DoR completo</span><b>${notReady}</b></div><div class=row><span>Sin movimiento (≥5 días)</span><b>${f.stale.length}</b></div><div class=row><span>Carry-over vigente</span><b>${f.carryOver.length}</b></div>
  <div class=row><span>Cumplimiento del Sprint (Must-Win terminados)</span><b>${done}/${mw.length || 3}</b></div><div class=row><span>Sprint vencido</span><b>${f.overdueSprint ? "Sí" : "No"}</b></div></section>`;
}
