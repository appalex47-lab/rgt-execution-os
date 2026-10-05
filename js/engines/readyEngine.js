const REQUIRED=["title","description","pillar","objective","success_criteria","owner"];
export function getReadyIssues(task,checklist=[]){
  const issues=[];
  for(const key of REQUIRED) if(!String(task?.[key]??"").trim()) issues.push(`Falta ${key.replaceAll("_"," ")}.`);
  if(!String(task?.dependencies??"").trim()) issues.push("Faltan dependencias o indicar 'Ninguna'.");
  const dod=checklist.filter(x=>x.task_id===task.id&&x.category==="DOD");
  if(!dod.length) issues.push("Debe existir al menos un requisito DoD.");
  return issues;
}
export function canStartTaskReady(task,checklist){
  const issues=getReadyIssues(task,checklist);
  return {allowed:issues.length===0,issues,reason:issues.length?`No está READY: ${issues.join(" ")}`:"Definition of Ready completa."};
}
