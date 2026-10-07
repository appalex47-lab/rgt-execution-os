/**
 * Roadmap entries shown as "Próximamente" in Aprender. They are DATA, not routes: nothing here can be started,
 * and it never pretends to be a lesson or a tour. Replace an entry by registering a real route/lesson later.
 */
export const PLANNED_ROUTES = Object.freeze([
  {id: "first-week", title: "Mi primera semana RGT"},
  {id: "first-initiative", title: "Crear mi primera iniciativa"},
  {id: "pillars", title: "Aprender RUN / GROW / TRANSFORM"},
  {id: "create-must-win", title: "Crear un Must-Win"},
  {id: "run-deep-work", title: "Ejecutar Deep Work"},
  {id: "close-initiative", title: "Cerrar una iniciativa"}
]);

/** Academy course outline (names from the product roadmap). `lessons` = ids that already exist in the registry. */
export const COURSES = Object.freeze([
  {id: "fundamentos", title: "Fundamentos RGT", lessons: ["foundations-rgt", "advanced-discipline"]},
  {id: "pilares", title: "RUN / GROW / TRANSFORM", lessons: []},
  {id: "planning", title: "Planning", lessons: []},
  {id: "wip", title: "WIP", lessons: ["foundations-wip", "demo-intro-wip"]},
  {id: "must-win", title: "Must-Win", lessons: ["weekly-mustwin"]},
  {id: "dor-dod", title: "DoR / DoD", lessons: ["foundations-ready-done"]},
  {id: "deep-work", title: "Deep Work", lessons: ["weekly-deepwork"]},
  {id: "weekly-review", title: "Weekly Review", lessons: ["weekly-review"]}
]);
