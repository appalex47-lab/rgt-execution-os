/** RGT Assistant deterministic read-only tools — Phase AI-4. */

const OPEN_STATUSES = new Set(["READY", "IN_PROGRESS", "BLOCKED"]);

function activeSprint(snapshot) {
  return (snapshot?.sprints || []).find(s => s.status === "ACTIVE") || (snapshot?.sprints || [])[0] || null;
}
function initiatives(snapshot) { return snapshot?.initiatives || []; }
function byId(snapshot, id) { return initiatives(snapshot).find(i => i.id === id) || null; }
function dateOnly(v) { return String(v || "").slice(0, 10); }
function todayIso() { return new Date().toISOString().slice(0, 10); }
function enrich(snapshot, list) {
  const checklist = snapshot?.checklist || [];
  return list.map(i => ({
    id:i.id, title:i.title, pillar:i.pillar, status:i.status, owner:i.owner || null,
    priority:i.priority || null, is_must_win:Boolean(i.is_must_win),
    success_criteria:i.success_criteria || null,
    dod:{total:checklist.filter(c => c.task_id === i.id && c.category === "DOD").length,
      pending:checklist.filter(c => c.task_id === i.id && c.category === "DOD" && !c.is_completed).length}
  }));
}

export function getCurrentSprint(snapshot){
  const s=activeSprint(snapshot); if(!s) return {found:false};
  return {found:true,id:s.id,week_number:s.week_number,year:s.year,status:s.status,start_date:s.start_date,end_date:s.end_date,must_win_ids:s.must_win_ids||[]};
}
export function getTodayTasks(snapshot, date=todayIso()){
  const s=activeSprint(snapshot); const list=initiatives(snapshot).filter(i=>OPEN_STATUSES.has(i.status));
  const explicit=list.filter(i=>dateOnly(i.due_date)===date);
  const fallback=!explicit.length && s ? list.filter(i=>i.sprint_id===s.id || (s.must_win_ids||[]).includes(i.id)) : explicit;
  return {date,mode:explicit.length?"DUE_DATE":"ACTIVE_SPRINT_FALLBACK",tasks:enrich(snapshot,fallback)};
}
export function getWeekTasks(snapshot){
  const s=activeSprint(snapshot); const ids=new Set(s?.must_win_ids||[]);
  const list=initiatives(snapshot).filter(i=>OPEN_STATUSES.has(i.status) && (ids.has(i.id)||!s||i.sprint_id===s.id||!i.sprint_id));
  return {sprint:getCurrentSprint(snapshot),tasks:enrich(snapshot,list)};
}
export function getMonthTasks(snapshot){
  const s=activeSprint(snapshot); const start=s?.month_start||todayIso().slice(0,7)+"-01"; const end=s?.month_end||start;
  const list=initiatives(snapshot).filter(i=>OPEN_STATUSES.has(i.status));
  return {period:{start,end},tasks:enrich(snapshot,list)};
}
export function getMustWin(snapshot){
  const s=activeSprint(snapshot); const ids=s?.must_win_ids||[];
  return {sprintId:s?.id||null,items:ids.map(id=>byId(snapshot,id)).filter(Boolean).map(i=>enrich(snapshot,[i])[0])};
}
export function getBlockedInitiatives(snapshot){
  return {items:enrich(snapshot,initiatives(snapshot).filter(i=>i.status==="BLOCKED"))};
}
export function getExecutionHealth(snapshot){
  const d=snapshot||{}; const all=initiatives(d); const transform=all.filter(i=>i.pillar==="TRANSFORM");
  const wip=transform.filter(i=>["IN_PROGRESS","BLOCKED"].includes(i.status)).length;
  const blocked=all.filter(i=>i.status==="BLOCKED").length;
  const dod=d.checklist||[]; const pending=dod.filter(x=>!x.is_completed).length;
  const mw=getMustWin(d); const done=mw.items.filter(x=>x.status==="DONE").length;
  return {wip_transform:wip,wip_limit:2,wip_status:wip<=2?"WITHIN_LIMIT":"OVER_LIMIT",blocked_count:blocked,dod_total:dod.length,dod_pending:pending,must_win_total:mw.items.length,must_win_done:done};
}
export function getInitiative(snapshot,id){
  const i=byId(snapshot,id); if(!i)return {found:false,id};
  const checklist=(snapshot?.checklist||[]).filter(c=>c.task_id===id); const evidence=(snapshot?.evidence||[]).filter(e=>e.task_id===id);
  return {found:true,initiative:{...i,checklist,evidence}};
}
export function getDeepWorkCandidates(snapshot){
  const list=initiatives(snapshot).filter(i=>i.status==="IN_PROGRESS"&&(i.pillar==="TRANSFORM"||i.pillar==="GROW"));
  const ordered=list.slice().sort((a,b)=>a.pillar===b.pillar?0:a.pillar==="TRANSFORM"?-1:1);
  return {candidates:enrich(snapshot,ordered),rule:"TRANSFORM first, then GROW; exclude RUN and BLOCKED."};
}

export const ASSISTANT_TOOLS=Object.freeze({
  getCurrentSprint, getTodayTasks, getWeekTasks, getMonthTasks, getMustWin,
  getBlockedInitiatives, getExecutionHealth, getInitiative, getDeepWorkCandidates
});

export function resolveAssistantContext(snapshot, question=""){
  const q=String(question).trim().toLowerCase();
  const id=(q.match(/\b(?:[rgt]?[-_]?\d{1,6})\b/i)||[])[0];
  if(id){ const normalized=id.toUpperCase().replace("_","-"); const found=getInitiative(snapshot,normalized); if(found.found) return {tool:"getInitiative",data:found}; }
  if(/bloquead|blocker|bloqueo/.test(q)) return {tool:"getBlockedInitiatives",data:getBlockedInitiatives(snapshot)};
  if(/must.?win|prioridad(es)?|prioriza/.test(q)) return {tool:"getMustWin",data:getMustWin(snapshot)};
  if(/deep work|trabajo profundo|concentraci[oó]n/.test(q)) return {tool:"getDeepWorkCandidates",data:getDeepWorkCandidates(snapshot)};
  if(/hoy|pendiente.*hoy|para hoy/.test(q)) return {tool:"getTodayTasks",data:getTodayTasks(snapshot)};
  if(/mes|mensual/.test(q)) return {tool:"getMonthTasks",data:getMonthTasks(snapshot)};
  if(/semana|semanal|esta semana/.test(q)) return {tool:"getWeekTasks",data:getWeekTasks(snapshot)};
  if(/sprint|semana actual|ciclo actual/.test(q)) return {tool:"getCurrentSprint",data:getCurrentSprint(snapshot)};
  if(/salud|satur|wip|capacidad|ejecuci[oó]n/.test(q)) return {tool:"getExecutionHealth",data:getExecutionHealth(snapshot)};
  return {tool:"getWeekTasks",data:getWeekTasks(snapshot)};
}
