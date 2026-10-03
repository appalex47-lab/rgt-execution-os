export const BACKUP_VERSION='1.0';
export const STORE_NAMES=['sprints','initiatives','checklist','evidence','deepWork','reviews','activity'];
export function buildBackup(snapshot,meta={}){return {format:'RGT_EXECUTION_OS_BACKUP',version:BACKUP_VERSION,exported_at:new Date().toISOString(),schema_version:3,app:'RGT Execution OS',source:meta.source||'local',data:Object.fromEntries(STORE_NAMES.map(s=>[s,Array.isArray(snapshot?.[s])?snapshot[s]:[]]))};}
export function validateBackup(payload){
 if(!payload||payload.format!=='RGT_EXECUTION_OS_BACKUP')return {valid:false,errors:['Formato de backup no reconocido.']};
 if(payload.version!==BACKUP_VERSION)return {valid:false,errors:[`Versión de backup no soportada: ${payload.version||'—'}.`]};
 if(!payload.data||typeof payload.data!=='object')return {valid:false,errors:['Falta el bloque data.']};
 const errors=[];
 for(const s of STORE_NAMES){if(!Array.isArray(payload.data[s]))errors.push(`Store inválido: ${s}.`);}
 for(const s of STORE_NAMES){if(!Array.isArray(payload.data[s]))continue;const ids=payload.data[s].map(x=>x?.id).filter(Boolean);if(new Set(ids).size!==ids.length)errors.push(`IDs duplicados en ${s}.`);}
 const ids=new Set((payload.data.initiatives||[]).map(x=>x.id));
 for(const x of payload.data.checklist||[])if(x.task_id&&!ids.has(x.task_id))errors.push(`Checklist ${x.id||'sin ID'} apunta a una iniciativa inexistente.`);
 for(const x of payload.data.evidence||[])if(x.task_id&&!ids.has(x.task_id))errors.push(`Evidence ${x.id||'sin ID'} apunta a una iniciativa inexistente.`);
 const sprintIds=new Set((payload.data.sprints||[]).map(x=>x.id));
 for(const x of payload.data.reviews||[])if(x.sprint_id&&!sprintIds.has(x.sprint_id))errors.push(`Review ${x.id||'sin ID'} apunta a un Sprint inexistente.`);
 const active=(payload.data.sprints||[]).filter(x=>x.status==='ACTIVE').length;
 if(active>1)errors.push('El backup contiene más de un Sprint ACTIVE.');
 for(const s of payload.data.sprints||[])if(Array.isArray(s.must_win_ids))for(const id of s.must_win_ids)if(!ids.has(id))errors.push(`Sprint ${s.id} referencia Must-Win inexistente: ${id}.`);
 return {valid:errors.length===0,errors};
}
export function formatBackupSummary(payload){const d=payload?.data||{};return STORE_NAMES.map(s=>`${s}: ${(d[s]||[]).length}`).join(' · ');}
