/**
 * WIP rules for RGT Execution OS.
 * BLOCKED consumes Transform capacity by design.
 */
export const WIP_LIMIT = 2;
export function getTransformWip(items){
  return items.filter(x=>x.pillar==="TRANSFORM" && ["IN_PROGRESS","BLOCKED"].includes(x.status)).length;
}

export function canStartTask(task, items){
  // Both IN_PROGRESS and BLOCKED consume TRANSFORM capacity, so both must be capacity-checked on entry.
  if(!["IN_PROGRESS","BLOCKED"].includes(task.status)) return {allowed:true, reason:"La iniciativa no está entrando a ejecución."};
  if(task.pillar !== "TRANSFORM") return {allowed:true, reason:"RUN y GROW no tienen límite WIP rígido en esta fase."};
  const current = getTransformWip(items.filter(x=>x.id!==task.id));
  if(current < WIP_LIMIT) return {allowed:true, reason:`Existe capacidad WIP Transform (${current}/${WIP_LIMIT}).`};
  return {allowed:false, reason:"WIP Transform está en el máximo de 2. BLOCKED también consume capacidad."};
}

export function validateStatusChange(task, nextStatus, items){
  const candidate = {...task,status:nextStatus};
  return canStartTask(candidate, items);
}
