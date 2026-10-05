import {registry, progress} from "../learning/index.js";
import {isDone} from "../learning/model.js";
import {esc} from "../core/html.js";
import {requestRender} from "../core/events.js";
import {COURSES} from "../learning/content/planned.js";

/** RGT Academy (foundation). Lessons come from the shared registry; progress lives in IndexedDB via progressStore. */
const done = id => isDone("lesson", progress.statusOf("lesson", id));
export function academy() {
  const lessons = registry.list("lesson"), n = lessons.filter(x => done(x.id)).length, pct = lessons.length ? Math.round(n / lessons.length * 100) : 0;
  const inCourse = new Set(COURSES.flatMap(c => c.lessons)), extra = lessons.filter(l => !inCourse.has(l.id));
  const course = c => {
    const ls = c.lessons.map(id => registry.get("lesson", id)).filter(Boolean), d = ls.filter(l => done(l.id)).length;
    if (!ls.length) return `<section class="academy-module course soon" data-rgt-target="course-${esc(c.id)}"><div class="section-head"><h2>${esc(c.title)}</h2><span class="status">Próximamente</span></div></section>`;
    return `<section class="academy-module course" data-rgt-target="course-${esc(c.id)}"><div class="section-head"><h2>${esc(c.title)}</h2><span class="status">${d}/${ls.length} lecciones</span></div><div class="academy-grid">${ls.map(card).join("")}</div></section>`;
  };
  return `<div class="head"><div><div class="eyebrow">Aprender</div><h1>RGT Academy</h1><div class="sub">Aprende el método dentro de la herramienta. Las lecciones explican qué hacer, por qué y cómo verificarlo.</div></div></div>
  <section class="panel academy-progress-panel" data-rgt-target="academy-progress"><b>Tu aprendizaje</b><div class="rgt-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Progreso de aprendizaje"><i style="width:${pct}%"></i></div><div class="academy-progress"><strong>${n}/${lessons.length}</strong><span>lecciones (${pct}%)</span></div></section>
  <div class="academy-intro panel"><div><b>Cursos</b><p>Los cursos sin lecciones aparecen como «Próximamente». Mientras tanto practica con una <a href="#/execution/aprender/rutas">ruta guiada</a>.</p></div><div class="academy-rule"><b>Regla de oro</b><span>RGT calcula y valida. Tú decides. La IA explica o propone; no sustituye la disciplina del sistema.</span></div></div>
  ${COURSES.map(course).join("")}${extra.length ? `<section class="academy-module"><div class="section-head"><h2>Más lecciones</h2></div><div class="academy-grid">${extra.map(card).join("")}</div></section>` : ""}`;
}
function card(x) {
  const d = done(x.id), st = progress.statusOf("lesson", x.id);
  return `<article class="academy-card ${d ? "done" : ""}"><div class="academy-card-top"><span>${x.minutes} min</span><b>${d ? "✓ Completada" : st === "IN_PROGRESS" ? "En curso" : "Pendiente"}</b></div><h3>${esc(x.title)}</h3><p>${esc(x.objective)}</p><button class="btn ${d ? "" : "primary"}" data-lesson="${esc(x.id)}">${d ? "Revisar" : "Comenzar"}</button></article>`;
}
export function bindAcademy() { document.querySelectorAll("[data-lesson]").forEach(b => b.onclick = () => openLesson(b.dataset.lesson)); }

export function openLesson(id) {
  const x = registry.get("lesson", id); if (!x) return;
  if (progress.statusOf("lesson", id) === "NOT_STARTED") progress.start("lesson", id);
  const isDoneNow = done(id), prev = document.activeElement;
  const routes = (x.routes || []).map(r => registry.get("route", r)).filter(Boolean);
  const o = document.createElement("div"); o.className = "modal-backdrop";
  o.innerHTML = `<div class="modal academy-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-t"><div class="modal-head"><div><div class="eyebrow">${esc(x.module)} · ${x.minutes} min</div><h2 id="lesson-t">${esc(x.title)}</h2></div><button class="icon-btn" data-close aria-label="Cerrar">×</button></div><div class="copilot-body"><div class="academy-objective"><b>Objetivo</b><p>${esc(x.objective)}</p></div><div class="academy-lesson"><p>${esc(x.body)}</p></div><h3>Comprueba que lo entendiste</h3><div>${x.check.map((c, i) => `<label class="check-row"><input type="checkbox" data-check="${i}" ${isDoneNow ? "checked" : ""}> ${esc(c)}</label>`).join("")}</div>${routes.length ? `<div class="callout"><b>Practícalo:</b> ${routes.map(r => `<button class="link-btn" data-route="${esc(r.id)}">🧭 ${esc(r.title)}</button>`).join(" ")}</div>` : ""}<div class="modal-actions"><button class="btn primary" data-complete>${isDoneNow ? "Volver a marcar como pendiente" : "Marcar como completada"}</button><button class="btn" data-close>Cerrar</button></div></div></div>`;
  document.body.appendChild(o);
  const close = () => { o.remove(); prev?.focus?.(); };
  o.addEventListener("click", e => { if (e.target === o || e.target.closest("[data-close]")) close(); });
  o.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); close(); } });
  o.querySelector("[data-complete]").onclick = () => { isDoneNow ? progress.reset("lesson", id) : progress.complete("lesson", id); close(); requestRender(); };
  o.querySelectorAll("[data-route]").forEach(b => b.onclick = async () => { close(); const {startRoute} = await import("./guide.js"); startRoute(b.dataset.route); });
  o.querySelector("[data-close]").focus();
}
