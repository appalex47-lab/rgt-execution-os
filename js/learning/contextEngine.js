import {esc} from "../core/html.js";
import {LEVELS, MAX_LEVEL, INTRO_MODES} from "./model.js";

/**
 * Context engine: turns a registered context into HTML. Pure functions (no DOM), so every pattern
 * (intro banner, inline help, popover, modal, panel, "¿Dónde estoy?") reads the same single source.
 */
export const TYPE_LABEL = {SECTION: "Sección", MODULE: "Módulo", COMPONENT: "Componente", FIELD: "Campo", CONCEPT: "Concepto", ACTION: "Acción"};
const arr = v => (v == null || v === "" ? [] : Array.isArray(v) ? v : [v]);
const has = v => arr(v).length > 0;

const list = items => `<ul>${arr(items).map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
function examples(items) {
  return arr(items).map(e => typeof e === "string"
    ? `<p class="rgt-ex">${esc(e)}</p>`
    : `<div class="rgt-ex">${e.good ? `<p class="rgt-ex-good"><b>Sí:</b> ${esc(e.good)}</p>` : ""}${e.bad ? `<p class="rgt-ex-bad"><b>Evita:</b> ${esc(e.bad)}</p>` : ""}</div>`).join("");
}

/** Which levels actually have content for this context (so we never show an empty level). */
export function availableLevels(ctx) {
  return LEVELS.filter(l => l.fields.some(f => has(ctx[f]))).map(l => l.level);
}
export function maxLevelFor(ctx) { const a = availableLevels(ctx); return a.length ? Math.max(...a) : 1; }

/** Progressive disclosure: renders levels 1..level. `resolve` turns related ids into labelled links. */
export function renderLevels(ctx, level = 1, resolve = null) {
  const upto = Math.max(1, Math.min(MAX_LEVEL, level));
  const parts = [];
  if (upto >= 1 && has(ctx.shortDescription)) parts.push(`<p class="rgt-lead">${esc(ctx.shortDescription)}</p>`);
  if (upto >= 2) {
    if (has(ctx.purpose)) parts.push(`<p>${esc(ctx.purpose)}</p>`);
    if (has(ctx.whatYouCanDo)) parts.push(`<h4>${ctx.type === "SECTION" ? "En esta sección puedes" : "Qué puedes hacer"}</h4>${list(ctx.whatYouCanDo)}`);
    if (has(ctx.whyItMatters)) parts.push(`<h4>¿Por qué importa?</h4><p>${esc(ctx.whyItMatters)}</p>`);
  }
  if (upto >= 3) {
    if (has(ctx.recommendedFirstAction)) parts.push(`<h4>Qué hacer primero</h4><p>${esc(ctx.recommendedFirstAction)}</p>`);
    if (has(ctx.howItWorks)) parts.push(`<h4>Cómo funciona</h4>${Array.isArray(ctx.howItWorks) ? list(ctx.howItWorks) : `<p>${esc(ctx.howItWorks)}</p>`}`);
    if (has(ctx.successCheck)) parts.push(`<h4>¿Cómo sé si lo hice correctamente?</h4>${Array.isArray(ctx.successCheck) ? list(ctx.successCheck) : `<p>${esc(ctx.successCheck)}</p>`}`);
  }
  if (upto >= 4) {
    if (has(ctx.examples)) parts.push(`<h4>Ejemplo</h4>${examples(ctx.examples)}`);
    if (has(ctx.commonMistakes)) parts.push(`<h4>Errores comunes</h4>${list(ctx.commonMistakes)}`);
  }
  if (upto >= 5 && resolve) {
    const links = [];
    for (const id of arr(ctx.relatedConcepts)) { const r = resolve("context", id); if (r) links.push(`<button class="link-btn" data-rgt-open-context="${esc(id)}">${esc(r.title)}</button>`); }
    for (const id of arr(ctx.relatedLessons)) { const r = resolve("lesson", id); if (r) links.push(`<button class="link-btn" data-rgt-open-lesson="${esc(id)}">📖 ${esc(r.title)}</button>`); }
    for (const id of arr(ctx.relatedGuides)) { const r = resolve("route", id); if (r) links.push(`<button class="link-btn" data-rgt-start-route="${esc(id)}">🧭 ${esc(r.title)}</button>`); }
    if (links.length) parts.push(`<h4>Aprender más</h4><div class="rgt-links">${links.join(" ")}</div>`);
  }
  return parts.join("");
}

/**
 * Section/module introduction ("¿Qué es esto?"). mode: expanded | minimized | hidden.
 * Same markup for SECTION and MODULE so both reuse the same UX and the same persistence.
 */
export function renderIntro(ctx, {mode = "expanded", level = 1, resolve = null} = {}) {
  if (!ctx) return "";
  if (!INTRO_MODES.includes(mode)) mode = "expanded";
  const id = esc(ctx.id), tid = `rgt-intro-t-${id.replace(/[^\w-]/g, "_")}`;
  const kind = TYPE_LABEL[ctx.type] || ctx.type;
  const max = maxLevelFor(ctx);
  const lvl = Math.min(Math.max(1, level), max);
  const attr = `data-rgt-intro="${id}" data-rgt-target="intro-${id}"`;
  if (mode === "hidden") {
    return `<div class="rgt-intro rgt-intro--hidden" ${attr}><button class="rgt-intro-reopen" data-rgt-intro-action="expand" aria-label="Mostrar introducción: ${esc(ctx.title)}">ⓘ ¿Qué es ${esc(ctx.title)}?</button></div>`;
  }
  if (mode === "minimized") {
    return `<div class="rgt-intro rgt-intro--minimized" ${attr}><span class="rgt-intro-min-title"><b>ⓘ ${esc(ctx.title)}</b> — ${esc(ctx.shortDescription || "")}</span><button class="btn" data-rgt-intro-action="expand" aria-expanded="false" aria-label="Expandir introducción: ${esc(ctx.title)}">Expandir</button></div>`;
  }
  const more = lvl < max ? `<button class="btn" data-rgt-intro-action="more" aria-label="Ver más detalle">Ver más ▾</button>` : "";
  const less = lvl > 1 ? `<button class="btn" data-rgt-intro-action="less" aria-label="Ver menos detalle">Ver menos ▴</button>` : "";
  return `<section class="rgt-intro rgt-intro--expanded" ${attr} role="region" aria-labelledby="${tid}">
    <div class="rgt-intro-head"><div><div class="eyebrow">${esc(kind)}</div><h2 id="${tid}">${esc(ctx.title)}</h2></div>
    <div class="rgt-intro-tools"><button class="icon-btn" data-rgt-intro-action="minimize" aria-label="Minimizar introducción" title="Minimizar">–</button><button class="icon-btn" data-rgt-intro-action="hide" aria-label="Ocultar introducción" title="Ocultar">×</button></div></div>
    <div class="rgt-intro-body" data-level="${lvl}">${renderLevels(ctx, lvl, resolve)}</div>
    <div class="rgt-intro-actions"><button class="btn primary" data-rgt-intro-action="hide">Entendido</button>${more}${less}</div></section>`;
}

/**
 * Field/component help. pattern: inline | popover | modal | panel.
 * The trigger carries data-rgt-help + data-pattern; ui/guide.js wires behaviour per pattern.
 */
export function renderHelp(ctx, {pattern = "popover", level = 4, resolve = null} = {}) {
  if (!ctx) return "";
  const id = esc(ctx.id), dom = `rgt-help-${id.replace(/[^\w-]/g, "_")}`;
  const body = renderLevels(ctx, level, resolve);
  const trigger = `<button type="button" class="rgt-help-btn" data-rgt-help="${id}" data-pattern="${esc(pattern)}" aria-label="Ayuda: ${esc(ctx.title)}" aria-expanded="false" aria-controls="${dom}">?</button>`;
  if (pattern === "inline" || pattern === "popover") {
    return `<span class="rgt-help rgt-help--${esc(pattern)}">${trigger}<div class="rgt-help-body" id="${dom}" role="note" hidden><b>${esc(ctx.title)}</b>${body}</div></span>`;
  }
  return `<span class="rgt-help rgt-help--${esc(pattern)}">${trigger}</span>`;
}

/** "¿Dónde estoy?": section + optional active module chain, answered from the same contexts. */
export function renderWhereAmI(section, modules = [], {level = 3, resolve = null, parents = [], nextStep = null} = {}) {
  if (!section) return `<div class="rgt-where"><p>Esta vista todavía no tiene guía registrada.</p></div>`;
  const crumb = [...parents, section, ...modules].map(c => esc(c.title)).join(" › ");
  const q = (label, text) => (text ? `<div class="rgt-q"><h4>${label}</h4><p>${esc(text)}</p></div>` : "");
  const first = section.recommendedFirstAction;
  return `<div class="rgt-where" data-rgt-target="where-am-i"><div class="rgt-crumb" aria-label="Ubicación"><span>¿Dónde estoy?</span> <b>${crumb}</b></div>
    ${q("¿Qué es esto?", section.shortDescription)}${q("¿Para qué sirve?", section.purpose)}
    ${has(section.whatYouCanDo) ? `<div class="rgt-q"><h4>¿Qué puedo hacer aquí?</h4>${list(section.whatYouCanDo)}</div>` : ""}
    ${q("¿Qué debería hacer primero?", first)}${q("¿Cómo sé si lo hice correctamente?", Array.isArray(section.successCheck) ? section.successCheck.join(" · ") : section.successCheck)}
    ${nextStep ? `<div class="rgt-q rgt-next"><h4>Tu siguiente paso recomendado</h4><p><b>${esc(nextStep.title)}</b> — ${esc(nextStep.why)}</p>${nextStep.view ? `<p><button class="btn primary" data-go="${esc(nextStep.view)}">${esc(nextStep.label || "Ir")}</button></p>` : ""}</div>` : ""}
    ${modules.map(m => `<div class="rgt-q rgt-q-mod"><h4>${esc(m.title)}</h4><p>${esc(m.shortDescription || "")}</p></div>`).join("")}
    ${level >= 4 ? renderLevels({...section, shortDescription: null, purpose: null, whatYouCanDo: null, recommendedFirstAction: null, whyItMatters: null, howItWorks: null, successCheck: null}, 5, resolve) : ""}</div>`;
}
