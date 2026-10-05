import {getActiveSprint} from "./sprintEngine.js";
import {getMustWinIds, PILLARS} from "./mustWinEngine.js";
import {getTransformWip, WIP_LIMIT} from "./wipEngine.js";
import {getReadyIssues} from "./readyEngine.js";

/**
 * Deterministic "next step" for the Command Center. It only COMPOSES signals the existing engines already
 * produce (sprint, Must-Win, WIP, Ready, blocked) — it never calculates commercial figures and writes nothing.
 * Returns {id, title, why, cta:{label, view}, concept?}. First matching rule wins (priority order).
 */
export function getNextAction(d, now = new Date()) {
  const items = d.initiatives || [], sprint = getActiveSprint(d.sprints || []);
  const open = x => !["DONE", "CANCELLED"].includes(x.status);
  if (!sprint) return {id: "no-sprint", title: "Crea el Sprint de la semana", why: "Sin un Sprint ACTIVE no hay semana contra la cual planificar ni revisar.", cta: {label: "Ir a Planning Semanal", view: "planning"}};
  const end = new Date(`${sprint.end_date}T23:59:59`);
  if (!Number.isNaN(end.getTime()) && end < now) return {id: "sprint-overdue", title: "Cierra la semana: el Sprint ya venció", why: `El Sprint de la Semana ${sprint.week_number} terminó el ${sprint.end_date}. Revisa lo ocurrido y decide qué continúa.`, cta: {label: "Ir a Weekly Review", view: "review"}};
  if (getTransformWip(items) > WIP_LIMIT) return {id: "wip-over", title: "Reduce el WIP de TRANSFORM", why: `Hay más de ${WIP_LIMIT} iniciativas TRANSFORM consumiendo capacidad (BLOCKED también cuenta).`, cta: {label: "Ir al RGT Board", view: "board"}, concept: "concept:wip"};
  const ids = getMustWinIds(sprint, items), mw = ids.map(id => items.find(x => x.id === id)).filter(Boolean);
  const covered = PILLARS.every(p => mw.some(x => x.pillar === p));
  if (mw.length !== 3 || !covered) return {id: "define-must-win", title: "Define tus 3 Must-Win", why: "Necesitas exactamente una batalla RUN, una GROW y una TRANSFORM para que la semana tenga foco.", cta: {label: "Ir a Must-Win", view: "must-win"}};
  const blocked = mw.find(x => x.status === "BLOCKED");
  if (blocked) return {id: "unblock-must-win", title: `Desbloquea ${blocked.id} · ${blocked.title}`, why: "Es un Must-Win y está bloqueado: mientras siga así, la semana no avanza en ese pilar.", cta: {label: "Ir a Seguimiento", view: "follow-up"}};
  const notReady = mw.find(x => ["BACKLOG"].includes(x.status));
  if (notReady) { const n = getReadyIssues(notReady, d.checklist || []).length; return {id: "prepare-must-win", title: `Prepara ${notReady.id} · ${notReady.title}`, why: n ? `Es un Must-Win en BACKLOG y le faltan ${n} requisito(s) de Definition of Ready.` : "Es un Must-Win en BACKLOG y ya cumple Definition of Ready: puedes pasarlo a READY.", cta: {label: "Ir a Iniciativas", view: "initiatives"}}; }
  const startable = mw.find(x => x.status === "READY");
  if (startable) return {id: "start-must-win", title: `Inicia ${startable.id} · ${startable.title}`, why: "Es un Must-Win listo para ejecutar y todavía no empezó.", cta: {label: "Ir al RGT Board", view: "board"}};
  const pending = mw.filter(x => x.status === "IN_PROGRESS");
  if (pending.length) {
    const focus = pending.find(x => ["TRANSFORM", "GROW"].includes(x.pillar)) || pending[0];
    return {id: "advance-must-win", title: `Avanza ${focus.id} · ${focus.title}`, why: focus.pillar === "RUN" ? "Es un Must-Win en curso. Revisa su DoD pendiente." : "Es un Must-Win estratégico en curso: un bloque de Deep Work protege su avance.", cta: focus.pillar === "RUN" ? {label: "Ir a Mis tareas", view: "tasks"} : {label: "Ir a Deep Work", view: "deep-work"}, concept: focus.pillar === "RUN" ? undefined : "concept:wip"};
  }
  if (mw.every(x => x.status === "DONE") && open({status: "x"})) return {id: "weekly-review", title: "Cierra la semana", why: "Los 3 Must-Win están terminados. Registra el aprendizaje y decide el carry-over.", cta: {label: "Ir a Weekly Review", view: "review"}};
  return {id: "review-board", title: "Revisa el estado del Board", why: "No hay una acción urgente detectada; confirma que el trabajo activo sigue siendo el correcto.", cta: {label: "Ir al RGT Board", view: "board"}};
}
