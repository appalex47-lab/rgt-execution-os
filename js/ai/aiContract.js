/**
 * RGT AI Contract — Phase AI-1
 *
 * This module defines the boundary between deterministic RGT logic and Cohere.
 * It contains no network calls and no business calculations.
 */
export const AI_CONTRACT_VERSION = "1.0.0";

export const AI_MODES = Object.freeze({
  EXPLAIN: "EXPLAIN",
  DRAFT: "DRAFT",
  ASSIST: "ASSIST",
  NARRATE: "NARRATE"
});

export const AI_PERMISSIONS = Object.freeze({
  READ: "READ",
  DRAFT: "DRAFT",
  CONFIRM_REQUIRED: "CONFIRM_REQUIRED",
  WRITE: "WRITE"
});

export const AI_GUARDRAILS = Object.freeze({
  NEVER_CALCULATE_COMMERCIAL_PACING: true,
  NEVER_CREATE_UNCONFIRMED_INITIATIVE: true,
  NEVER_CHANGE_WIP_LIMIT: true,
  NEVER_BYPASS_READY_GATE: true,
  NEVER_BYPASS_DOD_GATE: true,
  NEVER_MARK_DONE_WITHOUT_VALIDATION: true,
  NEVER_INVENT_MISSING_FACTS: true,
  SOURCE_OF_TRUTH: "RGT_DETERMINISTIC_ENGINES"
});

export const AI_TOOLS = Object.freeze({
  getCurrentSprint: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.READ },
  getTodayTasks: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.READ },
  getWeekTasks: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.READ },
  getMonthTasks: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.READ },
  getMustWin: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.READ },
  getBlockedInitiatives: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.READ },
  getExecutionHealth: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.READ },
  getInitiative: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.READ },
  getDeepWorkCandidates: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.READ },
  draftInitiative: { mode: AI_MODES.DRAFT, permission: AI_PERMISSIONS.DRAFT },
  draftTaskBreakdown: { mode: AI_MODES.DRAFT, permission: AI_PERMISSIONS.DRAFT },
  proposeControlledAction: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.CONFIRM_REQUIRED },
  executeControlledAction: { mode: AI_MODES.ASSIST, permission: AI_PERMISSIONS.WRITE },
  explainConcept: { mode: AI_MODES.EXPLAIN, permission: AI_PERMISSIONS.READ }
});

export function buildAIContext(snapshot) {
  return {
    contract_version: AI_CONTRACT_VERSION,
    source_of_truth: AI_GUARDRAILS.SOURCE_OF_TRUTH,
    data: {
      sprints: snapshot?.sprints ?? [],
      initiatives: snapshot?.initiatives ?? [],
      checklist: snapshot?.checklist ?? [],
      evidence: snapshot?.evidence ?? [],
      reviews: snapshot?.reviews ?? [],
      deep_work: snapshot?.deep_work ?? [],
      activity: snapshot?.activity ?? []
    },
    external_commercial_context: snapshot?.externalPacing ?? null
  };
}

export function isAIWriteAllowed(action) {
  return ["draftInitiative", "draftTaskBreakdown"].includes(action);
}

export function validateAIResponseEnvelope(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.type === "string" &&
    typeof value.message === "string" && value.message.trim().length > 0 &&
    (value.data === undefined || typeof value.data === "object")
  );
}
