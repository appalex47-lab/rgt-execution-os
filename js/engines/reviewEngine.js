export const CARRY_OVER_STATUSES=new Set(['READY','IN_PROGRESS','BLOCKED']);
export function getReviewForSprint(reviews,sprintId){return reviews.find(r=>r.sprint_id===sprintId)||null}
export function getCarryOverCandidates(initiatives){return initiatives.filter(i=>CARRY_OVER_STATUSES.has(i.status))}
export function validateReviewInput(input){
 const fields=['must_win_completed','blocked_reason','next_week','learning'];
 const missing=fields.filter(k=>!String(input[k]??'').trim());
 return missing.length?{allowed:false,reason:`Completa: ${missing.join(', ')}`}:{allowed:true};
}
export function buildCarryOverIds(initiatives,excludedIds=[]){const ex=new Set(excludedIds);return getCarryOverCandidates(initiatives).filter(i=>!ex.has(i.id)).map(i=>i.id)}
