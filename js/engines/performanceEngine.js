export const EXECUTION_STATUS_SET=new Set(['BACKLOG','READY','IN_PROGRESS','BLOCKED','DONE','CANCELLED']);
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function getDateRange(date=new Date()){const d=new Date(date);const day=(d.getDay()+6)%7;const start=new Date(d);start.setDate(d.getDate()-day);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(start.getDate()+6);end.setHours(23,59,59,999);return {start:start.toISOString(),end:end.toISOString(),startDate:ymd(start),endDate:ymd(end)};}
export function buildExecutionPerformance(snapshot,{start,end}={}){
 const initiatives=snapshot?.initiatives||[], checklist=snapshot?.checklist||[], deep=snapshot?.deepWork||[], activity=snapshot?.activity||[], reviews=snapshot?.reviews||[], sprints=snapshot?.sprints||[];
 const range=start&&end?{start,end}:{start:getDateRange().start,end:getDateRange().end};
 const inRange=t=>{const x=Date.parse(t||'');return Number.isFinite(x)&&x>=Date.parse(range.start)&&x<=Date.parse(range.end)};
 const sprint=sprints.find(s=>s.status==='ACTIVE')||sprints.slice().sort((a,b)=>String(b.start_date||'').localeCompare(String(a.start_date||'')))[0]||null;
 const sprintStart=sprint?.start_date||range.start.slice(0,10), sprintEnd=sprint?.end_date||range.end.slice(0,10);
 const sprintInRange=i=>{const a=i.updated_at||i.created_at||'';return inRange(a)||(!a&&i.status!=='BACKLOG');};
 const done=initiatives.filter(i=>i.status==='DONE'&&sprintInRange(i));
 const cancelled=initiatives.filter(i=>i.status==='CANCELLED'&&sprintInRange(i));
 const blocked=initiatives.filter(i=>i.status==='BLOCKED');
 const mwIds=new Set(sprint?.must_win_ids||[]); const mw=initiatives.filter(i=>mwIds.has(i.id));
 const mwCompleted=mw.filter(i=>i.status==='DONE').length;
 const required=checklist.filter(c=>c.required!==false); const completedRequired=required.filter(c=>c.is_completed).length;
 const dw=deep.filter(x=>inRange(x.completed_at||x.updated_at||'')||x.status==='COMPLETED'&&(!x.completed_at&&!x.updated_at));
 const dwCompleted=dw.filter(x=>x.status==='COMPLETED').length, dwMinutes=dw.reduce((n,x)=>n+Number(x.actual_minutes||0),0);
 const transform=initiatives.filter(i=>i.pillar==='TRANSFORM'); const activeTransform=transform.filter(i=>['IN_PROGRESS','BLOCKED'].includes(i.status)).length;
 const mix={RUN:0,GROW:0,TRANSFORM:0}; done.forEach(i=>{if(mix[i.pillar]!==undefined)mix[i.pillar]++;});
 const carry=sprint?.carry_over_ids||[]; const activityInRange=activity.filter(a=>inRange(a.timestamp));
 const wipViolations=activityInRange.filter(a=>String(a.action||'').includes('WIP')&&String(a.action||'').includes('VIOL')).length;
 const blockedEvents=activityInRange.filter(a=>String(a.action||'').includes('BLOCK')).length;
 const review=reviews.find(r=>r.sprint_id===sprint?.id)||null;
 const completionRate=done.length+cancelled.length?done.length/(done.length+cancelled.length):0;
 const dodRate=required.length?completedRequired/required.length:1;
 const mustWinRate=mw.length?mwCompleted/mw.length:0;
 const deepWorkRate=dw.length?dwCompleted/dw.length:0;
 const metrics={initiativesCompleted:done.length,initiativesCancelled:cancelled.length,completionRate,mustWin:{completed:mwCompleted,total:mw.length||3,rate:mustWinRate},dod:{completed:completedRequired,total:required.length,rate:dodRate},deepWork:{sessions:dwCompleted,total:dw.length,minutes:dwMinutes,completionRate:deepWorkRate},carryOverCount:carry.length,blockedCount:blocked.length,blockedEvents,wipViolations,activeTransformWIP:activeTransform,executionMix:mix};
 return {period:{...range,sprintId:sprint?.id||null,sprintStart,sprintEnd},metrics,review:{exists:Boolean(review),learning:review?.learning||'',nextWeek:review?.next_week||''},deterministic:true};
}
export function buildPerformanceNarrativePrompt(performance){return `Eres el narrador de desempeño de RGT Execution OS. Convierte métricas determinísticas en una narrativa semanal clara y factual.\nREGLAS:\n- Usa exclusivamente los datos proporcionados.\n- No inventes causas, resultados, objetivos ni métricas.\n- No conviertas los datos en un score global ni declares un ganador.\n- Describe hechos y tendencias observables; cuando una interpretación no esté demostrada, indícalo como posible lectura, no como hecho.\n- No calcules Pacing, Forecast, Reforecast o Recovery. RevNavigator es la fuente comercial.\n- No ordenes personas ni equipos.\n- No ejecutes acciones.\nDATOS:\n${JSON.stringify(performance)}\nDevuelve JSON con: summary (2-4 frases), highlights (máx 5 hechos), friction (máx 5 hechos de fricción/bloqueo), focus_next_week (máx 4 sugerencias basadas en los datos), limitations (máx 3 notas sobre cobertura/calidad).`}
