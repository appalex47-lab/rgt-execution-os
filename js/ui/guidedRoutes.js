import {registry, progress} from "../learning/index.js";
import {esc} from "../core/html.js";

const LABEL = {NOT_STARTED: "Sin empezar", IN_PROGRESS: "En curso", PAUSED: "En pausa", COMPLETED: "Completada"};

/**
 * The route launcher deliberately exposes one master journey.
 * Other registered routes remain available to the learning/context system for compatibility,
 * but they are not presented as parallel journeys from the main Guided Routes screen.
 */
export function guidedRoutes() {
  const route = registry.get("route", "rgt-master-route");
  if (!route) return `<div class=head><div><div class=eyebrow>Aprender</div><h1>Ruta Maestra</h1></div></div><section class=panel><p>No hay una ruta maestra registrada.</p></section>`;
  const st = progress.get("route", route.id);
  const done = st.status === "COMPLETED";
  const active = st.status === "IN_PROGRESS" || st.status === "PAUSED";
  const cta = active ? "Continuar" : done ? "Repetir" : "Comenzar";
  return `<div class=head><div><div class=eyebrow>Aprender</div><h1>Ruta Maestra RGT</h1><div class=sub>Un solo recorrido por el uso natural de RGT: Command Center → Planificar → Ejecutar → Revisar → Aprender → RGT Assistant.</div></div></div>
  <section class="panel master-route-card" data-rgt-target="master-route">
    <div class="section-head"><div><h2>Una sola ruta</h2><span class=status>${esc(LABEL[st.status])} · ${st.completedSteps.length}/${route.steps.length} pasos</span></div></div>
    <p>${esc(route.description)}</p>
    <ol class="master-route-sequence">
      <li>Command Center</li><li>Planificar y sus secciones</li><li>Ejecutar y sus secciones</li><li>Revisar y sus secciones</li><li>Aprender — RGT Academy</li><li>RGT Assistant</li>
    </ol>
    <p class=sub>En cada pantalla haces algo: abres un módulo con un clic real o respondes una pregunta sobre TUS datos (tu Sprint, tu WIP, tus bloqueos…). Si te equivocas, RGT te da una pista y puedes reintentar; el avance no se desbloquea hasta acertar. Casos Prácticos no se incluyen porque todavía no ejecutan un proceso real.</p>
    <button class="btn primary" data-start-route="${esc(route.id)}" data-restart="${done ? 1 : 0}">${cta} →</button>
  </section>`;
}
