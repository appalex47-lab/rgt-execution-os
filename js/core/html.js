/** Shared HTML helpers. Every interpolated value that is not a constant MUST go through esc(). */
export function esc(v = "") {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
/** Only http(s) URLs become links; anything else (javascript:, data:, relative) is plain text. */
export function safeHref(url) {
  const s = String(url ?? "").trim();
  return /^https?:\/\//i.test(s) ? s : null;
}
/** CSS-class-safe token. */
export function cssToken(v = "") { return String(v ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").replaceAll("_", "-"); }
