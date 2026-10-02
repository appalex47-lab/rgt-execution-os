export function getDod(task,checklist){return checklist.filter(x=>x.task_id===task.id&&x.category==="DOD")}
export function getEvidence(task,evidence){return evidence.filter(x=>x.task_id===task.id)}
export function canCompleteTask(task,checklist,evidence=[]){
  const dod=getDod(task,checklist), required=dod.filter(x=>x.required!==false), pending=required.filter(x=>!x.is_completed);
  if(!dod.length) return {allowed:false,reason:"No existe checklist DoD. Agrega al menos un requisito."};
  if(pending.length) return {allowed:false,reason:`DoD incompleto: ${pending.length} requisito(s) pendiente(s).`};
  if(task.evidence_required && !getEvidence(task,evidence).length) return {allowed:false,reason:"Esta iniciativa requiere evidencia para cerrarse."};
  return {allowed:true,reason:"DoD y evidencia requeridos completos. WIP será liberado."};
}
