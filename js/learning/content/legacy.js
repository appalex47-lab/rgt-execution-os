import {LESSONS, CONTEXT} from "../../academy.js";
import {registry, registerContext, registerLesson} from "../registry.js";

/**
 * The pre-Fase-1 Academy kept its own copies of guide texts and lessons. They are adopted here instead of
 * duplicated: each legacy guide becomes a SECTION context and each lesson a registered lesson.
 * Anything already registered with richer content (section:board, …) wins.
 */
const LESSON_CONCEPTS = {"foundations-wip": ["concept:wip"]};
export function registerLegacyContent() {
  for (const [view, c] of Object.entries(CONTEXT)) {
    const id = `section:${view}`;
    if (registry.get("context", id) || registry.contextForView(view)) continue;
    registerContext({id, type: "SECTION", view, defaultMode: "minimized", title: c.title, shortDescription: c.what, recommendedFirstAction: c.do, successCheck: c.correct});
  }
  for (const l of LESSONS) {
    if (registry.get("lesson", l.id)) continue;
    registerLesson({...l, concepts: LESSON_CONCEPTS[l.id] || []});
  }
}
