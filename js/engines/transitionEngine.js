/**
 * Central deterministic gate for every initiative mutation.
 * Board, detail modal and AI controlled actions all go through here, so Ready / WIP / DoD
 * cannot be bypassed from any surface (UI or Cohere proposals).
 */
import {canStartTaskReady, getReadyIssues} from "./readyEngine.js";
import {canCompleteTask} from "./dodEngine.js";
import {canStartTask, getTransformWip, WIP_LIMIT} from "./wipEngine.js";

export const STATUSES = Object.freeze(["BACKLOG","READY","IN_PROGRESS","BLOCKED","DONE","CANCELLED"]);
export const PILLARS = Object.freeze(["RUN","GROW","TRANSFORM"]);
export const PRIORITIES = Object.freeze(["Alta","Media","Baja"]);
export const TERMINAL = Object.freeze(["DONE","CANCELLED"]);
const ALLOWED = {
  BACKLOG: ["READY","CANCELLED"],
  READY: ["BACKLOG","IN_PROGRESS","BLOCKED","CANCELLED"],
  IN_PROGRESS: ["READY","BLOCKED","DONE","CANCELLED"],
  BLOCKED: ["IN_PROGRESS","READY","CANCELLED"],
  DONE: [],
  CANCELLED: []
};
const ok = (reason) => ({allowed: true, reason});
const no = (reason) => ({allowed: false, reason});
const text = v => String(v ?? "").trim();

/** Validates moving `task` to `next`. snapshot = {initiatives, checklist, evidence}. */
export function validateTransition(task, next, snapshot = {}, {reason} = {}) {
  if (!task) return no("La iniciativa no existe.");
  if (!STATUSES.includes(next)) return no(`Estado inválido: ${next}.`);
  if (task.status === next) return ok("Sin cambios de estado.");
  if (!(ALLOWED[task.status] || []).includes(next)) {
    return no(TERMINAL.includes(task.status)
      ? `${task.status} es un estado final; no se puede reabrir. Crea una nueva iniciativa.`
      : `Transición no permitida: ${task.status} → ${next}.`);
  }
  const checklist = snapshot.checklist || [], items = snapshot.initiatives || [];
  if (next === "CANCELLED" && !text(reason)) return no("La cancelación requiere un motivo.");
  if ((next === "READY" || (next === "IN_PROGRESS" && ["BACKLOG","READY"].includes(task.status)))) {
    const r = canStartTaskReady(task, checklist);
    if (!r.allowed) return no(r.reason);
  }
  if (next === "DONE") {
    const d = canCompleteTask(task, checklist, snapshot.evidence || []);
    if (!d.allowed) return no(d.reason);
    return ok(d.reason);
  }
  if (next === "IN_PROGRESS" || next === "BLOCKED") {
    const w = canStartTask({...task, status: next}, items);
    if (!w.allowed) return no(w.reason);
    return ok(w.reason);
  }
  return ok(`${task.status} → ${next} permitido.`);
}

/** Validates an edit of descriptive fields (title, pillar, owner, ...), incl. WIP on pillar change. */
export function validateFieldUpdate(task, patch = {}, snapshot = {}) {
  if (!task) return no("La iniciativa no existe.");
  if (TERMINAL.includes(task.status)) return no(`${task.status} es un estado final; no se puede editar.`);
  const next = {...task, ...patch};
  if ("pillar" in patch && !PILLARS.includes(next.pillar)) return no("Pilar inválido.");
  if ("priority" in patch && !PRIORITIES.includes(next.priority)) return no("Prioridad inválida.");
  for (const k of ["title","description","owner","objective","success_criteria","dependencies"]) {
    if (k in patch && !text(next[k])) return no(`El campo ${k.replaceAll("_"," ")} no puede quedar vacío.`);
  }
  if (["READY","IN_PROGRESS","BLOCKED"].includes(task.status)) {
    const issues = getReadyIssues(next, snapshot.checklist || []);
    if (issues.length) return no(`La edición dejaría la iniciativa sin Definition of Ready: ${issues.join(" ")}`);
  }
  if (("pillar" in patch) && patch.pillar !== task.pillar && ["IN_PROGRESS","BLOCKED"].includes(task.status)) {
    const w = canStartTask(next, snapshot.initiatives || []);
    if (!w.allowed) return no(w.reason);
  }
  return ok("Edición válida.");
}

export {getTransformWip, WIP_LIMIT};
