import {resolveHash, buildRoute as build} from "./nav.js";
/** Hash router. Canonical URLs are "#/execution/<grupo>/<módulo>?k=v" (see core/nav.js); legacy "#/view" URLs still resolve. */
let fn;
export const parseRoute = (hash = "") => resolveHash(hash);
export const buildRoute = build;
export const router = {
  start(f) { fn = f; const go = () => f(parseRoute(location.hash)); go(); addEventListener("hashchange", go); },
  go(view, params) { location.hash = buildRoute(view, params); },
  current() { return parseRoute(location.hash); }
};
