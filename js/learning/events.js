/** Tiny bus so feature code can tell the guide "something happened" without importing the guide UI. */
export const LEARNING_EVENT = "rgt:learning";
export function emitLearning(type, payload = {}) {
  try { window.dispatchEvent(new CustomEvent(LEARNING_EVENT, {detail: {type, ...payload}})); } catch { /* no window (tests) */ }
}
export const onLearning = fn => window.addEventListener(LEARNING_EVENT, e => fn(e.detail));
