/**
 * WIP rules for RGT Execution OS.
 * BLOCKED consumes Transform capacity by design.
 */
export function getTransformWip(items){
  return items.filter(x=>x.pillar==="TRANSFORM" && ["IN_PROGRESS","BLOCKED"].includes(x.status)).length;
}

export function canStartTask(task, items){
  if(task.status !== "IN_PROGRESS") return {allowed:true, reason:"La iniciativa no está entrando a ejecución."};
  if(task.pillar !== "TRANSFORM") return {allowed:true, reason:"RUN y GROW no tienen límite WIP rígido en esta fase."};
  const current = getTransformWip(items.filter(x=>x.id!==task.id));
  if(current < 2) return {allowed:true, reason:`Existe capacidad WIP Transform (${current}/2).`};
  return {allowed:false, reason:"WIP Transform está en el máximo de 2. BLOCKED también consume capacidad."};
}

export function validateStatusChange(task, nextStatus, items){
  const candidate = {...task,status:nextStatus};
  return canStartTask(candidate, items);
}
