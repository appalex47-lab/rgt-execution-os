import {registerContext, registerLesson, registerPractice, registerRoute} from "../registry.js";

/** TECHNICAL TEST CONTENT for Fase 1. Replace/remove freely: nothing in the engines depends on these ids. */
export function registerDemoContent(r = {context: registerContext, lesson: registerLesson, practice: registerPractice, route: registerRoute}) {
  r.context({
    id: "concept:wip", type: "CONCEPT", title: "WIP",
    shortDescription: "WIP (Work In Progress) es el trabajo que ya empezó y todavía no termina.",
    purpose: "Limitar el WIP protege la capacidad: menos cosas abiertas, más cosas terminadas.",
    whatYouCanDo: ["Ver el contador TRANSFORM WIP en el Board", "Entender por qué RGT rechaza una tercera iniciativa TRANSFORM"],
    whyItMatters: "Terminar antes de empezar es la forma más barata de acelerar la ejecución.",
    recommendedFirstAction: "Antes de iniciar algo nuevo, termina o desbloquea algo que ya está abierto.",
    howItWorks: ["En RGT, TRANSFORM admite máximo 2 iniciativas activas.", "IN_PROGRESS y BLOCKED consumen capacidad.", "El límite lo aplica el motor de WIP, no la interfaz."],
    examples: [{good: "Con 2/2, desbloquear T002 y recién entonces iniciar T003.", bad: "Mover T003 a IN_PROGRESS ignorando el límite."}],
    commonMistakes: ["Creer que BLOCKED libera capacidad."],
    relatedLessons: ["demo-intro-wip"], relatedGuides: ["demo-create-initiative"], relatedConcepts: []
  });
  r.lesson({
    id: "demo-intro-wip", module: "Demo técnico", title: "Introducción a WIP", minutes: 3, demo: true,
    objective: "Entender qué es WIP y por qué TRANSFORM tiene un máximo de 2.",
    body: "WIP es el trabajo empezado y no terminado. Limitarlo evita dispersión. Practica en el Board y luego recorre la ruta guiada.",
    check: ["Puedo explicar qué es WIP.", "Sé que BLOCKED también consume capacidad."],
    concepts: ["concept:wip"], practices: ["demo-detect-wip"], routes: ["demo-create-initiative"], feature: "board"
  });
  r.practice({
    id: "demo-detect-wip", title: "Detecta una violación WIP", demo: true,
    description: "Identifica qué transición rechazaría RGT por exceso de WIP.",
    validation: "transition_blocked", concepts: ["concept:wip"], routes: ["demo-create-initiative"], feature: "board"
  });
  r.route({
    id: "demo-create-initiative", title: "Demo — Crear iniciativa", demo: true, feature: "board",
    description: "Ruta técnica de prueba del motor de guía: crea una iniciativa real en el Board.",
    steps: [
      {id: "s1-board", view: "board", title: "Este es el Board", description: "Aquí vive el trabajo de la semana, organizado por estado.", target: "[data-rgt-target='board-header']", action: "NONE"},
      {id: "s2-wip", view: "board", title: "Mira el WIP", description: "TRANSFORM admite como máximo 2 iniciativas activas (IN_PROGRESS + BLOCKED).", target: "[data-rgt-target='wip-chip']", action: "NONE"},
      {id: "s3-open", view: "board", title: "Abre el formulario", description: "Pulsa «Nueva iniciativa».", target: "[data-rgt-target='new-initiative']", action: "CLICK"},
      {id: "s4-pillar", view: "board", title: "Selecciona TRANSFORM", description: "Vas a automatizar la captura de datos de compras: es un cambio estructural. Elige el pilar correcto.", target: "[data-rgt-target='create-pillar']", action: "SELECT",
        validation: {id: "pillar_selected", expected: "TRANSFORM"}, feedback: {ok: "Correcto: TRANSFORM.", wrong: "Todavía no. Esta iniciativa corresponde a TRANSFORM porque modifica estructuralmente el sistema."}},
      {id: "s5-dod", view: "board", title: "Piensa en el DoD", description: "Define un primer requisito de Definition of Done verificable. (Opcional en la guía; el formulario sí lo exige.)", target: "[data-rgt-target='create-dod']", action: "NONE", optional: true},
      {id: "s6-create", view: "board", title: "Crea la iniciativa", description: "Completa los campos y pulsa «Crear en BACKLOG».", target: "[data-rgt-target='create-task']", action: "CLICK", validation: "initiative_created"},
      {id: "s7-end", view: "board", title: "Listo", description: "Tu iniciativa nace en BACKLOG. Para iniciarla deberá cumplir el DoR y tener capacidad WIP.", target: "[data-rgt-target='board-header']", action: "NONE"}
    ]
  });
}
