import {registerRoute} from "../registry.js";

/**
 * RGT Master Route — the single natural journey through the product.
 *
 * Every step is an exercise (a real click or a question answered from the learner's own data). It still reuses the existing Guided Tour Engine; there is no second engine.
 * It reuses the existing Guided Tour Engine and moves through real application views.
 *
 * Aprender only includes RGT Academy because it is the only current Aprender screen
 * that contains an actual learning/execution process. "Casos Prácticos" is still a
 * placeholder and "Ruta Guiada" is the launcher for this route itself, so neither is
 * inserted into the master journey.
 */
export function registerMasterRoute() {
  /**
   * Every step is an exercise, never "read and continue":
   *  - EXERCISE: a question about what is on screen, answered in the guide card and validated against
   *    the learner's real data (see learning/exercises.js).
   *  - CLICK: a real action in the real interface (open a module, open the new-initiative form).
   */
  const exercise = (id, view, title, description, ask, exerciseId, target) => ({
    id, view, title, description, ask, exercise: exerciseId, target, action: "EXERCISE", validation: {id: "exercise_answer"}
  });
  const click = (id, view, title, description, ask, target, ok) => ({
    id, view, title, description, ask, target, action: "CLICK", feedback: {ok}
  });

  const steps = [
    exercise("master-command-center", "dashboard", "1. Command Center", "Empieza aquí. Esta pantalla responde una sola pregunta: ¿qué hago ahora?", "Ejercicio: lee la tarjeta y responde.", "cc-next-step", "[data-rgt-target='next-step']"),

    click("master-planificar", "group:planificar", "2. Planificar", "Planificar decide qué trabajo entra al ciclo. Cada grupo tiene su resumen con sus módulos.", "Ejercicio: abre «Planning Semanal» desde esta pantalla.", "[data-rgt-target='module-planning']", "Bien: entraste al módulo desde su grupo, igual que lo harás a diario."),
    exercise("master-planning", "planning", "3. Planning Semanal", "El Sprint es el contenedor de la semana: todo lo demás cuelga de sus fechas.", "Ejercicio: identifica tu Sprint.", "planning-sprint", "[data-rgt-target='planning-header']"),
    exercise("master-board", "board", "4. RGT Board", "El Board muestra el flujo real y el límite de trabajo en curso (WIP).", "Ejercicio: decide si cabe otra iniciativa TRANSFORM.", "board-wip", "[data-rgt-target='wip-chip']"),
    click("master-initiatives", "initiatives", "5. Iniciativas", "Aquí se crean las iniciativas. Crear no es iniciar: Ready y WIP protegen la entrada a ejecución.", "Ejercicio: pulsa «Nueva iniciativa», localiza «Criterio de éxito» y ciérrala sin guardar. Para crear una completa, usa la ruta «Crear mi primera iniciativa» en la Academy.", "[data-rgt-target='new-initiative']", "Formulario abierto. Cierra el formulario sin guardar y continúa."),
    exercise("master-must-win", "must-win", "6. Must-Win", "Tres batallas por semana: una por pilar (RUN, GROW y TRANSFORM).", "Ejercicio: revisa tus Must-Win y responde.", "must-win-pillars", "[data-rgt-target='must-win-panel']"),

    click("master-ejecutar", "group:ejecutar", "7. Ejecutar", "Con la semana preparada, pasamos a hacer el trabajo: tareas, bloques de concentración y seguimiento.", "Ejercicio: abre «Mis tareas» desde esta pantalla.", "[data-rgt-target='module-tasks']", "Bien: de aquí sales a trabajar lo accionable."),
    exercise("master-tasks", "tasks", "8. Mis tareas", "Mis tareas ordena lo accionable por urgencia: primero lo bloqueado y los Must-Win.", "Ejercicio: encuentra tu primera tarea.", "tasks-first", "[data-rgt-target='task-list']"),
    exercise("master-deep-work", "deep-work", "9. Deep Work", "Los bloques de concentración protegen el trabajo importante de las interrupciones.", "Ejercicio: ¿cuánto dura un bloque?", "deepwork-minutes", "[data-rgt-target='deep-work-header']"),
    exercise("master-follow-up", "follow-up", "10. Seguimiento", "Seguimiento detecta bloqueos, atrasos, carry-over y trabajo sin movimiento.", "Ejercicio: cuenta tus bloqueos.", "followup-blocked", "[data-rgt-target='alerts']"),

    click("master-revisar", "group:revisar", "11. Revisar", "Después de ejecutar, comprobamos qué ocurrió con hechos y qué debe corregirse.", "Ejercicio: abre «Weekly Review» desde esta pantalla.", "[data-rgt-target='module-review']", "Bien: la revisión semanal es el cierre del ciclo."),
    exercise("master-review", "review", "12. Weekly Review", "La revisión semanal cierra el ciclo con hechos y decisiones explícitas.", "Ejercicio: lee los hechos de la semana.", "weekly-done", "[data-rgt-target='review-header']"),
    exercise("master-execution-health", "execution-health", "13. Execution Health", "La salud operativa resume bloqueos, DoD, WIP y Must-Win con reglas deterministas.", "Ejercicio: lee el estado actual.", "health-status", "[data-rgt-target='health-header']"),
    exercise("master-performance", "performance", "14. Performance", "Performance mide cómo se ejecuta, no cuánto se vende.", "Ejercicio: ¿qué mide esta pantalla?", "performance-scope", "[data-rgt-target='performance-header']"),
    exercise("master-history", "history", "15. Historial", "El historial deja trazabilidad de los cambios.", "Ejercicio: ¿para qué sirve?", "history-purpose", "[data-rgt-target='history-header']"),

    click("master-aprender", "group:aprender", "16. Aprender", "Aprender reúne la Academy y la práctica dentro de la herramienta.", "Ejercicio: abre «RGT Academy» desde esta pantalla.", "[data-rgt-target='module-academy']", "Bien: desde aquí practicas con lecciones y rutas."),
    exercise("master-academy", "academy", "17. RGT Academy", "Lee, practica con preguntas y recibe refuerzo. Tu progreso se conserva.", "Ejercicio: responde sobre cómo se aprende aquí.", "academy-retry", "[data-rgt-target='academy-progress']"),

    exercise("master-assistant", "assistant", "18. RGT Assistant", "El asistente consulta, interpreta y propone; RGT conserva la autoridad sobre las reglas.", "Ejercicio: ¿quién decide?", "assistant-authority", "[data-rgt-target='assistant-header']")
  ];

  registerRoute({
    id: "rgt-master-route",
    title: "Ruta Maestra RGT",
    description: "Un único recorrido con ejercicios: en cada pantalla haces algo real o respondes con tus propios datos. Command Center → Planificar → Ejecutar → Revisar → Aprender → RGT Assistant.",
    real: true,
    master: true,
    concepts: ["RUN", "GROW", "TRANSFORM", "WIP", "READY", "DOD", "MUST_WIN"],
    steps
  });
}
