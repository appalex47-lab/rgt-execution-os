export const SPRINT_STATUSES=["ACTIVE","CLOSED"];

export function getActiveSprint(sprints=[]){
  return sprints.find(s=>s.status==="ACTIVE")||null;
}
export function validateNewSprint(sprints=[], candidate={}){
  if(getActiveSprint(sprints)) return {allowed:false,reason:"Ya existe un Sprint ACTIVE. Ciérralo antes de crear otro."};
  if(!candidate.week_number || !candidate.start_date || !candidate.end_date) return {allowed:false,reason:"Semana, fecha de inicio y fecha de fin son obligatorias."};
  if(candidate.end_date < candidate.start_date) return {allowed:false,reason:"La fecha de fin no puede ser anterior al inicio."};
  return {allowed:true,reason:"Sprint válido."};
}
export function validateSprintUpdate(sprints,id,patch){
  const others=sprints.filter(s=>s.id!==id);
  if(patch.status==="ACTIVE"&&getActiveSprint(others))return {allowed:false,reason:"No puede existir más de un Sprint ACTIVE."};
  if(patch.end_date&&patch.start_date&&patch.end_date<patch.start_date)return {allowed:false,reason:"La fecha de fin no puede ser anterior al inicio."};
  return {allowed:true};
}
