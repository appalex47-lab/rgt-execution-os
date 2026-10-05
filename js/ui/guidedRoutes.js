import {registry, progress} from "../learning/index.js";
import {PLANNED_ROUTES} from "../learning/content/planned.js";
import {esc} from "../core/html.js";

const LABEL = {NOT_STARTED: "Sin empezar", IN_PROGRESS: "En curso", PAUSED: "En pausa", COMPLETED: "Completada"};
/** Ruta Guiada: lists routes from the Fase 1 registry; starting/pausing is done by the Guided Tour Engine. */
export function guidedRoutes() {
  const real = registry.list("route");
  return `<div class=head><div><div class=eyebrow>Aprender</div><h1>Ruta Guiada</h1><div class=sub>Aprende haciendo: cada paso se valida con las reglas reales de RGT.</div></div></div>
  <section class=panel data-rgt-target="route-list"><h2>Disponibles</h2>${real.map(r => { const st = progress.get("route", r.id), cta = ["IN_PROGRESS", "PAUSED"].includes(st.status) ? "Continuar" : st.status === "COMPLETED" ? "Repetir" : "Comenzar";
    return `<article class="rgt-route"><div><b>${esc(r.title)}</b>${r.demo ? ' <span class="badge">demo técnico</span>' : ""}<small>${esc(LABEL[st.status])} · ${st.completedSteps.length}/${r.steps.length} pasos</small><p>${esc(r.description || "")}</p></div><button class="btn primary" data-start-route="${esc(r.id)}" data-restart="${st.status === "COMPLETED" ? 1 : 0}">${cta}</button></article>`; }).join("") || "<p class=sub>No hay rutas disponibles.</p>"}</section>
  <section class=panel style="margin-top:14px"><h2>Próximamente</h2><div class="grid2">${PLANNED_ROUTES.map(r => `<div class="rgt-route planned"><div><b>${esc(r.title)}</b><small>Próximamente</small></div><button class="btn" disabled aria-disabled="true">Comenzar</button></div>`).join("")}</div></section>`;
}
