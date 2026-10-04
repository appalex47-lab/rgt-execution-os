export const PILLARS=["RUN","GROW","TRANSFORM"];
export const ELIGIBLE_STATUSES=["READY","IN_PROGRESS","BLOCKED"];
export function getMustWinIds(sprint={},initiatives=[]){
  if(Array.isArray(sprint.must_win_ids))return sprint.must_win_ids;
  return initiatives.filter(x=>x.is_must_win).map(x=>x.id);
}
export function validateMustWins(ids=[],initiatives=[]){
  const unique=[...new Set(ids)];
  if(unique.length!==3)return {allowed:false,reason:"Debe haber exactamente 3 Must-Win Battles."};
  const selected=unique.map(id=>initiatives.find(x=>x.id===id)).filter(Boolean);
  if(selected.length!==3)return {allowed:false,reason:"Cada Must-Win debe apuntar a una iniciativa existente."};
  const pillars=selected.map(x=>x.pillar);
  if(new Set(pillars).size!==3||!PILLARS.every(p=>pillars.includes(p)))return {allowed:false,reason:"Debe existir exactamente 1 Must-Win de RUN, 1 de GROW y 1 de TRANSFORM."};
  const invalid=selected.find(x=>!ELIGIBLE_STATUSES.includes(x.status));
  if(invalid)return {allowed:false,reason:`"${invalid.title}" no está en un estado elegible para Must-Win.`};
  return {allowed:true,reason:"3 Must-Win válidos."};
}
export function getEligibleByPillar(initiatives,pillar){
  return initiatives.filter(x=>x.pillar===pillar&&ELIGIBLE_STATUSES.includes(x.status));
}
