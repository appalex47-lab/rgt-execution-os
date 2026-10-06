/**
 * RGT → RevNavigator execution context, built ONLY from RGT's deterministic engines.
 * Cohere never participates. No commercial metric is calculated or read here.
 * Payload is intentionally minimal (ids/titles/status) — no descriptions, evidence or free text.
 */
import {getExecutionHealth} from "../engines/executionHealthEngine.js";
import {getTransformWip, WIP_LIMIT} from "../engines/wipEngine.js";
import {buildAlerts} from "../engines/alertEngine.js";
import {buildExecutionPerformance} from "../engines/performanceEngine.js";
import {getActiveSprint} from "../engines/sprintEngine.js";
import {getMustWinIds} from "../engines/mustWinEngine.js";
import {normalizeExecutionContext} from "./revNavigatorContract.js";

const brief = i => ({id: i.id, title: i.title, pillar: i.pillar, status: i.status, owner: i.owner ?? null});

export function buildExecutionContext(snapshot, now = new Date()) {
  const s = snapshot || {};
  const initiatives = s.initiatives || [], sprints = s.sprints || [];
  const sprint = getActiveSprint(sprints);
  const health = getExecutionHealth({...s, initiatives, sprints, checklist: s.checklist || []});
  const perf = buildExecutionPerformance({...s, initiatives, sprints}, {});
  const mustWinIds = sprint ? getMustWinIds(sprint, initiatives) : [];
  const dw = s.deepWork || [];
  return normalizeExecutionContext({
    activeSprint: sprint ? {id: sprint.id, week_number: sprint.week_number ?? null, year: sprint.year ?? null, start_date: sprint.start_date ?? null, end_date: sprint.end_date ?? null, status: sprint.status} : null,
    mustWin: mustWinIds.map(id => initiatives.find(i => i.id === id)).filter(Boolean).map(brief),
    blockedInitiatives: initiatives.filter(i => i.status === "BLOCKED").map(brief),
    transformWIP: {active: getTransformWip(initiatives), limit: WIP_LIMIT},
    executionHealth: {status: health.status, score: health.score, dimensions: Object.fromEntries(Object.entries(health.dimensions).map(([k, v]) => [k, v.value]))},
    deepWork: {activeSession: dw.some(x => x.status === "IN_PROGRESS"), sessionsCompleted: perf.metrics.deepWork.sessions, minutes: perf.metrics.deepWork.minutes},
    weeklyCompletion: {completed: perf.metrics.initiativesCompleted, cancelled: perf.metrics.initiativesCancelled, mustWinCompleted: perf.metrics.mustWin.completed, mustWinTotal: perf.metrics.mustWin.total, dodRate: perf.metrics.dod.rate},
    criticalActions: buildAlerts({sprints, initiatives, checklist: s.checklist || []}, now).filter(a => a.level === "BLOCKER" || a.level === "WARNING").map(a => ({id: a.id, level: a.level, title: a.title})),
    source: "RGT",
    asOf: now.toISOString()
  });
}
