import {registerRoute} from "../registry.js";

/**
 * Real Academy route: this is not a demo. It walks the learner through creating a
 * real initiative in RGT. Every explanatory step has an explicit comprehension gate;
 * every operational step is validated from the real UI/state.
 */
export function registerRealRoutes() {
  registerRoute({
    id: "first-initiative-real",
    title: "Crear mi primera iniciativa",
    description: "Recorrido real y lineal: aprende el ciclo y crea una iniciativa real en RGT.",
    real: true,
    concepts: ["INITIATIVE", "READY", "DOD"],
    feature: "initiatives",
    steps: [
      {id:"r1-intro", view:"initiatives", title:"Primero: define el resultado", description:"Una iniciativa RGT no es una tarea suelta: expresa un resultado que debe poder verificarse. Lee esta explicación y confirma que la entendiste.", target:"[data-rgt-target='initiatives-header']", action:"ACKNOWLEDGE", validation:{id:"acknowledge"}, feedback:{ok:"Entendido: una iniciativa debe expresar un resultado verificable."}},
      {id:"r2-open", view:"initiatives", title:"Abre una iniciativa real", description:"Ahora sí vamos a trabajar con el formulario real de RGT. Pulsa «Nueva iniciativa».", target:"[data-rgt-target='new-initiative']", action:"CLICK", feedback:{ok:"Formulario abierto."}},
      {id:"r3-title", view:"initiatives", title:"Define el nombre", description:"Escribe un nombre concreto que describa el resultado que quieres conseguir.", target:"#c-title", action:"INPUT", validation:{id:"input_nonempty"}, feedback:{ok:"Nombre registrado.",wrong:"Escribe un nombre antes de continuar."}},
      {id:"r4-pillar", view:"initiatives", title:"Elige el pilar", description:"Clasifica la iniciativa en RUN, GROW o TRANSFORM según el tipo de resultado. No hay una opción universalmente correcta: debes decidirla según el caso.", target:"[data-rgt-target='create-pillar']", action:"SELECT", validation:{id:"value_equals",expected:"TRANSFORM"}, expected:"TRANSFORM", feedback:{ok:"TRANSFORM seleccionado. En este recorrido usaremos un cambio estructural como ejemplo.",wrong:"Para este recorrido selecciona TRANSFORM."}},
      {id:"r5-description", view:"initiatives", title:"Explica el problema", description:"Describe qué problema o situación estás intentando resolver. La explicación debe ser concreta.", target:"#c-description", action:"INPUT", validation:{id:"input_nonempty"}, feedback:{ok:"Problema registrado.",wrong:"Describe el problema antes de continuar."}},
      {id:"r6-objective", view:"initiatives", title:"Define el objetivo", description:"Escribe qué resultado quieres conseguir. Debe poder distinguirse de la actividad que realizarás.", target:"#c-objective", action:"INPUT", validation:{id:"input_nonempty"}, feedback:{ok:"Objetivo registrado.",wrong:"Define el objetivo antes de continuar."}},
      {id:"r7-success", view:"initiatives", title:"Define cómo sabrás que funcionó", description:"Escribe un criterio de éxito verificable. Evita frases vagas como «mejorar mucho».", target:"#c-success", action:"INPUT", validation:{id:"input_nonempty"}, feedback:{ok:"Criterio de éxito registrado.",wrong:"Escribe un criterio de éxito verificable."}},
      {id:"r8-owner", view:"initiatives", title:"Asigna responsable", description:"Indica quién será responsable de llevar la iniciativa. Es un dato operativo, no una explicación de IA.", target:"#c-owner", action:"INPUT", validation:{id:"input_nonempty"}, feedback:{ok:"Responsable registrado.",wrong:"Indica un responsable antes de continuar."}},
      {id:"r9-dod", view:"initiatives", title:"Define el primer DoD", description:"Escribe una condición concreta que deba cumplirse para considerar terminado el trabajo.", target:"[data-rgt-target='create-dod']", action:"INPUT", validation:{id:"input_nonempty"}, feedback:{ok:"DoD registrado.",wrong:"Define el primer requisito de DoD."}},
      {id:"r10-explain-ready", view:"initiatives", title:"Antes de crear: Ready", description:"Ready protege la entrada a ejecución. Crearás la iniciativa en BACKLOG; después RGT podrá exigir definición suficiente antes de iniciarla.", target:"[data-rgt-target='create-task']", action:"ACKNOWLEDGE", validation:{id:"acknowledge"}, feedback:{ok:"Entendido: crear no significa iniciar; Ready y WIP siguen siendo gates."}},
      {id:"r11-create", view:"initiatives", title:"Crea la iniciativa", description:"Pulsa «Crear en BACKLOG». Esta vez la creación será real y quedará guardada en IndexedDB.", target:"[data-rgt-target='create-task']", action:"CLICK", validation:{id:"initiative_created"}, feedback:{ok:"La iniciativa real fue creada y RGT la detectó en su estado persistido.",wrong:"Todavía no se detecta una iniciativa creada. Completa el formulario y pulsa Crear."}},
      {id:"r12-close", view:"initiatives", title:"Cierre del recorrido", description:"La iniciativa existe en BACKLOG. El siguiente aprendizaje es comprobar Ready, WIP y posteriormente llevarla por las transiciones permitidas.", target:"[data-rgt-target='initiatives-header']", action:"ACKNOWLEDGE", validation:{id:"acknowledge"}, feedback:{ok:"Recorrido completado: ya hiciste una operación real dentro de RGT."}}
    ]
  });
}
