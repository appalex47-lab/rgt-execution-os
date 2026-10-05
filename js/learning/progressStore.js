import {STATES, statesFor, isDone, INTRO_MODES, LEARNING_MODES, START_PAGES} from "./model.js";

/**
 * Persistence for learning progress and context/guide preferences.
 * Reuses the app's IndexedDB (`learning` and `prefs` stores) through an adapter, so tests can inject memory.
 *
 * learning store: {id:"<type>:<refId>", type, refId, status, startedAt, completedAt, updatedAt, attempts, score,
 *                  currentStep, completedSteps[]}            (type: lesson|course|route|assessment|practice)
 * prefs store:    {id:"context", intro:{[ctxId]:mode}, level:{[ctxId]:1..5}}  and  {id:"guide", open, minimized, hidden}
 *
 * Reads are synchronous (in-memory cache hydrated by load()); writes update the cache first and then persist.
 */
const nowIso = () => new Date().toISOString();
const recId = (type, refId) => `${type}:${refId}`;
const clone = x => (x == null ? x : JSON.parse(JSON.stringify(x)));

export function createMemoryAdapter(seed = {}) {
  const data = {learning: new Map(), prefs: new Map()};
  for (const s of Object.keys(data)) for (const r of seed[s] || []) data[s].set(r.id, clone(r));
  return {
    async all(s) { return [...data[s].values()].map(clone); },
    async put(s, r) { data[s].set(r.id, clone(r)); return r; }
  };
}

