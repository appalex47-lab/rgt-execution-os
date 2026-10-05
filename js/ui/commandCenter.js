import {homeBrief} from "./homeBrief.js";
import {getActiveSprint} from "../engines/sprintEngine.js";
import {getMustWinIds, PILLARS} from "../engines/mustWinEngine.js";
import {getTransformWip, WIP_LIMIT} from "../engines/wipEngine.js";
import {getExecutionHealth} from "../engines/executionHealthEngine.js";
import {getNextAction} from "../engines/nextActionEngine.js";
import {help} from "../learning/html.js";
import {esc} from "../core/html.js";

const HEALTH = {STABLE: "Estable", ATTENTION: "Atención", AT_RISK: "Riesgo operativo"};
/** Command Center: "¿dónde estoy y qué debería hacer ahora?" — compact; deep detail lives in the destination module. */
export function commandCenter(d) {
  const s = getActiveSprint(d.sprints) || d.sprints[0] || null, i = d.initiatives;
  const ids = s ? getMustWinIds(s, i) : [], mw = ids.map(id => i.find(x => x.id === id)).filter(Boolean);
  const done = mw.filter(x => x.status === "DONE").length, h = getExecutionHealth(d), na = getNextAction(d);
  const blocked = i.filter(x => x.status === "BLOCKED").length, dod = d.checklist.filter(x => !x.is_completed).length, wip = getTransformWip(i);
  const tile = (label, value, sub, view) => `<a class="kpi kpi-link" href="${view}" data-go-link><small>${label}</small><strong>${value}</strong><span class="mini">${sub}</span></a>`;
  return `<div class=head><div><div class=eyebrow>Execution OS</div><h1>Command Center</h1><div class=sub>¿Dónde estoy y qué debería hacer ahora?</div></div></div>
  <section class="panel next-step" data-rgt-target="next-step" aria-labelledby="ns-t"><div class=eyebrow id="ns-t">Siguiente paso</div>
    <h2>${esc(na.title)} ${na.concept ? help(na.concept, "popover") : ""}</h2>
    <p><b>¿Por qué?</b> ${esc(na.why)}</p><button class="btn primary" data-go="${esc(na.cta.view)}" data-rgt-target="next-step-cta">${esc(na.cta.label)} →</button></section>
  <div class="kpis cc-kpis">
    ${tile("Sprint", s ? `Semana ${esc(s.week_number)}` : "—", s ? `${esc(s.start_date)} → ${esc(s.end_date)}` : "Sin Sprint ACTIVE", "#/execution/planificar/planning")}
    ${tile("Must-Win", `${done}/${mw.length || 3}`, "completados", "#/execution/planificar/must-win")}
    ${tile("WIP TRANSFORM", `${wip}/${WIP_LIMIT}`, wip >= WIP_LIMIT ? "capacidad al máximo" : "con capacidad", "#/execution/planificar/board")}
    ${tile("Bloqueos", blocked, blocked ? "requieren decisión" : "sin bloqueos", "#/execution/ejecutar/seguimiento")}
    ${tile("DoD pendientes", dod, "elementos", "#/execution/ejecutar/tareas")}
    ${tile("Execution Health", HEALTH[h.status], `${Math.round(h.score * 100)}/100`, "#/execution/revisar/execution-health")}
  </div>
  <section class=panel style="margin-top:14px"><div class=section-head><h2>Must-Win de la semana</h2><a class="link-btn" href="#/execution/planificar/must-win">Administrar →</a></div>
    <div class=battles>${PILLARS.map(p => { const x = mw.find(a => a.pillar === p); return `<div class="mw-card ${p.toLowerCase()}"><b>${p}</b>${x ? `<span>${esc(x.id)} · ${esc(x.title)}</span><small class=status>${esc(String(x.status).replaceAll("_", " "))}</small>` : `<span class=sub>Sin definir</span>`}</div>`; }).join("")}</div></section>
  <details class="panel cc-brief" style="margin-top:14px"><summary>✦ Briefing con IA (opcional)</summary>${homeBrief(d)}</details>`;
}
