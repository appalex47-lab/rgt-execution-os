/**
 * Integration contract between RevNavigator (commercial source of truth)
 * and RGT Execution OS (execution source of truth).
 * No commercial calculations live here: values are validated and passed through UNCHANGED.
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

/** Keys that MUST be present (value may be null where the type allows it). */
export const COMMERCIAL_CONTEXT_FIELDS = Object.freeze([
  "period", "target", "actual", "pacingStatus", "forecast",
  "recoveryRequired", "channels", "diagnostics", "source"
]);
export const COMMERCIAL_OPTIONAL_FIELDS = Object.freeze(["asOf"]);
export const EXECUTION_CONTEXT_FIELDS = Object.freeze([
  "activeSprint", "mustWin", "blockedInitiatives", "transformWIP",
  "executionHealth", "deepWork", "weeklyCompletion", "criticalActions",
  "source", "asOf"
]);

const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
const isStrOrNull = v => v === null || typeof v === "string";
const isNumOrNull = v => v === null || (typeof v === "number" && Number.isFinite(v));
const MAX_ITEMS = 500;

/**
 * Strict validation of RevNavigator → RGT commercial context.
 * - never coerces ("100" is a type error, not 100)
 * - never derives missing values (a missing key is an error; an explicit null is preserved as null)
 * - unknown fields are dropped and reported as warnings (forward compatible)
 * Returns {valid, errors, warnings, context}; context is null when invalid.
 */
export function parseCommercialContext(raw) {
  const errors = [], warnings = [];
  if (!isObj(raw)) return {valid: false, errors: ["El contexto comercial debe ser un objeto."], warnings, context: null};
  for (const k of COMMERCIAL_CONTEXT_FIELDS) if (!(k in raw)) errors.push(`Falta el campo obligatorio: ${k}.`);
  for (const k of Object.keys(raw)) if (!COMMERCIAL_CONTEXT_FIELDS.includes(k) && !COMMERCIAL_OPTIONAL_FIELDS.includes(k)) warnings.push(`Campo desconocido ignorado: ${k}.`);
  if ("period" in raw && !isStrOrNull(raw.period)) errors.push("period debe ser texto o null.");
  for (const k of ["target", "actual", "forecast"]) if (k in raw && !isNumOrNull(raw[k])) errors.push(`${k} debe ser un número finito o null.`);
  if ("pacingStatus" in raw && !isStrOrNull(raw.pacingStatus)) errors.push("pacingStatus debe ser texto o null.");
  if ("recoveryRequired" in raw && !(raw.recoveryRequired === null || typeof raw.recoveryRequired === "boolean" || isNumOrNull(raw.recoveryRequired))) errors.push("recoveryRequired debe ser booleano, número finito o null.");
  for (const k of ["channels", "diagnostics"]) {
    if (k in raw) {
      if (!Array.isArray(raw[k])) errors.push(`${k} debe ser un arreglo.`);
      else if (raw[k].length > MAX_ITEMS) errors.push(`${k} excede ${MAX_ITEMS} elementos.`);
    }
  }
  if ("source" in raw && (typeof raw.source !== "string" || !raw.source.trim())) errors.push("source debe ser texto no vacío.");
  if ("asOf" in raw && !isStrOrNull(raw.asOf)) errors.push("asOf debe ser texto o null.");
  if (errors.length) return {valid: false, errors, warnings, context: null};
  const context = {
    period: raw.period, target: raw.target, actual: raw.actual, pacingStatus: raw.pacingStatus,
    forecast: raw.forecast, recoveryRequired: raw.recoveryRequired,
    channels: raw.channels.slice(), diagnostics: raw.diagnostics.slice(),
    source: raw.source, asOf: raw.asOf ?? null
  };
  return {valid: true, errors, warnings, context};
}

/** Validates the outbound RGT → RevNavigator execution context. */
export function validateExecutionContext(ctx) {
  const errors = [];
  if (!isObj(ctx)) return {valid: false, errors: ["El contexto de ejecución debe ser un objeto."]};
  for (const k of EXECUTION_CONTEXT_FIELDS) if (!(k in ctx)) errors.push(`Falta el campo obligatorio: ${k}.`);
  for (const k of ["mustWin", "blockedInitiatives", "criticalActions"]) if (k in ctx && !Array.isArray(ctx[k])) errors.push(`${k} debe ser un arreglo.`);
  for (const k of ["activeSprint", "transformWIP", "executionHealth", "deepWork", "weeklyCompletion"]) if (k in ctx && !(ctx[k] === null || isObj(ctx[k]))) errors.push(`${k} debe ser un objeto o null.`);
  if (ctx.source !== "RGT") errors.push("source debe ser 'RGT'.");
  if ("asOf" in ctx && typeof ctx.asOf !== "string") errors.push("asOf debe ser texto ISO.");
  return {valid: errors.length === 0, errors};
}

export function normalizeExecutionContext(raw = {}) {
  return {
    activeSprint: raw.activeSprint ?? null,
    mustWin: Array.isArray(raw.mustWin) ? raw.mustWin : [],
    blockedInitiatives: Array.isArray(raw.blockedInitiatives) ? raw.blockedInitiatives : [],
    transformWIP: raw.transformWIP ?? null,
    executionHealth: raw.executionHealth ?? null,
    deepWork: raw.deepWork ?? null,
    weeklyCompletion: raw.weeklyCompletion ?? null,
    criticalActions: Array.isArray(raw.criticalActions) ? raw.criticalActions : [],
    source: "RGT",
    asOf: typeof raw.asOf === "string" ? raw.asOf : new Date().toISOString()
  };
}

let seq = 0;
export function newCorrelationId() { return `rgt-${Date.now().toString(36)}-${(++seq).toString(36)}`; }

export function createMessage(event, data = {}, {correlationId} = {}) {
  if (!Object.values(REVNAV_EVENTS).includes(event)) throw new Error(`Unsupported integration event: ${event}`);
  const msg = {namespace: REVNAV_MESSAGE_NAMESPACE, version: REVNAV_INTEGRATION_VERSION, event, data};
  if (correlationId) msg.correlationId = correlationId;
  return msg;
}

export function isIntegrationMessage(payload) {
  return Boolean(
    isObj(payload) &&
    payload.namespace === REVNAV_MESSAGE_NAMESPACE &&
    payload.version === REVNAV_INTEGRATION_VERSION &&
    Object.values(REVNAV_EVENTS).includes(payload.event) &&
    (payload.correlationId === undefined || (typeof payload.correlationId === "string" && payload.correlationId.length <= 64))
  );
}