export function createProgressStore(adapter) {
  const cache = {learning: new Map(), prefs: new Map()};
  let queue = Promise.resolve();
  const persist = (s, rec) => { queue = queue.then(() => adapter.put(s, clone(rec))).catch(e => { console.error("learning persist", e); }); return queue; };

  async function load() {
    cache.learning.clear(); cache.prefs.clear();
    for (const r of await adapter.all("learning")) cache.learning.set(r.id, r);
    for (const r of await adapter.all("prefs")) cache.prefs.set(r.id, r);
    return api;
  }
  const flush = () => queue;

  /* ---------- progress ---------- */
  const blank = (type, refId) => ({id: recId(type, refId), type, refId, status: STATES.NOT_STARTED, startedAt: null, completedAt: null, updatedAt: null, attempts: 0, score: null, currentStep: null, completedSteps: []});
  const get = (type, refId) => clone(cache.learning.get(recId(type, refId))) || blank(type, refId);
  const statusOf = (type, refId) => get(type, refId).status;

  function set(type, refId, status, extra = {}) {
    if (!statesFor(type).length) throw new Error(`Tipo de progreso inválido: ${type}`);
    if (!statesFor(type).includes(status)) throw new Error(`Estado ${status} no válido para ${type}`);
    const prev = get(type, refId), t = nowIso();
    const next = {...prev, ...extra, id: prev.id, type, refId, status, updatedAt: t};
    if (status !== STATES.NOT_STARTED && !next.startedAt) next.startedAt = t;
    next.completedAt = isDone(type, status) ? (prev.completedAt || t) : null;
    if (status === STATES.NOT_STARTED) Object.assign(next, {startedAt: null, completedAt: null, attempts: 0, score: null, currentStep: null, completedSteps: []});
    cache.learning.set(next.id, next);
    persist("learning", next);
    return clone(next);
  }
  const start = (type, refId) => (statusOf(type, refId) === STATES.NOT_STARTED ? set(type, refId, STATES.IN_PROGRESS) : get(type, refId));
  const complete = (type, refId, extra) => set(type, refId, type === "assessment" ? STATES.PASSED : STATES.COMPLETED, extra);
  const reset = (type, refId) => set(type, refId, STATES.NOT_STARTED);
  const recordAttempt = (type, refId, {passed, score}) => {
    const prev = get(type, refId);
    const status = passed ? (type === "assessment" ? STATES.PASSED : STATES.COMPLETED) : STATES.FAILED;
    return set(type, refId, status, {attempts: prev.attempts + 1, score: score ?? null});
  };
  /** Route cursor: currentStep (id) + completedSteps. Status follows the engine (IN_PROGRESS/PAUSED/COMPLETED). */
  const saveRoute = (routeId, {status, currentStep, completedSteps}) =>
    set("route", routeId, status, {currentStep: currentStep ?? null, completedSteps: [...(completedSteps || [])]});

  function summary(registry) {
    const out = {};
    for (const type of ["lesson", "practice", "route", "assessment"]) {
      const items = registry.list(type);
      const done = items.filter(i => isDone(type, statusOf(type, i.id))).length;
      out[type] = {total: items.length, done, inProgress: items.filter(i => ["IN_PROGRESS", "PAUSED"].includes(statusOf(type, i.id))).length};
    }
    return out;
  }
  const all = () => [...cache.learning.values()].map(clone);

  /* ---------- preferences ---------- */
  const prefRec = id => cache.prefs.get(id) || {id};
  function writePref(id, mutate) {
    const rec = clone(prefRec(id)); mutate(rec); rec.updatedAt = nowIso();
    cache.prefs.set(id, rec); persist("prefs", rec); return clone(rec);
  }
  const introMode = (ctxId, fallback = "expanded") => { const m = prefRec("context").intro?.[ctxId]; return INTRO_MODES.includes(m) ? m : fallback; };
  const setIntroMode = (ctxId, mode) => {
    if (!INTRO_MODES.includes(mode)) throw new Error(`Modo inválido: ${mode}`);
    return writePref("context", r => { r.intro = {...(r.intro || {}), [ctxId]: mode}; });
  };
  const resetIntros = () => writePref("context", r => { r.intro = {}; });
  const level = (ctxId, fallback = 1) => { const n = Number(prefRec("context").level?.[ctxId]); return n >= 1 && n <= 5 ? n : fallback; };
  const setLevel = (ctxId, n) => {
    n = Math.max(1, Math.min(5, Math.trunc(Number(n)) || 1));
    return writePref("context", r => { r.level = {...(r.level || {}), [ctxId]: n}; });
  };
  const guidePrefs = () => ({open: false, minimized: false, hidden: false, ...(({id, updatedAt, ...r}) => r)(prefRec("guide"))});
  const setGuidePrefs = patch => writePref("guide", r => Object.assign(r, Object.fromEntries(Object.entries(patch).filter(([k]) => ["open", "minimized", "hidden"].includes(k)).map(([k, v]) => [k, !!v]))));

  /* ---- navigation & UX preferences (same prefs store, records "nav" and "ux") ---- */
  const strip = ({id, updatedAt, ...r}) => r;
  const navPrefs = () => ({collapsed: {}, lastRoute: null, ...strip(prefRec("nav"))});
  const setNavPrefs = patch => writePref("nav", r => {
    if (patch.collapsed && typeof patch.collapsed === "object") r.collapsed = Object.fromEntries(Object.entries(patch.collapsed).map(([k, v]) => [String(k), !!v]));
    if ("lastRoute" in patch) r.lastRoute = typeof patch.lastRoute === "string" && /^#\/execution(\/|\?|$)/.test(patch.lastRoute) ? patch.lastRoute : null;
  });
  const uxPrefs = () => ({learningMode: "standard", startPage: "command-center", ...strip(prefRec("ux"))});
  const setUxPrefs = patch => {
    if ("learningMode" in patch && !LEARNING_MODES.includes(patch.learningMode)) throw new Error(`Modo de aprendizaje inválido: ${patch.learningMode}`);
    if ("startPage" in patch && !START_PAGES.includes(patch.startPage)) throw new Error(`Página inicial inválida: ${patch.startPage}`);
    return writePref("ux", r => { for (const k of ["learningMode", "startPage"]) if (k in patch) r[k] = patch[k]; });
  };

  /** One-time import of the legacy localStorage Academy checklist into IndexedDB (no data loss). */
  function migrateLegacy(storage = globalThis.localStorage, key = "rgt.academy.progress.v1") {
    let legacy = null;
    try { legacy = JSON.parse(storage?.getItem(key) || "null"); } catch { return 0; }
    if (!legacy || typeof legacy !== "object") return 0;
    let n = 0;
    for (const [id, done] of Object.entries(legacy)) {
      if (done === true && statusOf("lesson", id) === STATES.NOT_STARTED) { complete("lesson", id, {migrated: true}); n++; }
    }
    try { storage.removeItem(key); } catch { /* ignore */ }
    return n;
  }

  const api = {load, flush, get, statusOf, set, start, complete, reset, recordAttempt, saveRoute, summary, all,
    introMode, setIntroMode, resetIntros, level, setLevel, guidePrefs, setGuidePrefs, navPrefs, setNavPrefs, uxPrefs, setUxPrefs, migrateLegacy};
  return api;
}

/** Adapter over the app's IndexedDB wrapper (js/db/indexedDB.js). */
export const dbAdapter = db => ({all: s => db.all(s), put: (s, r) => db.put(s, r)});
