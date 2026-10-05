import {registry} from "./registry.js";
import {createProgressStore, dbAdapter} from "./progressStore.js";
import {createTourEngine} from "./tourEngine.js";
import {registerAllContent} from "./content/index.js";
import {state} from "../core/state.js";
import {db} from "../db/indexedDB.js";

/** App-wide singletons. Tests build their own via createProgressStore/createTourEngine. */
registerAllContent();
export {registry};
export const progress = createProgressStore(dbAdapter(db));
export const tour = createTourEngine({
  registry, progress,
  resolveTarget: sel => document.querySelector(sel),
  getSnapshot: () => state.get(),
  onChange: s => window.dispatchEvent(new CustomEvent("rgt:tour", {detail: s}))
});
export const resolve = (kind, id) => registry.get(kind, id);
