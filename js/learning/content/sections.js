import {registerContext} from "../registry.js";

/** Rich section/module/component/field contexts (written once, reused by intro banners, help, Academy and tours). */
export function registerSectionContent(reg = registerContext) {
  reg({
    id: "section:board", type: "SECTION", view: "board", title: "RGT Board",
    shortDescription: "El tablero donde se mueve el trabajo entre RUN, GROW y TRANSFORM según su estado.",
    purpose: "Hace visible qué se está ejecutando, qué está bloqueado y cuánta capacidad queda, sin saltarse las reglas del método.",
    whatYouCanDo: ["Ver el flujo de iniciativas por pilar y estado", "Mover una iniciativa de estado: RGT valida Ready, DoD y WIP", "Abrir una tarjeta para ver su detalle, DoD y evidencia", "Vigilar el WIP de TRANSFORM (máximo 2)"],
    recommendedFirstAction: "Revisa el contador TRANSFORM WIP antes de iniciar nada nuevo. Para crear iniciativas ve a Planificar › Iniciativas.",
    successCheck: "Ninguna columna supera su capacidad y TRANSFORM muestra 2/2 como máximo.",
    howItWorks: ["Cada columna es un estado; cada tarjeta, una iniciativa.", "Al mover una tarjeta, el Gatekeeper decide si la transición es válida y te explica el motivo si no."],
    examples: [{good: "Terminar o desbloquear una iniciativa TRANSFORM antes de iniciar la tercera.", bad: "Arrastrar una tercera iniciativa a IN_PROGRESS \"porque es urgente\"."}],
    commonMistakes: ["Olvidar que BLOCKED también consume WIP.", "Querer pasar a DONE sin DoD completo."],
    whyItMatters: "Limitar el trabajo activo es lo que convierte una lista de pendientes en un sistema de ejecución.",
    relatedConcepts: ["concept:wip"], relatedLessons: ["demo-intro-wip"], relatedGuides: ["demo-create-initiative"]
  });
  reg({
    id: "section:planning", type: "SECTION", view: "planning", title: "Planning Semanal",
    shortDescription: "Aquí defines qué quieres conseguir esta semana y organizas las iniciativas que vas a ejecutar.",
    purpose: "Convierte la capacidad de la semana en un sprint con exactamente tres batallas prioritarias.",
    whatYouCanDo: ["Crear tu sprint", "Definir prioridades", "Seleccionar Must-Win", "Preparar iniciativas"],
    recommendedFirstAction: "Comienza revisando el contexto de la semana.",
    successCheck: "Hay un Sprint ACTIVE con fechas correctas y, en Must-Win, una batalla por pilar.",
    whyItMatters: "Sin una selección explícita, todo parece importante y nada avanza.",
    relatedConcepts: ["module:must-win"]
  });
  reg({
    id: "module:must-win", type: "MODULE", view: "must-win", title: "Must-Win",
    shortDescription: "Son las batallas que realmente deben avanzar durante esta semana.",
    purpose: "Fijar foco: una batalla por pilar.",
    whatYouCanDo: ["Elegir 1 iniciativa RUN, 1 GROW y 1 TRANSFORM", "Cambiarlas mientras el sprint esté activo"],
    recommendedFirstAction: "Selecciona las iniciativas que representan los resultados más importantes.",
    successCheck: "Ves 3 Must-Win guardados: uno RUN, uno GROW y uno TRANSFORM, todos con iniciativa real.",
    howItWorks: "REGLA: 1 RUN + 1 GROW + 1 TRANSFORM. Solo aparecen iniciativas elegibles; guardar exige las tres.",
    commonMistakes: ["Elegir varias del mismo pilar.", "Elegir iniciativas aún no preparadas."],
    whyItMatters: "Tres batallas claras son revisables el viernes; veinte prioridades no.",
    relatedConcepts: ["concept:wip"]
  });
  reg({
    id: "component:wip-chip", type: "COMPONENT", title: "Contador TRANSFORM WIP",
    shortDescription: "Muestra cuántas iniciativas TRANSFORM ocupan capacidad (IN_PROGRESS + BLOCKED) sobre el máximo de 2.",
    howItWorks: "Cuando llega a 2/2 el chip se resalta y RGT bloquea nuevas entradas a ejecución.",
    relatedConcepts: ["concept:wip"]
  });
  reg({
    id: "field:initiative-success-criteria", type: "FIELD", title: "Criterio de éxito",
    shortDescription: "Define el resultado concreto que debe producir esta iniciativa.",
    examples: [{good: "Reducir errores críticos del checkout a 0", bad: "Trabajar en checkout"}],
    whyItMatters: "Permite evaluar después si la iniciativa realmente está terminada."
  });
  reg({
    id: "action:create-initiative", type: "ACTION", title: "Crear iniciativa",
    shortDescription: "Crea una iniciativa nueva en BACKLOG con su Definition of Ready y su primer requisito de DoD.",
    howItWorks: ["Elige el pilar según la naturaleza del trabajo.", "Completa nombre, responsable, objetivo, criterio de éxito y primer DoD.", "Nace en BACKLOG; pasa a READY cuando cumple el DoR."],
    relatedConcepts: ["concept:wip"], relatedGuides: ["demo-create-initiative"]
  });
}
