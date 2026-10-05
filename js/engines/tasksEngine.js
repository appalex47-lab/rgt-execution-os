import {getActiveSprint} from "./sprintEngine.js";
import {getReadyIssues} from "./readyEngine.js";

/**
 * "Mis tareas": the actionable view of RGT work. A task here is an initiative that can/should move now
 * (READY · IN_PROGRESS · BLOCKED) together with its pending DoD. It is NOT a generic task manager.
 * RGT has no user identity, so "mis" = filter by responsible (owner). "Vence" = end of the active Sprint
 * (initiatives have no individual due date).
 */
export const TASK_STATUSES = ["READY", "IN_PROGRESS", "BLOCKED"];
const PRIORITY_ORDER = {Alta: 0, Media: 1, Baja: 2};

export function buildMyTasks(d, filters = {}) {
  const sprint = getActiveSprint(d.sprints || []);
  const mw = new Set(sprint?.must_win_ids || []);
  const dod = d.checklist || [];
  const q = String(filters.q || "").trim().toLowerCase();
  const statuses = filters.status ? [filters.status] : TASK_STATUSES;
  const rows = (d.initiatives || []).filter(x => statuses.includes(x.status))
    .filter(x => !filters.pillar || x.pillar === filters.pillar)
    .filter(x => !filters.owner || x.owner === filters.owner)
    .filter(x => filters.mustWin !== "1" || mw.has(x.id) || x.is_must_win)
    .filter(x => !q || `${x.id} ${x.title} ${x.owner}`.toLowerCase().includes(q))
    .map(x => {
      const items = dod.filter(c => c.task_id === x.id && c.category === "DOD");
      return {initiative: x, mustWin: mw.has(x.id) || !!x.is_must_win, dodTotal: items.length, dodPending: items.filter(c => !c.is_completed).length,
        readyIssues: getReadyIssues(x, dod).length, dueLabel: sprint?.end_date || null, blocked: x.status === "BLOCKED"};
    });
  rows.sort((a, b) => (b.blocked - a.blocked) || (b.mustWin - a.mustWin) || ((PRIORITY_ORDER[a.initiative.priority] ?? 3) - (PRIORITY_ORDER[b.initiative.priority] ?? 3)) || a.initiative.id.localeCompare(b.initiative.id));
  return rows;
}
export const taskOwners = d => [...new Set((d.initiatives || []).map(x => x.owner).filter(Boolean))].sort();
