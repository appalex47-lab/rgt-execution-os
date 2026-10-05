/** Single render channel. Every module requests a re-render through here (window-level event). */
export const RENDER_EVENT = "rgt:render";
export function requestRender() { window.dispatchEvent(new Event(RENDER_EVENT)); }
export function onRender(fn) { window.addEventListener(RENDER_EVENT, fn); }
