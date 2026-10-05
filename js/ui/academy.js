import {registry, progress} from "../learning/index.js";
import {isDone} from "../learning/model.js";
import {esc} from "../core/html.js";
import {requestRender} from "../core/events.js";
import {COURSES} from "../learning/content/planned.js";

/**
 * RGT Academy: lesson -> explanation -> example -> active recall -> feedback -> mastery.
 * Progress is persisted by the shared learning store (IndexedDB in production).
 */
const done = id => isDone("lesson", progress.statusOf("lesson", id));
const pct = (score, total) => total ? Math.round(score / total * 100) : 0;

export function academy() {
  const lessons = registry.list("lesson"), n = lessons.filter(x => done(x.id)).length, overall = lessons.length ? Math.round(n / lessons.length * 100) : 0;
  const memory = progress.learningMemory();
  const recommendation = memory.recommendedNext;
  const recommendedLesson = recommendation ? lessons.find(l => (l.concepts || []).includes(recommendation)) : null;
  const conceptEntries = Object.values(memory.concepts || {});
  const mastery = conceptEntries.length ? Math.round(conceptEntries.reduce((a, c) => a + (c.mastery || 0), 0) / conceptEntries.length) : 0;
  const inCourse = new Set(COURSES.flatMap(c => c.lessons)), extra = lessons.filter(l => !inCourse.has(l.id));
  const course = c => {
    const ls = c.lessons.map(id => registry.get("lesson", id)).filter(Boolean), d = ls.filter(l => done(l.id)).length;
    if (!ls.length) return `<section class="academy-module course soon" data-rgt-target="course-${esc(c.id)}"><div class="section-head"><h2>${esc(c.title)}</h2><span class="status">Próximamente</span></div></section>`;
    return `<section class="academy-module course" data-rgt-target="course-${esc(c.id)}"><div class="section-head"><h2>${esc(c.title)}</h2><span class="status">${d}/${ls.length} lecciones</span></div><div class="academy-grid">${ls.map(card).join("")}</div></section>`;
  };
  return `<div class="head"><div><div class="eyebrow">Aprender</div><h1>RGT Academy</h1><div class="sub">Aprende el método dentro de la herramienta. Cada lección combina explicación, práctica y comprobación.</div></div></div>
  <section class="panel academy-progress-panel" data-rgt-target="academy-progress"><b>Tu aprendizaje</b><div class="rgt-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${overall}" aria-label="Progreso de aprendizaje"><i style="width:${overall}%"></i></div><div class="academy-progress"><strong>${n}/${lessons.length}</strong><span>lecciones dominadas (${overall}%)</span></div></section>
  <section class="panel academy-adaptive-panel" data-rgt-target="academy-adaptive"><div><b>Aprendizaje adaptativo</b><p class="sub">RGT registra qué conceptos dominas y cuáles necesitan refuerzo. Tu progreso se conserva en IndexedDB.</p></div><div class="academy-adaptive-stats"><strong>${mastery}%</strong><span>dominio conceptual</span></div>${recommendedLesson ? `<div class="academy-recommendation"><b>Próximo refuerzo: ${esc(recommendedLesson.title)}</b><p>Tu concepto <strong>${esc(recommendation)}</strong> todavía necesita práctica.</p><button class="btn primary" data-adaptive-lesson="${esc(recommendedLesson.id)}">Practicar ahora</button></div>` : `<div class="academy-recommendation"><b>Empieza a construir tu memoria de aprendizaje</b><p>Completa una lección para que RGT pueda recomendarte el siguiente refuerzo.</p></div>`}</section>
  <div class="academy-intro panel"><div><b>Cómo aprender aquí</b><p>Lee el concepto, revisa el ejemplo, responde las preguntas y recibe feedback. Una lección se completa cuando alcanzas el dominio mínimo.</p></div><div class="academy-rule"><b>Regla de oro</b><span>RGT calcula y valida. Tú decides. La IA explica o propone; no sustituye la disciplina del sistema.</span></div></div>
  ${COURSES.map(course).join("")}${extra.length ? `<section class="academy-module"><div class="section-head"><h2>Más lecciones</h2></div><div class="academy-grid">${extra.map(card).join("")}</div></section>` : ""}
  ${academyRoutes()}`;
}

