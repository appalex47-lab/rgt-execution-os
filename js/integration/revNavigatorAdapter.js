import {buildAIContext} from "../ai/aiContract.js";
import {normalizeCommercialContext, normalizeExecutionContext} from "./revNavigatorContract.js";

/** Adapter boundary: transports and normalizes data; does not own business logic. */
export function toCommercialContext(externalContext) {
  return normalizeCommercialContext(externalContext || {});
}

export function toExecutionContext(snapshot, derived={}) {
  const s = snapshot || {};
  return normalizeExecutionContext({
    activeSprint: derived.activeSprint ?? s.sprints?.find(x=>x.status === "ACTIVE") ?? null,
    mustWin: derived.mustWin ?? [],
    blockedInitiatives: derived.blockedInitiatives ?? s.initiatives?.filter(x=>x.status === "BLOCKED") ?? [],
    transformWIP: derived.transformWIP ?? null,
    executionHealth: derived.executionHealth ?? null,
    deepWork: derived.deepWork ?? null,
    weeklyCompletion: derived.weeklyCompletion ?? null,
    criticalActions: derived.criticalActions ?? [],
    source: "RGT"
  });
}

export function buildIntegrationAIContext(snapshot) {
  return {
    ...buildAIContext(snapshot),
    integration: {
      commercial_source: "RevNavigator",
      execution_source: "RGT",
      commercial_context: normalizeCommercialContext(snapshot?.externalPacing || {}),
      rule: "Never duplicate or recalculate commercial metrics in RGT."
    }
  };
}
