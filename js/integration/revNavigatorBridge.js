/**
 * postMessage bridge for the standalone/iframe mode. Hardened:
 *  - explicit origin allowlist (no wildcard, ever); no allowlist => bridge stays disconnected
 *  - event.source must be the configured parent window
 *  - namespace + version + event whitelist + payload schema validation
 *  - correlation IDs on requests
 * In the integrated (same-app) mode this bridge is not used: the module adapter is called directly.
 */
import {state} from "../core/state.js";
import {requestRender} from "../core/events.js";
import {createMessage, isIntegrationMessage, REVNAV_EVENTS, newCorrelationId, validateExecutionContext} from "./revNavigatorContract.js";
import {toCommercialContext, toExecutionContext} from "./revNavigatorAdapter.js";

let connected = false, targetWindow = null, targetOrigin = null, allowedOrigins = [], listener = null;
const pending = new Set();
let lastError = null;

function originAllowed(origin) { return allowedOrigins.length > 0 && allowedOrigins.includes(origin); }
function validOrigin(o) { try { const u = new URL(o); return o !== "*" && (u.protocol === "https:" || u.hostname === "localhost") && u.origin === o; } catch { return false; } }

export const revNavigatorBridge = {
  start({parentWindow = window.parent, origin = null, allowedOriginList = [], onCommercialContext} = {}) {
    if (listener) return;
    const list = [...new Set([origin, ...allowedOriginList].filter(Boolean))].filter(validOrigin);
    allowedOrigins = list;
    targetOrigin = origin && validOrigin(origin) ? origin : (list.length === 1 ? list[0] : null);
    targetWindow = parentWindow;
    listener = (event) => {
      if (!originAllowed(event.origin)) return;
      if (!targetWindow || event.source !== targetWindow) return;
      if (!isIntegrationMessage(event.data)) return;
      if (event.data.event !== REVNAV_EVENTS.COMMERCIAL_CONTEXT_UPDATE) return;
      const cid = event.data.correlationId;
      if (cid && !pending.has(cid)) return;          // a reply must match a request we made
      const parsed = toCommercialContext(event.data.data);
      if (cid) pending.delete(cid);
      if (!parsed.valid) {
        lastError = {at: new Date().toISOString(), errors: parsed.errors};
        state.set({revNavigator: {connected: true, lastError, origin: event.origin}});
        requestRender();
        return;
      }
      lastError = null;
      state.set({externalPacing: parsed.context, revNavigator: {connected: true, lastMessageAt: new Date().toISOString(), lastError: null, warnings: parsed.warnings, origin: event.origin}});
      connected = true;
      onCommercialContext?.(parsed.context);
      requestRender();
    };
    window.addEventListener("message", listener);
    connected = Boolean(targetWindow && targetWindow !== window && targetOrigin && allowedOrigins.length);
    if (connected) targetWindow.postMessage(createMessage(REVNAV_EVENTS.READY), targetOrigin);
  },
  stop() {
    if (listener) window.removeEventListener("message", listener);
    listener = null; connected = false; targetWindow = null; targetOrigin = null; allowedOrigins = []; pending.clear(); lastError = null;
  },
  requestCommercialContext() {
    if (!targetWindow || !targetOrigin || !connected) return false;
    const id = newCorrelationId(); pending.add(id);
    targetWindow.postMessage(createMessage(REVNAV_EVENTS.REQUEST_COMMERCIAL_CONTEXT, {}, {correlationId: id}), targetOrigin);
    return true;
  },
  publishExecutionContext(snapshot, derived = {}) {
    if (!targetWindow || !targetOrigin || !connected) return false;
    const ctx = toExecutionContext(snapshot, derived);
    if (!validateExecutionContext(ctx).valid) return false;
    targetWindow.postMessage(createMessage(REVNAV_EVENTS.EXECUTION_CONTEXT_UPDATE, ctx), targetOrigin);
    return true;
  },
  navigateToCommercialView(view, params = {}) {
    if (!targetWindow || !targetOrigin || !connected || typeof view !== "string" || !view) return false;
    targetWindow.postMessage(createMessage(REVNAV_EVENTS.NAVIGATE_TO_COMMERCIAL_VIEW, {view, params}), targetOrigin);
    return true;
  },
  status() { return {connected, version: "1.0.0", configured: allowedOrigins.length > 0, allowedOrigins: [...allowedOrigins], lastError}; }
};
