import {getActiveSprint} from "./sprintEngine.js";
import {getReviewForSprint} from "./reviewEngine.js";

/**
 * Seguimiento: "¿qué está pasando con mi ejecución?" Pure and read-only; derives lists from data RGT already stores.
 * Notes on honesty: initiatives have no individual due date, so "retrasadas" means: open work in a Sprint whose end date passed.
 * Execution Health (score) lives in Revisar and is NOT recomputed here.
 */
export const STALE_DAYS = 5;
const OPEN = ["READY", "IN_PROGRESS", "BLOCKED"];
const DAY = 86400000;

export function lastMovement(initiative, activity = []) {
  const stamps = activity.filter(a => a.entity_id === initiative.id).map(a => Date.parse(a.timestamp)).filter(Number.isFinite);
  const created = Date.parse(initiative.created_at);
  if (Number.isFinite(created)) stamps.push(created);
  return stamps.length ? Math.max(...stamps) : null;
}

export function buildFollowUp(d, now = new Date()) {
  const items = d.initiatives || [], sprint = getActiveSprint(d.sprints || []);
  const t = now.getTime(), end = sprint ? new Date(`${sprint.end_date}T23:59:59`).getTime() : NaN;
  const open = items.filter(x => OPEN.includes(x.status));
  const overdueSprint = Boolean(sprint) && Number.isFinite(end) && end < t;
  const reviewed = (d.reviews || []).slice().sort((a, b) => String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)))[0];
  const carryIds = new Set((reviewed?.carry_over_ids) || []);
  const stale = open.map(x => {
    const last = lastMovement(x, d.activity || []);
    return {initiative: x, lastMovement: last, days: last == null ? null : Math.floor((t - last) / DAY)};
  }).filter(r => r.days == null || r.days >= STALE_DAYS);
  return {
    sprint, overdueSprint,
    overdue: overdueSprint ? open : [],
    blocked: items.filter(x => x.status === "BLOCKED"),
    upcoming: items.filter(x => x.status === "READY"),
    carryOver: items.filter(x => carryIds.has(x.id) && !["DONE", "CANCELLED"].includes(x.status)),
    stale,
    pendingDod: open.map(x => ({initiative: x, pending: (d.checklist || []).filter(c => c.task_id === x.id && c.category === "DOD" && !c.is_completed)})).filter(r => r.pending.length)
  };
}
export {getReviewForSprint};
