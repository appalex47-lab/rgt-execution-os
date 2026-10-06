import {registerRoute} from "../registry.js";

/**
 * RGT Master Route — the single natural journey through the product.
 *
 * This is intentionally a navigation/understanding route, not a second tour engine.
 * It reuses the existing Guided Tour Engine and moves through real application views.
 *
 * Aprender only includes RGT Academy because it is the only current Aprender screen
 * that contains an actual learning/execution process. "Casos Prácticos" is still a
 * placeholder and "Ruta Guiada" is the launcher for this route itself, so neither is
 * inserted into the master journey.
 */
export function registerMasterRoute() {
  const checkpoint = (id, view, title, description) => ({
    id,
    view,
    title,
    description,
    action: "ACKNOWLEDGE",
    validation: {id: "acknowledge"},
    feedback: {ok: "Paso completado. Continuemos con el flujo natural de RGT."}
  });

  const steps = [
    checkpoint("master-command-center", "dashboard", "1. Command Center", "Empieza aquí. Lee el estado de la ejecución y entiende el siguiente paso recomendado por RGT."),

    checkpoint("master-planificar", "group:planificar", "2. Planificar", "Ahora entramos en Planificar. Aquí se decide qué trabajo debe entrar en el ciclo de ejecución."),
    checkpoint("master-planning", "planning", "3. Planning Semanal", "Define el Sprint y sus fechas. Esta es la primera sección operativa de Planificar."),
    checkpoint("master-board", "board", "4. RGT Board", "Visualiza el flujo real de las iniciativas y sus estados."),
    checkpoint("master-initiatives", "initiatives", "5. Iniciativas", "Crea, prepara y administra las iniciativas que alimentan la ejecución."),
    checkpoint("master-must-win", "must-win", "6. Must-Win", "Selecciona las tres batallas de la semana: RUN, GROW y TRANSFORM."),

    checkpoint("master-ejecutar", "group:ejecutar", "7. Ejecutar", "Con la semana preparada, pasamos a ejecutar el trabajo real."),
    checkpoint("master-tasks", "tasks", "8. Mis tareas", "Aquí ves el trabajo accionable que requiere atención."),
    checkpoint("master-deep-work", "deep-work", "9. Deep Work", "Protege bloques de concentración para avanzar el trabajo importante."),
    checkpoint("master-follow-up", "follow-up", "10. Seguimiento", "Detecta bloqueos, atrasos, carry-over y trabajo sin movimiento."),

    checkpoint("master-revisar", "group:revisar", "11. Revisar", "Después de ejecutar, comprobamos qué ocurrió y qué debe corregirse."),
    checkpoint("master-review", "review", "12. Weekly Review", "Cierra y revisa el ciclo semanal con hechos y decisiones explícitas."),
    checkpoint("master-execution-health", "execution-health", "13. Execution Health", "Comprueba la salud operativa de la ejecución."),
    checkpoint("master-performance", "performance", "14. Performance", "Revisa el rendimiento de ejecución disponible en RGT."),
    checkpoint("master-history", "history", "15. Historial", "Consulta la trazabilidad de los cambios realizados."),

    checkpoint("master-aprender", "group:aprender", "16. Aprender", "Aprender entra aquí porque RGT Academy ya ejecuta un proceso real de aprendizaje y práctica dentro de la herramienta. No añadimos casos ficticios ni una etapa educativa vacía."),
    checkpoint("master-academy", "academy", "17. RGT Academy", "Consolida conceptos, práctica, dominio y refuerzo. El aprendizaje adaptativo se conserva en IndexedDB."),

    checkpoint("master-assistant", "assistant", "18. RGT Assistant", "El recorrido termina con el asistente como capa de acompañamiento: consulta, interpreta y propone, mientras RGT conserva la autoridad sobre reglas y ejecución.")
  ];

  registerRoute({
    id: "rgt-master-route",
    title: "Ruta Maestra RGT",
    description: "Un único recorrido natural: Command Center → Planificar → Ejecutar → Revisar → Aprender → RGT Assistant.",
    real: true,
    master: true,
    concepts: ["RUN", "GROW", "TRANSFORM", "WIP", "READY", "DOD", "MUST_WIN"],
    steps
  });
}
