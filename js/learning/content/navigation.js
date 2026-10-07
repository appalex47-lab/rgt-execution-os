import {registerContext} from "../registry.js";

/**
 * Contexts for the six navigation groups and for the modules introduced/moved by Fase 2.
 * Id convention: groups  "section.<grupo>";  new modules "module.<grupo>.<slug>".
 * Views that existed before keep their historical ids (section:board, section:planning …) so saved preferences survive.
 */
export function registerNavigationContent(reg = registerContext) {
  reg({
    id: "section.command-center", type: "SECTION", view: "dashboard", defaultMode: "minimized", title: "Command Center",
    shortDescription: "Tu punto de partida: te dice dónde estás y qué deberías hacer ahora.",
    purpose: "Resume el estado de la ejecución en pocas señales y propone un único siguiente paso con su motivo.",
    whatYouCanDo: ["Leer el estado del Sprint, Must-Win, WIP, bloqueos y DoD pendientes", "Seguir la tarjeta «Siguiente paso»", "Pedir un briefing a la IA (opcional)"],
    recommendedFirstAction: "Lee la tarjeta «Siguiente paso» y pulsa su botón.",
    successCheck: "Puedes decir en una frase cuál es tu siguiente acción y por qué.",
    whyItMatters: "Decidir qué hacer ahora es lo más caro de la ejecución; esta pantalla lo hace explícito.",
    relatedConcepts: ["concept:wip"]
  });
  const group = (id, view, title, shortDescription, purpose, whatYouCanDo, first, success, why, extra = {}) => reg({
    id: `section.${id}`, type: "SECTION", view: `group:${view}`, title, shortDescription, purpose, whatYouCanDo,
    recommendedFirstAction: first, successCheck: success, whyItMatters: why, ...extra
  });
  group("planificar", "planificar", "Planificar", "Decidir qué se va a hacer esta semana.", "Convierte la capacidad disponible en un Sprint, un Board ordenado y tres Must-Win.",
    ["Definir el Sprint (Planning Semanal)", "Ver y mover el flujo (RGT Board)", "Crear y administrar iniciativas", "Elegir tus 3 Must-Win"], "Entra a Planning Semanal y confirma las fechas del Sprint.",
    "Hay un Sprint ACTIVE, iniciativas con DoR completo y 3 Must-Win guardados.", "Una semana sin decisiones previas se llena de urgencias.", {relatedConcepts: ["module:must-win", "concept:wip"], relatedGuides: ["demo-create-initiative"]});
  group("ejecutar", "ejecutar", "Ejecutar", "Hacer el trabajo.", "Reúne lo que tienes que hacer hoy, los bloques de concentración y el seguimiento de lo que se atora.",
    ["Ver tus tareas accionables (Mis tareas)", "Proteger bloques de 120 minutos (Deep Work)", "Detectar atrasos, bloqueos y trabajo sin movimiento (Seguimiento)"], "Abre Mis tareas y empieza por lo bloqueado o Must-Win.",
    "Tus Must-Win avanzan y nada importante queda bloqueado sin decisión.", "Ejecutar sin ver lo atorado esconde los problemas hasta la revisión.", {relatedConcepts: ["concept:wip"]});
  group("revisar", "revisar", "Revisar", "Medir si realmente se está ejecutando bien.", "Cierra la semana, lee la salud operativa y reconstruye lo ocurrido con hechos.",
    ["Cerrar la semana (Weekly Review)", "Leer la salud de ejecución", "Ver el rendimiento de ejecución", "Consultar el historial de cambios"], "Empieza por Execution Health y luego haz la Weekly Review.",
    "Cada Must-Win quedó cerrado o continuado de forma explícita y hay un aprendizaje registrado.", "Sin revisión, la semana siguiente repite los mismos errores.");
  group("aprender", "aprender", "Aprender", "Aprender el método y mejorar la capacidad de ejecución.", "Reúne la Academy, las rutas guiadas dentro de la herramienta y (próximamente) casos prácticos.",
    ["Estudiar lecciones (RGT Academy)", "Practicar con una ruta guiada sobre datos reales", "Explorar casos prácticos (próximamente)"], "Empieza con una ruta guiada o la primera lección de la Academy.",
    "Puedes explicar WIP, Ready, Done y Must-Win sin consultar la lección.", "Un método que no se entiende se abandona.", {relatedConcepts: ["concept:wip"], relatedLessons: ["demo-intro-wip"], relatedGuides: ["demo-create-initiative"]});
  group("configuracion", "configuracion", "Configuración", "Configurar el sistema.", "Centraliza la IA, los datos y tus preferencias de uso y de ayuda.",
    ["Conectar y probar la IA (Cohere)", "Exportar, importar y restaurar datos", "Ajustar introducciones, guía y modo de aprendizaje"], "Exporta un backup antes de cambiar nada importante.",
    "Tienes un backup reciente fuera del navegador y la IA responde a la prueba de conexión.", "La configuración protege tus datos y define cuánta ayuda ves.");

  const module = (id, view, title, shortDescription, purpose, whatYouCanDo, first, success, extra = {}) =>
    reg({id, type: "MODULE", view, title, shortDescription, purpose, whatYouCanDo, recommendedFirstAction: first, successCheck: success, ...extra});
  module("module.planificar.initiatives", "initiatives", "Iniciativas", "El lugar donde se crean y administran todas las iniciativas.", "Centraliza alta, estado de Ready, DoD y acceso al detalle, evidencia e historial.",
    ["Crear una iniciativa (nace en BACKLOG)", "Crear con ayuda de IA (Initiative Copilot)", "Filtrar por pilar, estado o responsable", "Abrir el detalle: DoD, evidencia y transiciones"], "Revisa la columna Ready: te dice qué le falta a cada iniciativa.",
    "Cada iniciativa que vas a ejecutar muestra Ready completo.", {relatedConcepts: ["concept:wip", "action:create-initiative"], relatedGuides: ["demo-create-initiative"]});
  module("module.ejecutar.tasks", "tasks", "Mis tareas", "Qué tienes que hacer ahora.", "Lista las iniciativas accionables (READY, IN_PROGRESS, BLOCKED) con su DoD pendiente.",
    ["Filtrar por pilar, estado, responsable o Must-Win", "Abrir una iniciativa para avanzar su DoD"], "Filtra por Must-Win y empieza por lo bloqueado.",
    "Sabes cuál es tu siguiente tarea y qué DoD le falta.", {relatedConcepts: ["concept:wip"]});
  module("module.ejecutar.follow-up", "follow-up", "Seguimiento", "Qué está pasando con tu ejecución.", "Muestra alertas, trabajo retrasado, bloqueado, próximo, en carry-over y sin movimiento.",
    ["Atender alertas determinísticas", "Ver bloqueos y trabajo sin movimiento", "Revisar carry-over y DoD pendientes"], "Atiende primero las alertas BLOCKER y los Must-Win bloqueados.",
    "Cada elemento bloqueado o sin movimiento tiene una decisión.", {relatedConcepts: ["concept:wip"]});
  module("module.aprender.routes", "guided-routes", "Ruta Guiada", "Aprende haciendo, paso a paso, dentro de la herramienta.", "Lista las rutas del Guided Tour; cada una valida tus acciones con las reglas reales de RGT.",
    ["Empezar, pausar y reanudar una ruta", "Ver rutas próximas"], "Empieza una ruta disponible y sigue la tarjeta de guía.", "Terminas la ruta y el resultado existe en RGT.", {relatedConcepts: ["concept:wip"]});
  module("module.aprender.cases", "cases", "Casos Prácticos", "Ejercicios de decisión sobre situaciones reales de ejecución.", "Preparado para: Caso → Decisión → Respuesta → Explicación → Aplicación en RGT.",
    ["Ver el formato de los casos", "Volver cuando haya casos disponibles"], "Mientras llegan los casos, practica con una ruta guiada.", "—", {});
  module("module.configuracion.preferences", "preferences", "Preferencias", "Cuánta ayuda ves y cómo abre la app.", "Controla el modo de aprendizaje, las introducciones, el botón de guía y la página inicial.",
    ["Elegir modo de aprendizaje", "Restablecer las introducciones", "Mostrar u ocultar el botón «Guía RGT»", "Elegir la página inicial"], "Elige el modo de aprendizaje que mejor te acompañe.",
    "Los cambios se conservan al recargar.", {});
}
