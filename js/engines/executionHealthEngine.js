export function getExecutionHealth(d){
 const initiatives=d.initiatives||[];
 const transform=initiatives.filter(x=>x.pillar==='TRANSFORM');
 const wip=transform.filter(x=>['IN_PROGRESS','BLOCKED'].includes(x.status)).length;
 const blocked=initiatives.filter(x=>x.status==='BLOCKED').length;
 const dodTotal=(d.checklist||[]).length;
 const dodPending=(d.checklist||[]).filter(x=>!x.is_completed).length;
 const sprint=(d.sprints||[]).find(x=>x.status==='ACTIVE')||(d.sprints||[])[0]||null;
 const mustWins=sprint?.must_win_ids||[];
 const mwDone=mustWins.filter(id=>initiatives.find(x=>x.id===id)?.status==='DONE').length;
 const mwTotal=mustWins.length;
 const dimensions={
  capacity:{label:'Capacidad RGT',value:wip<=2?1:0,detail:`${wip}/2 WIP TRANSFORM`},
  flow:{label:'Flujo',value:blocked===0?1:blocked===1?.5:0,detail:blocked===0?'Sin bloqueos':`${blocked} bloqueada(s)`},
  delivery:{label:'Entrega',value:dodTotal?Math.max(0,1-dodPending/dodTotal):1,detail:dodTotal?`${dodTotal-dodPending}/${dodTotal} DoD completos`:'Sin checklist pendiente'},
  focus:{label:'Foco Must-Win',value:mwTotal===3?mwDone/3:0,detail:`${mwDone}/${mwTotal||3} Must-Win completados`}
 };
 const values=Object.values(dimensions).map(x=>x.value);
 const score=values.reduce((a,b)=>a+b,0)/values.length;
 const status=score>=.8?'STABLE':score>=.6?'ATTENTION':'AT_RISK';
 return {score,status,dimensions,wip,blocked,dodTotal,dodPending,mwDone,mwTotal,sprintId:sprint?.id||null};
}
