import {registerSectionContent} from "./sections.js";
import {registerDemoContent} from "./demo.js";
import {registerLegacyContent} from "./legacy.js";
import {registerNavigationContent} from "./navigation.js";
import {registerRealRoutes} from "./realRoutes.js";
import {registerMasterRoute} from "./masterRoute.js";
import {registry} from "../registry.js";

let done = false;
/** Idempotent. Order matters: rich content first, legacy adoption fills the gaps. */
export function registerAllContent() {
  if (done) return registry;
  registerSectionContent(); registerNavigationContent(); registerDemoContent(); registerLegacyContent(); registerRealRoutes(); registerMasterRoute();
  done = true; return registry;
}
