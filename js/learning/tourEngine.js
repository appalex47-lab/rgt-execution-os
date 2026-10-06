import {STEP_KINDS, STATES} from "./model.js";
import {VALIDATORS} from "./validators.js";

/**
 * Guided Tour Engine — reusable, route-agnostic state machine.
 * Route = {id,title,steps:[{id,title,description,target,action,validation,expected,feedback,next,previous,optional,view}]}
 * Phases: IDLE → ACTIVE ⇄ PAUSED → COMPLETED | (closed → IDLE with progress kept as PAUSED)
 * Step kinds: INFO (read & continue) · ACTION (user must act; auto-validated).
 */
export const PHASE = Object.freeze({IDLE: "IDLE", ACTIVE: "ACTIVE", PAUSED: "PAUSED", COMPLETED: "COMPLETED"});
const normValidation = v => (typeof v === "string" ? {id: v} : v || null);

export function stepKind(step) {
  return step.action && step.action !== "NONE" ? STEP_KINDS.ACTION : (step.validation ? STEP_KINDS.ACTION : STEP_KINDS.INFO);
}
export const targetKey = sel => (String(sel || "").match(/data-rgt-target=['"]?([^'"\]]+)/) || [])[1] || null;

export function createTourEngine({registry, progress = null, resolveTarget = () => null, getSnapshot = () => ({}), validators = VALIDATORS, onChange = () => {}} = {}) {
  let route = null, index = 0, phase = PHASE.IDLE;
  let completed = [], validated = false, feedback = null;

  const step = () => (route ? route.steps[index] || null : null);
  const idxOf = id => route.steps.findIndex(s => s.id === id);
  const emit = () => { try { onChange(snapshot()); } catch (e) { console.error("tour onChange", e); } };
  const persist = status => {
    if (!progress || !route) return;
    progress.saveRoute(route.id, {status, currentStep: step()?.id ?? null, completedSteps: completed});
  };

  function targetStatus() {
    const s = step(); if (!s || !s.target) return {found: true, none: true};
    let el = null;
    try { el = resolveTarget(s.target); } catch { el = null; }
    return {found: !!el, none: false, element: el};
  }

  function snapshot() {
    const s = step();
    const t = s ? targetStatus() : {found: true, none: true};
    const required = s ? stepKind(s) === STEP_KINDS.ACTION && !s.optional : false;
    return {
      phase, routeId: route?.id || null, title: route?.title || null, index, total: route?.steps.length || 0,
      step: s, kind: s ? stepKind(s) : null, required, validated, feedback,
      targetFound: t.found, targetMissing: !t.found && !t.none,
      completed: [...completed], percent: route ? Math.round(completed.length / route.steps.length * 100) : 0,
      canPrevious: !!route && prevIndex() >= 0, canNext: !!s && (!required || validated), isLast: !!s && nextIndex() >= route.steps.length
    };
  }
  function prevIndex() { const s = step(); if (s?.previous) return idxOf(s.previous); return index - 1; }
  function nextIndex() { const s = step(); if (s?.next) { const i = idxOf(s.next); return i < 0 ? route.steps.length : i; } return index + 1; }
  const resetStepState = () => { validated = false; feedback = null; };

  function start(routeId, {resume = true} = {}) {
    const r = registry.get("route", routeId);
    if (!r) return {ok: false, reason: "ROUTE_NOT_FOUND"};
    route = r; completed = []; index = 0; resetStepState();
    const saved = progress?.get("route", routeId);
    if (resume && saved && ["IN_PROGRESS", "PAUSED"].includes(saved.status) && saved.currentStep) {
      const i = idxOf(saved.currentStep);
      if (i >= 0) { index = i; completed = (saved.completedSteps || []).filter(id => idxOf(id) >= 0); }
    }
    phase = PHASE.ACTIVE; persist(STATES.IN_PROGRESS); emit();
    return {ok: true, resumed: index > 0};
  }

  function next() {
    if (phase !== PHASE.ACTIVE) return {ok: false, reason: "NOT_ACTIVE"};
    const s = step(), snap = snapshot();
    if (snap.required && !validated) return {ok: false, reason: "VALIDATION_REQUIRED"};
    if (!completed.includes(s.id)) completed.push(s.id);
    const n = nextIndex();
    if (n >= route.steps.length) {
      phase = PHASE.COMPLETED; resetStepState();
      progress?.complete("route", route.id, {currentStep: null, completedSteps: completed});
      if (route.concepts?.length) progress?.recordLearning?.(route.concepts, {score: 100, correct: 1, total: 1, source: "route"});
      emit(); return {ok: true, completed: true};
    }
    index = n; resetStepState(); persist(STATES.IN_PROGRESS); emit();
    return {ok: true};
  }
  function previous() {
    if (phase !== PHASE.ACTIVE) return {ok: false, reason: "NOT_ACTIVE"};
    const p = prevIndex(); if (p < 0) return {ok: false, reason: "FIRST_STEP"};
    index = p; resetStepState(); persist(STATES.IN_PROGRESS); emit(); return {ok: true};
  }
  /** Optional steps may be skipped without validation (not recorded as completed). */
  function skip() {
    const s = step(); if (phase !== PHASE.ACTIVE || !s) return {ok: false, reason: "NOT_ACTIVE"};
    if (!s.optional) return {ok: false, reason: "STEP_REQUIRED"};
    const n = nextIndex();
    if (n >= route.steps.length) { phase = PHASE.COMPLETED; progress?.complete("route", route.id, {currentStep: null, completedSteps: completed}); emit(); return {ok: true, completed: true}; }
    index = n; resetStepState(); persist(STATES.IN_PROGRESS); emit(); return {ok: true};
  }
  function pause() {
    if (phase !== PHASE.ACTIVE) return {ok: false, reason: "NOT_ACTIVE"};
    phase = PHASE.PAUSED; persist(STATES.PAUSED); emit(); return {ok: true};
  }
  function resume() {
    if (phase !== PHASE.PAUSED) return {ok: false, reason: "NOT_PAUSED"};
    phase = PHASE.ACTIVE; persist(STATES.IN_PROGRESS); emit(); return {ok: true};
  }
  /** Close keeps progress (saved as PAUSED) so the user can resume later. */
  function close() {
    if (!route) return {ok: false, reason: "NOT_ACTIVE"};
    if (phase === PHASE.ACTIVE || phase === PHASE.PAUSED) persist(STATES.PAUSED);
    phase = PHASE.IDLE; const had = route; route = null; index = 0; completed = []; resetStepState(); emit();
    return {ok: true, routeId: had.id};
  }
  /** Discards progress for a route and starts clean. */
  function restart(routeId) { progress?.reset("route", routeId); return start(routeId, {resume: false}); }

  /**
   * Report a user/system event. Built-in: CLICK steps validate when {type:'click', target:<key>} matches the
   * step target. Everything else goes through the step's named validator (engine-backed).
   */
  function report(event) {
    const s = step();
    if (phase !== PHASE.ACTIVE || !s || stepKind(s) !== STEP_KINDS.ACTION) return {ok: false, ignored: true};
    const v = normValidation(s.validation);
    let result;
    if (!v) {
      if (s.action === "CLICK") result = event?.type === "click" && event.target === targetKey(s.target) ? {ok: true, message: s.feedback?.ok || "Correcto."} : {ok: false, ignored: true};
      else result = {ok: false, ignored: true};
    } else {
      if (event?.type) {
        const want = {SELECT: "select", INPUT: "input"}[s.action]; // CLICK+validator waits for the validator's own event
        if (event.type !== v.id && event.type !== want) return {ok: false, ignored: true};
        const tk = targetKey(s.target);
        if (want && event.type === want && tk && event.target && event.target !== tk) return {ok: false, ignored: true};
      }
      const fn = validators[v.id];
      if (!fn) { feedback = {ok: false, message: `Validador desconocido: ${v.id}`}; emit(); return {ok: false, reason: "UNKNOWN_VALIDATOR"}; }
      try { result = fn(event, {snapshot: getSnapshot(), step: s, expected: v.expected ?? s.expected}); }
      catch (e) { result = {ok: false, message: `Error validando: ${e.message}`}; }
    }
    if (result.ignored) return result;
    validated = !!result.ok; feedback = {ok: !!result.ok, message: result.message || ""};
    emit();
    return {ok: !!result.ok, message: feedback.message};
  }

  return {start, next, previous, skip, pause, resume, close, restart, report, snapshot, targetStatus, get phase() { return phase; }};
}
