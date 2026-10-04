/** Hash router: "#/view?key=value". parse() is pure and testable; deep links carry params. */
let fn;
export function parseRoute(hash = "") {
  const raw = String(hash).replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const params = Object.fromEntries(new URLSearchParams(query));
  return { view: path || "dashboard", params };
}
export function buildRoute(view, params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== "")).toString();
  return `#/${view}${q ? "?" + q : ""}`;
}
export const router = {
  start(f) { fn = f; const go = () => f(parseRoute(location.hash)); go(); addEventListener("hashchange", go); },
  go(view, params) { location.hash = buildRoute(view, params); },
  current() { return parseRoute(location.hash); }
};
