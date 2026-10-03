import {state} from "../core/state.js";
import {createMessage,isIntegrationMessage,REVNAV_EVENTS} from "./revNavigatorContract.js";
import {toCommercialContext,toExecutionContext} from "./revNavigatorAdapter.js";

let connected = false;
let targetWindow = null;
let targetOrigin = null;
let allowedOrigins = [];
let listener = null;

function originAllowed(origin){
  if (!allowedOrigins.length) return false;
  return allowedOrigins.includes(origin);
}

export const revNavigatorBridge = {
  start({parentWindow=window.parent, origin=null, allowedOriginList=[] , onCommercialContext}={}) {
    if (listener) return;
    targetWindow = parentWindow;
    targetOrigin = origin || (allowedOriginList.length === 1 ? allowedOriginList[0] : null);
    allowedOrigins = [...new Set(allowedOriginList.filter(Boolean))];
    if (targetOrigin && !allowedOrigins.includes(targetOrigin)) allowedOrigins.push(targetOrigin);
    listener = (event) => {
      if (!isIntegrationMessage(event.data)) return;
      if (!originAllowed(event.origin)) return;
      if (targetWindow && event.source && event.source !== targetWindow) return;
      if (event.data.event === REVNAV_EVENTS.COMMERCIAL_CONTEXT_UPDATE) {
        const context = toCommercialContext(event.data.data);
        state.set({externalPacing: context, revNavigator:{connected:true,lastMessageAt:new Date().toISOString(),origin:event.origin}});
        connected = true;
        onCommercialContext?.(context);
        document.dispatchEvent(new CustomEvent("rgt:render"));
      }
    };
    window.addEventListener("message", listener);
    connected = Boolean(targetWindow && targetWindow !== window && targetOrigin && allowedOrigins.length);
    if (connected) targetWindow.postMessage(createMessage(REVNAV_EVENTS.READY), targetOrigin);
  },
  stop() {
    if (listener) window.removeEventListener("message", listener);
    listener = null; connected = false; targetWindow = null; targetOrigin = null; allowedOrigins = [];
  },
  requestCommercialContext() {
    if (!targetWindow || !targetOrigin || !connected) return false;
    targetWindow.postMessage(createMessage(REVNAV_EVENTS.REQUEST_COMMERCIAL_CONTEXT), targetOrigin);
    return true;
  },
  publishExecutionContext(snapshot, derived={}) {
    if (!targetWindow || !targetOrigin || !connected) return false;
    targetWindow.postMessage(createMessage(REVNAV_EVENTS.EXECUTION_CONTEXT_UPDATE, toExecutionContext(snapshot, derived)), targetOrigin);
    return true;
  },
  navigateToCommercialView(view, params={}) {
    if (!targetWindow || !targetOrigin || !connected || !view) return false;
    targetWindow.postMessage(createMessage(REVNAV_EVENTS.NAVIGATE_TO_COMMERCIAL_VIEW, {view, params}), targetOrigin);
    return true;
  },
  status(){ return {connected, version:"1.0.0", configured:allowedOrigins.length>0, allowedOrigins:[...allowedOrigins]}; }
};
