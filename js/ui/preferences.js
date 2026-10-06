import {progress} from "../learning/index.js";
import {LEARNING_MODES} from "../learning/model.js";
import {refreshGuide} from "./guide.js";
import {requestRender} from "../core/events.js";

const MODE_LABEL = {guided: "Guiado — introducciones abiertas", standard: "Estándar — como cada sección sugiere", expert: "Experto — introducciones minimizadas"};
/** Preferencias: one screen over the existing prefs store (records "ux", "context", "guide", "nav"). */
export function preferences() {
  const ux = progress.uxPrefs(), g = progress.guidePrefs();
  return `<div class=head><div><div class=eyebrow>Configuración</div><h1>Preferencias</h1><div class=sub>Cuánta ayuda ves y cómo abre RGT. Se guardan en este navegador (IndexedDB).</div></div></div>
  <section class=panel data-rgt-target="prefs-panel"><h2>Aprendizaje</h2><fieldset class="pref-group"><legend>Modo de aprendizaje</legend>${LEARNING_MODES.map(m => `<label class="check-row"><input type="radio" name="learningMode" value="${m}" ${ux.learningMode === m ? "checked" : ""}> ${MODE_LABEL[m]}</label>`).join("")}</fieldset>
  <div class="pref-group"><button class="btn" id="pref-reset-intros">Mostrar de nuevo todas las introducciones</button></div>
  <h2 style="margin-top:18px">Guía RGT</h2><label class="check-row"><input type="checkbox" id="pref-guide-visible" ${g.hidden ? "" : "checked"}> Mostrar el botón flotante «🧭 Guía RGT»</label>
  <h2 style="margin-top:18px">Inicio</h2><div class=field><label for="pref-start">Al abrir RGT sin enlace, ir a</label><select id="pref-start"><option value="command-center" ${ux.startPage === "command-center" ? "selected" : ""}>Command Center</option><option value="last" ${ux.startPage === "last" ? "selected" : ""}>La última pantalla que usé</option></select></div>
  <div id="pref-status" class="mini" role="status" aria-live="polite"></div></section>`;
}
export function bindPreferences() {
  const say = t => { const e = document.querySelector("#pref-status"); if (e) e.textContent = t; };
  document.querySelectorAll('input[name="learningMode"]').forEach(r => r.addEventListener("change", () => { progress.setUxPrefs({learningMode: r.value}); say("Modo de aprendizaje guardado."); }));
  document.querySelector("#pref-reset-intros")?.addEventListener("click", () => { progress.resetIntros(); say("Las introducciones volverán a mostrarse."); });
  document.querySelector("#pref-guide-visible")?.addEventListener("change", e => { progress.setGuidePrefs({hidden: !e.target.checked, open: false}); refreshGuide(); say(e.target.checked ? "Botón de guía visible." : "Botón de guía oculto (sigue disponible con «?»)."); });
  document.querySelector("#pref-start")?.addEventListener("change", e => { progress.setUxPrefs({startPage: e.target.value}); say("Página inicial guardada."); });
}
