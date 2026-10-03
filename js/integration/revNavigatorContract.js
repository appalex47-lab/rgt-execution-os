/**
 * Integration contract between RevNavigator (commercial source of truth)
 * and RGT Execution OS (execution source of truth).
 * No commercial calculations live here.
 */
export const REVNAV_INTEGRATION_VERSION = "1.0.0";
export const REVNAV_MESSAGE_NAMESPACE = "RGT_REVNAVIGATOR";

export const REVNAV_EVENTS = Object.freeze({
  READY: "READY",
  COMMERCIAL_CONTEXT_UPDATE: "COMMERCIAL_CONTEXT_UPDATE",
  REQUEST_COMMERCIAL_CONTEXT: "REQUEST_COMMERCIAL_CONTEXT",
  EXECUTION_CONTEXT_UPDATE: "EXECUTION_CONTEXT_UPDATE",
  NAVIGATE_TO_COMMERCIAL_VIEW: "NAVIGATE_TO_COMMERCIAL_VIEW"
});

export const COMMERCIAL_CONTEXT_FIELDS = Object.freeze([
  "period", "target", "actual", "pacingStatus", "forecast",
  "recoveryRequired", "channels", "diagnostics", "source", "asOf"
]);

export const EXECUTION_CONTEXT_FIELDS = Object.freeze([
  "activeSprint", "mustWin", "blockedInitiatives", "transformWIP",
  "executionHealth", "deepWork", "weeklyCompletion", "criticalActions",
  "source", "asOf"
]);

function numberOrNull(value){ return value == null || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null; }
function cleanString(value){ return typeof value === "string" ? value : null; }

export function normalizeCommercialContext(raw={}) {
  return {
    period: cleanString(raw.period),
    target: numberOrNull(raw.target),
    actual: numberOrNull(raw.actual),
    pacingStatus: cleanString(raw.pacingStatus),
    forecast: numberOrNull(raw.forecast),
    recoveryRequired: numberOrNull(raw.recoveryRequired),
    channels: Array.isArray(raw.channels) ? raw.channels : [],
    diagnostics: Array.isArray(raw.diagnostics) ? raw.diagnostics : [],
    source: cleanString(raw.source) || "RevNavigator",
    asOf: cleanString(raw.asOf) || new Date().toISOString()
  };
}

export function normalizeExecutionContext(raw={}) {
  return {
    activeSprint: raw.activeSprint ?? null,
    mustWin: Array.isArray(raw.mustWin) ? raw.mustWin : [],
    blockedInitiatives: Array.isArray(raw.blockedInitiatives) ? raw.blockedInitiatives : [],
    transformWIP: raw.transformWIP ?? null,
    executionHealth: raw.executionHealth ?? null,
    deepWork: raw.deepWork ?? null,
    weeklyCompletion: raw.weeklyCompletion ?? null,
    criticalActions: Array.isArray(raw.criticalActions) ? raw.criticalActions : [],
    source: cleanString(raw.source) || "RGT",
    asOf: cleanString(raw.asOf) || new Date().toISOString()
  };
}

export function createMessage(event, data={}) {
  if (!Object.values(REVNAV_EVENTS).includes(event)) throw new Error(`Unsupported integration event: ${event}`);
  return { namespace: REVNAV_MESSAGE_NAMESPACE, version: REVNAV_INTEGRATION_VERSION, event, data };
}

export function isIntegrationMessage(payload) {
  return Boolean(payload && payload.namespace === REVNAV_MESSAGE_NAMESPACE && payload.version === REVNAV_INTEGRATION_VERSION && Object.values(REVNAV_EVENTS).includes(payload.event));
}
