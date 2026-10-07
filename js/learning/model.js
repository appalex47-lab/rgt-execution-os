/**
 * RGT Learning & Guidance System — shared vocabulary.
 * One model feeds Context help, Academy lessons, Guided Routes, practices and (later) the Assistant.
 */
export const CONTEXT_TYPES = Object.freeze(["SECTION", "MODULE", "COMPONENT", "FIELD", "CONCEPT", "ACTION"]);
export const KINDS = Object.freeze(["context", "lesson", "practice", "route", "assessment"]);

/** Progressive disclosure: each level reveals one more layer of the same context. */
export const LEVELS = Object.freeze([
  {level: 1, key: "what", label: "Qué es", fields: ["shortDescription"]},
  {level: 2, key: "why", label: "Para qué sirve", fields: ["purpose", "whyItMatters", "whatYouCanDo"]},
  {level: 3, key: "how", label: "Cómo usarlo", fields: ["recommendedFirstAction", "howItWorks", "successCheck"]},
  {level: 4, key: "example", label: "Ejemplo", fields: ["examples", "commonMistakes"]},
  {level: 5, key: "more", label: "Aprender más", fields: ["relatedConcepts", "relatedLessons", "relatedGuides"]}
]);
export const MAX_LEVEL = LEVELS.length;

export const STATES = Object.freeze({
  NOT_STARTED: "NOT_STARTED", IN_PROGRESS: "IN_PROGRESS", COMPLETED: "COMPLETED",
  PASSED: "PASSED", FAILED: "FAILED", PAUSED: "PAUSED"
});

/** Which states are legal per learning object type, and which are terminal for progress counting. */
export const STATES_BY_TYPE = Object.freeze({
  lesson: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
  course: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
  route: ["NOT_STARTED", "IN_PROGRESS", "PAUSED", "COMPLETED"],
  assessment: ["NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED"],
  practice: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "FAILED"]
});
export const DONE_STATES = Object.freeze({
  lesson: ["COMPLETED"], course: ["COMPLETED"], route: ["COMPLETED"], assessment: ["PASSED"], practice: ["COMPLETED"]
});

/** Intro / banner display modes (persisted per context id). */
export const LEARNING_MODES = Object.freeze(["guided", "standard", "expert"]);
export const START_PAGES = Object.freeze(["command-center", "last"]);
export const INTRO_MODES = Object.freeze(["expanded", "minimized", "hidden"]);

/** Guided step kinds. */
export const STEP_KINDS = Object.freeze({INFO: "INFO", ACTION: "ACTION"});

export const isType = t => CONTEXT_TYPES.includes(t);
export const statesFor = type => STATES_BY_TYPE[type] || [];
export const isDone = (type, status) => (DONE_STATES[type] || []).includes(status);
