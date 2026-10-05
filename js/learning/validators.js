import {canStartTaskReady} from "../engines/readyEngine.js";
import {validateTransition} from "../engines/transitionEngine.js";

/**
 * Step validators. They never re-implement business rules: anything about Ready / transitions / WIP
 * is delegated to the same engines the Board uses. A validator is (payload, {snapshot, step, expected}) → {ok, message?}.
 */
const ok = message => ({ok: true, message});
const no = message => ({ok: false, message});

export const VALIDATORS = {
  /** Explicit comprehension gate used by real learning routes. */
  acknowledge: (_p, {step}) => ok(step?.feedback?.ok || "Comprensión confirmada. Continúa al siguiente paso."),
  /** Required input gate: the learner must actually enter a value in the target field. */
  input_nonempty: (p, {step}) => String(p?.value || "").trim() ? ok(step?.feedback?.ok || "Dato registrado.") : no(step?.feedback?.wrong || "Completa este campo antes de continuar."),
  /** The user picked the expected value (e.g. pillar). Wrong-answer text comes from step.feedback.wrong. */
  value_equals: (p, {expected, step}) => (p?.value === expected ? ok(step?.feedback?.ok || "Correcto.") : no(step?.feedback?.wrong || "Todavía no.")),
  pillar_selected: (p, c) => VALIDATORS.value_equals(p, c),
  /** The initiative really exists in the persisted snapshot (not just in the DOM). */
  initiative_created: (p, {snapshot}) => {
    const t = (snapshot?.initiatives || []).find(x => x.id === p?.id);
    return t ? ok(`Iniciativa ${t.id} creada.`) : no("Aún no se ha creado la iniciativa.");
  },
  /** Definition of Ready, evaluated by readyEngine. */
  ready_complete: (p, {snapshot}) => {
    const t = (snapshot?.initiatives || []).find(x => x.id === p?.id);
    if (!t) return no("La iniciativa no existe.");
    const r = canStartTaskReady(t, snapshot.checklist || []);
    return r.allowed ? ok(r.reason) : no(r.reason);
  },
  /** A status transition that transitionEngine would accept (includes Ready/DoD/WIP gates). */
  transition_allowed: (p, {snapshot}) => {
    const t = (snapshot?.initiatives || []).find(x => x.id === p?.id);
    const r = validateTransition(t, p?.next, snapshot, {reason: p?.reason});
    return r.allowed ? ok(r.reason) : no(r.reason);
  },
  /** Practice-style check: this transition MUST be refused (e.g. spotting a WIP violation). */
  transition_blocked: (p, {snapshot}) => {
    const t = (snapshot?.initiatives || []).find(x => x.id === p?.id);
    const r = validateTransition(t, p?.next, snapshot, {reason: p?.reason});
    return r.allowed ? no("Esa transición sí está permitida; busca una que RGT bloquee.") : ok(r.reason);
  }
};
export const registerValidator = (name, fn) => { if (typeof fn !== "function") throw new Error("validator inválido"); VALIDATORS[name] = fn; };
