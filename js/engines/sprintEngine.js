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
export function calculatePacing(sprint={},today=new Date()){
  const target=Number(sprint.monthly_target_revenue ?? sprint.target_revenue ?? 0);
  const actual=Number(sprint.actual_revenue||0);
  const pacing=target>0?actual/target:0;
  const start=sprint.month_start||sprint.start_date;
  const end=sprint.month_end||sprint.end_date;
  const startD=start?new Date(`${start}T00:00:00`):today;
  const endD=end?new Date(`${end}T23:59:59`):today;
  const todayD=today instanceof Date?today:new Date(today);
  const elapsed=Math.max(0,Math.min(daysInclusive(startD,todayD),daysInclusive(startD,endD)));
  const total=Math.max(1,daysInclusive(startD,endD));
  const remaining=Math.max(0,total-elapsed);
  const requiredDaily=remaining>0?Math.max(0,target-actual)/remaining:Math.max(0,target-actual);
  return {target,actual,pacing,elapsedDays:elapsed,remainingDays:remaining,totalDays:total,requiredDaily,monthStart:start,monthEnd:end};
}
function daysInclusive(a,b){
  const x=new Date(a.getFullYear(),a.getMonth(),a.getDate()),y=new Date(b.getFullYear(),b.getMonth(),b.getDate());
  return Math.floor((y-x)/86400000)+1;
}
export function validateSprintUpdate(sprints,id,patch){
  const others=sprints.filter(s=>s.id!==id);
  if(patch.status==="ACTIVE"&&getActiveSprint(others))return {allowed:false,reason:"No puede existir más de un Sprint ACTIVE."};
  if(patch.end_date&&patch.start_date&&patch.end_date<patch.start_date)return {allowed:false,reason:"La fecha de fin no puede ser anterior al inicio."};
  return {allowed:true};
}