function academyRoutes() {
  const routes = registry.list("route", r => r.real === true && !r.demo);
  if (!routes.length) return "";
  return `<section class="academy-module academy-routes" data-rgt-target="academy-real-routes"><div class="section-head"><div><h2>Aprende haciéndolo</h2><span class="status">Recorridos reales</span></div></div><p class="sub">Aquí no hay demos: cada recorrido te lleva por la interfaz real y no permite avanzar hasta completar el paso actual.</p><div class="academy-grid">${routes.map(r => { const st = progress.get("route", r.id); const doneRoute = st.status === "COMPLETED"; const cta = st.status === "IN_PROGRESS" || st.status === "PAUSED" ? "Continuar" : doneRoute ? "Repetir" : "Comenzar"; return `<article class="academy-card ${doneRoute ? "done" : ""}"><div class="academy-card-top"><span>Recorrido</span><b>${doneRoute ? "✓ Completado" : st.status === "IN_PROGRESS" || st.status === "PAUSED" ? "En curso" : "Pendiente"}</b></div><h3>${esc(r.title)}</h3><p>${esc(r.description || "")}</p><small>${st.completedSteps.length}/${r.steps.length} pasos · lineal</small><button class="btn ${doneRoute ? "" : "primary"}" data-academy-route="${esc(r.id)}" data-restart="${doneRoute ? "1" : "0"}">${cta}</button></article>`; }).join("")}</div></section>`;
}

function card(x) {
  const d = done(x.id), st = progress.statusOf("lesson", x.id), rec = progress.get("lesson", x.id);
  const score = Number.isFinite(rec.score) ? ` · ${rec.score}% último intento` : "";
  return `<article class="academy-card ${d ? "done" : ""}"><div class="academy-card-top"><span>${x.minutes} min</span><b>${d ? "✓ Dominada" : st === "IN_PROGRESS" ? "En curso" : "Pendiente"}</b></div><h3>${esc(x.title)}</h3><p>${esc(x.objective)}</p><small class="academy-score">${x.questions?.length || 0} preguntas${score}</small><button class="btn ${d ? "" : "primary"}" data-lesson="${esc(x.id)}">${d ? "Revisar" : st === "IN_PROGRESS" ? "Continuar" : "Comenzar"}</button></article>`;
}

export function bindAcademy() {
  document.querySelectorAll("[data-lesson]").forEach(b => b.onclick = () => openLesson(b.dataset.lesson));
  document.querySelector("[data-adaptive-lesson]")?.addEventListener("click", e => openLesson(e.currentTarget.dataset.adaptiveLesson));
  document.querySelectorAll("[data-academy-route]").forEach(b => b.onclick = async () => {
    const {startRoute} = await import("./guide.js");
    startRoute(b.dataset.academyRoute, {restart: b.dataset.restart === "1"});
  });
}

function renderQuestion(q, i, selected = null) {
  return `<fieldset class="academy-question" data-question="${i}"><legend>${i + 1}. ${esc(q.question)}</legend>${q.options.map((o, j) => `<label class="academy-option"><input type="radio" name="academy-q-${i}" value="${j}" ${String(selected) === String(j) ? "checked" : ""}> <span>${esc(o)}</span></label>`).join("")}<div class="academy-feedback" data-feedback="${i}" aria-live="polite"></div></fieldset>`;
}

