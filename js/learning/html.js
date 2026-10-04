import {registry, progress, resolve} from "./index.js";
import {renderIntro, renderHelp} from "./contextEngine.js";

/** Template helpers for views. They return strings and read only the shared registry/preferences. */
export const introFor = ctx => (ctx ? renderIntro(ctx, {mode: progress.introMode(ctx.id, ctx.defaultMode || "expanded"), level: progress.level(ctx.id), resolve}) : "");
export const viewIntro = view => introFor(registry.contextForView(view));
export const moduleIntro = id => introFor(registry.get("context", id));
export const help = (id, pattern = "popover") => renderHelp(registry.get("context", id), {pattern, resolve});
