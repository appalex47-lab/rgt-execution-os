import {buildAIContext} from "../ai/aiContract.js";
import {parseCommercialContext, normalizeExecutionContext} from "./revNavigatorContract.js";
import {buildExecutionContext} from "./executionContext.js";

/** Adapter boundary: transports and validates data; does not own business logic. */
export function toCommercialContext(externalContext) {
  return parseCommercialContext(externalContext);
}

export function toExecutionContext(snapshot, derived = {}) {
  // Execution context is derived from RGT engines; `derived` can only override pieces in tests/hosts.
  const base = buildExecutionContext(snapshot);
  return normalizeExecutionContext({...base, ...derived, source: "RGT"});
}

/** AI context. Commercial context is passed through exactly as validated; it is never recomputed. */
export function buildIntegrationAIContext(snapshot) {
  return {
    ...buildAIContext(snapshot),
    integration: {
      commercial_source: "RevNavigator",
      execution_source: "RGT",
      commercial_context: snapshot?.externalPacing ?? null,
      rule: "Never duplicate or recalculate commercial metrics in RGT."
    }
  };
}