export function openLesson(id) {
  const x = registry.get("lesson", id); if (!x) return;
  const prev = document.activeElement;
  if (progress.statusOf("lesson", id) === "NOT_STARTED") progress.start("lesson", id);
  const rec = progress.get("lesson", id);
  const routes = (x.routes || []).map(r => registry.get("route", r)).filter(Boolean);
  const questions = Array.isArray(x.questions) ? x.questions : [];
  const o = document.createElement("div"); o.className = "modal-backdrop";
  o.innerHTML = `<div class="modal academy-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-t"><div class="modal-head"><div><div class="eyebrow">${esc(x.module)} · ${x.minutes} min</div><h2 id="lesson-t">${esc(x.title)}</h2></div><button class="icon-btn" data-close aria-label="Cerrar">×</button></div><div class="copilot-body">
    <div class="academy-objective"><b>Objetivo</b><p>${esc(x.objective)}</p></div>
    <div class="academy-lesson"><p>${esc(x.body)}</p></div>
    ${x.example ? `<div class="academy-example"><b>Ejemplo</b><p>${esc(x.example)}</p></div>` : ""}
    ${questions.length ? `<section class="academy-practice"><div class="academy-section-title"><h3>Practica: comprueba lo que entendiste</h3><span>Necesitas ${x.passScore || 80}% para dominarla</span></div>${questions.map((q,i) => renderQuestion(q,i)).join("")}<div class="modal-actions"><button class="btn primary" data-evaluate>Evaluar respuestas</button></div><div class="academy-result" data-result aria-live="polite"></div></section>` : ""}
    ${routes.length ? `<div class="callout"><b>Practícalo dentro de RGT:</b> ${routes.map(r => `<button class="link-btn" data-route="${esc(r.id)}">🧭 ${esc(r.title)}</button>`).join(" ")}</div>` : ""}
    <div class="modal-actions"><button class="btn" data-close>Cerrar</button></div>
  </div></div>`;
  document.body.appendChild(o);

  const close = () => { o.remove(); prev?.focus?.(); };
  o.addEventListener("click", e => { if (e.target === o || e.target.closest("[data-close]")) close(); });
  o.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); close(); } });
  o.querySelectorAll("[data-route]").forEach(b => b.onclick = async () => { close(); const {startRoute} = await import("./guide.js"); startRoute(b.dataset.route); });

  const evaluate = o.querySelector("[data-evaluate]");
  if (evaluate) evaluate.onclick = () => {
    const answers = questions.map((_, i) => {
      const checked = o.querySelector(`input[name="academy-q-${i}"]:checked`);
      return checked ? Number(checked.value) : null;
    });
    let correct = 0;
    questions.forEach((q, i) => {
      const ok = answers[i] === q.answer;
      if (ok) correct++;
      const fb = o.querySelector(`[data-feedback="${i}"]`);
      if (fb) fb.innerHTML = ok ? `<span class="academy-correct">✓ Correcto. ${esc(q.explanation || "Buen razonamiento.")}</span>` : `<span class="academy-wrong">✗ Aún no. ${esc(q.explanation || "Revisa el concepto e inténtalo de nuevo.")}</span>`;
    });
    const score = pct(correct, questions.length), passed = score >= (x.passScore || 80);
    progress.set("lesson", id, passed ? "COMPLETED" : "IN_PROGRESS", {attempts: rec.attempts + 1, score, completedSteps: passed ? questions.map((_,i) => `q:${i}`) : []});
    if (x.concepts?.length) progress.recordLearning(x.concepts, {score, correct, total: questions.length, source: "lesson"});
    const result = o.querySelector("[data-result]");
    result.innerHTML = passed
      ? `<div class="academy-pass"><b>✓ Lección dominada — ${score}%</b><p>Ya puedes explicar y aplicar este concepto. Puedes revisarlo cuando quieras.</p></div>`
      : `<div class="academy-retry"><b>${score}% — todavía no está dominada</b><p>Necesitas ${x.passScore || 80}%. Revisa las respuestas marcadas y vuelve a intentarlo.</p><button class="btn primary" data-retry>Reintentar</button></div>`;
    const retry = result.querySelector("[data-retry]");
    if (retry) retry.onclick = () => { o.querySelectorAll("input[type=radio]").forEach(r => { r.checked = false; }); o.querySelectorAll("[data-feedback]").forEach(f => f.textContent = ""); result.textContent = ""; };
    requestRender();
  };
  o.querySelector("[data-close]").focus();
}
