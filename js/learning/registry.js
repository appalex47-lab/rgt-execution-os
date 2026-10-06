import {CONTEXT_TYPES, KINDS} from "./model.js";

const asArray = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

/**
 * Content registry. Contexts, lessons, practices, routes and assessments live in one place and
 * reference each other by id, so a concept is written once and reused everywhere.
 *
 * Relations:  CONCEPT -> lesson(s) -> practice(s) -> route(s) -> RGT feature (view/target).
 */
export function createRegistry() {
  const store = {context: new Map(), lesson: new Map(), practice: new Map(), route: new Map(), assessment: new Map()};

  function register(kind, item) {
    if (!KINDS.includes(kind)) throw new Error(`Tipo de contenido desconocido: ${kind}`);
    if (!item || typeof item.id !== "string" || !item.id) throw new Error(`${kind}: falta id`);
    if (kind === "context" && !CONTEXT_TYPES.includes(item.type)) throw new Error(`context ${item.id}: type inválido (${item.type})`);
    if (kind === "route" && (!Array.isArray(item.steps) || !item.steps.length)) throw new Error(`route ${item.id}: requiere pasos`);
    if (store[kind].has(item.id)) throw new Error(`${kind} duplicado: ${item.id}`);
    const frozen = Object.freeze({...item});
    store[kind].set(item.id, frozen);
    return frozen;
  }
  const get = (kind, id) => store[kind]?.get(id) || null;
  const list = (kind, filter) => [...(store[kind]?.values() || [])].filter(x => !filter || filter(x));
  const unregister = (kind, id) => store[kind]?.delete(id) || false;
  const clear = () => Object.values(store).forEach(m => m.clear());

  /** Section context for a router view name. */
  const contextForView = view => list("context", c => (c.type === "SECTION" || c.type === "MODULE") && (c.view === view || c.id === `section:${view}`))[0] || null;

  /** Concept → lessons → practices → routes → RGT features, fully resolved from ids. */
  function chain(conceptId) {
    const concept = get("context", conceptId);
    if (!concept) return null;
    const lessons = list("lesson", l => asArray(l.concepts).includes(conceptId) || asArray(concept.relatedLessons).includes(l.id));
    const practices = list("practice", p => lessons.some(l => asArray(l.practices).includes(p.id)) || asArray(p.concepts).includes(conceptId));
    const routes = list("route", r => practices.some(p => asArray(p.routes).includes(r.id)) || lessons.some(l => asArray(l.routes).includes(r.id)));
    const features = [...new Set(routes.flatMap(r => asArray(r.feature)).concat(lessons.flatMap(l => asArray(l.feature))))];
    return {concept, lessons, practices, routes, features};
  }

  /** Reports dangling references so broken content is caught by tests rather than by users. */
  function validateIntegrity() {
    const problems = [];
    const need = (kind, id, from) => { if (id && !get(kind, id)) problems.push(`${from} → ${kind} inexistente: ${id}`); };
    for (const c of list("context")) {
      asArray(c.relatedConcepts).forEach(id => need("context", id, `context ${c.id}`));
      asArray(c.relatedLessons).forEach(id => need("lesson", id, `context ${c.id}`));
      asArray(c.relatedGuides).forEach(id => need("route", id, `context ${c.id}`));
    }
    for (const l of list("lesson")) {
      asArray(l.concepts).forEach(id => need("context", id, `lesson ${l.id}`));
      asArray(l.practices).forEach(id => need("practice", id, `lesson ${l.id}`));
      asArray(l.routes).forEach(id => need("route", id, `lesson ${l.id}`));
    }
    for (const p of list("practice")) asArray(p.routes).forEach(id => need("route", id, `practice ${p.id}`));
    for (const r of list("route")) {
      const ids = new Set();
      for (const s of r.steps) {
        if (ids.has(s.id)) problems.push(`route ${r.id}: paso duplicado ${s.id}`);
        ids.add(s.id);
      }
    }
    return problems;
  }

  return {register, get, list, unregister, clear, contextForView, chain, validateIntegrity};
}

export const registry = createRegistry();
export const registerContext = c => registry.register("context", c);
export const registerLesson = l => registry.register("lesson", l);
export const registerPractice = p => registry.register("practice", p);
export const registerRoute = r => registry.register("route", r);
export const registerAssessment = a => registry.register("assessment", a);
