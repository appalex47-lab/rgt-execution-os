/** Deterministic controlled actions — Phase AI-5. Cohere proposes; RGT validates and persists. */
import {db} from "../db/indexedDB.js";
import {canStartTaskReady} from "../engines/readyEngine.js";
import {validateStatusChange} from "../engines/wipEngine.js";
import {canCompleteTask} from "../engines/dodEngine.js";

export const ACTION_TYPES=Object.freeze({NONE:"NONE",CREATE_INITIATIVE:"CREATE_INITIATIVE",UPDATE_INITIATIVE:"UPDATE_INITIATIVE",START_INITIATIVE:"START_INITIATIVE",COMPLETE_INITIATIVE:"COMPLETE_INITIATIVE",CANCEL_INITIATIVE:"CANCEL_INITIATIVE",START_DEEP_WORK:"START_DEEP_WORK"});
const UPDATE_FIELDS=["title","description","pillar","owner","objective","success_criteria","dependencies","priority"];
const VALID_PILLARS=["RUN","GROW","TRANSFORM"], VALID_PRIORITIES=["Alta","Media","Baja"];

function clean(v){return String(v??"").trim()}
function find(snapshot,id){return (snapshot?.initiatives||[]).find(x=>x.id===id)||null}
function log(entity_id,action,detail){return db.put("activity",{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id,action,detail})}

export function validateActionProposal(proposal,snapshot){
  const p=proposal||{}; const action=p.action||ACTION_TYPES.NONE; const errors=[];
  if(!Object.values(ACTION_TYPES).includes(action)) errors.push("Acción no permitida.");
  if(action===ACTION_TYPES.NONE) return {allowed:true,errors:[]};
  if([ACTION_TYPES.UPDATE_INITIATIVE,ACTION_TYPES.START_INITIATIVE,ACTION_TYPES.COMPLETE_INITIATIVE,ACTION_TYPES.CANCEL_INITIATIVE].includes(action)&&!find(snapshot,p.target_id)) errors.push("La iniciativa objetivo no existe.");
  if(action===ACTION_TYPES.UPDATE_INITIATIVE){
    if(!p.changes||typeof p.changes!=="object") errors.push("Faltan cambios para actualizar.");
    else if(!Object.keys(p.changes).some(k=>UPDATE_FIELDS.includes(k))) errors.push("No hay campos editables válidos.");
    else for(const k of Object.keys(p.changes)) if(!UPDATE_FIELDS.includes(k)) errors.push(`Campo no editable: ${k}.`);
  }
  if(action===ACTION_TYPES.CANCEL_INITIATIVE&&!clean(p.reason)) errors.push("La cancelación requiere un motivo.");
  if(action===ACTION_TYPES.CREATE_INITIATIVE){
    const d=p.draft||{};
    for(const k of ["title","description","pillar","owner","objective","success_criteria","dependencies","dod"]) if(!clean(d[k])) errors.push(`Falta ${k}.`);
    if(d.pillar&&!VALID_PILLARS.includes(d.pillar)) errors.push("Pilar inválido.");
    if(d.priority&&!VALID_PRIORITIES.includes(d.priority)) errors.push("Prioridad inválida.");
  }
  return {allowed:errors.length===0,errors};
}

export function prepareAction(proposal,snapshot){
  const validation=validateActionProposal(proposal,snapshot); if(!validation.allowed)return {allowed:false,errors:validation.errors};
  const action=proposal.action;
  if(action===ACTION_TYPES.NONE)return {allowed:true,action,requiresConfirmation:false,summary:"Sin acción de escritura."};
  const t=find(snapshot,proposal.target_id);
  if(action===ACTION_TYPES.START_INITIATIVE){
    const ready=canStartTaskReady(t,snapshot.checklist||[]); if(!ready.allowed)return {allowed:false,errors:[ready.reason]};
    const gate=validateStatusChange(t,"IN_PROGRESS",snapshot.initiatives||[]); if(!gate.allowed)return {allowed:false,errors:[gate.reason]};
    return {allowed:true,action,requiresConfirmation:true,target_id:t.id,summary:`Pasar ${t.id} a IN_PROGRESS.`};
  }
  if(action===ACTION_TYPES.COMPLETE_INITIATIVE){
    const done=canCompleteTask(t,snapshot.checklist||[],snapshot.evidence||[]); if(!done.allowed)return {allowed:false,errors:[done.reason]};
    return {allowed:true,action,requiresConfirmation:true,target_id:t.id,summary:`Completar ${t.id} y liberar su WIP.`};
  }
  if(action===ACTION_TYPES.START_DEEP_WORK){
    if((snapshot.deepWork||[]).some(x=>x.status==="IN_PROGRESS"))return {allowed:false,errors:["Ya existe una sesión Deep Work activa."]};
    const target=find(snapshot,proposal.target_id); if(!target)return {allowed:false,errors:["La iniciativa objetivo no existe."]};
    if(target.status!=="IN_PROGRESS"||!["TRANSFORM","GROW"].includes(target.pillar))return {allowed:false,errors:["Deep Work requiere una iniciativa TRANSFORM o GROW en IN_PROGRESS."]};
    return {allowed:true,action,requiresConfirmation:true,target_id:target.id,summary:`Iniciar una sesión Deep Work de 120 minutos para ${target.id}.`};
  }
  if(action===ACTION_TYPES.UPDATE_INITIATIVE)return {allowed:true,action,requiresConfirmation:true,target_id:t.id,summary:`Actualizar campos permitidos de ${t.id}.`,changes:proposal.changes};
  if(action===ACTION_TYPES.CANCEL_INITIATIVE)return {allowed:true,action,requiresConfirmation:true,target_id:t.id,summary:`Cancelar ${t.id} con motivo: ${clean(proposal.reason)}.`};
  if(action===ACTION_TYPES.CREATE_INITIATIVE)return {allowed:true,action,requiresConfirmation:true,summary:`Crear una iniciativa en BACKLOG: ${clean(proposal.draft.title)}.`,draft:proposal.draft};
  return {allowed:false,errors:["Acción no soportada."]};
}

export async function executeConfirmedAction(proposal,snapshot){
  const prepared=prepareAction(proposal,snapshot); if(!prepared.allowed)throw new Error(prepared.errors.join(" "));
  if(!prepared.requiresConfirmation) return {ok:true,action:prepared.action,mutated:false};
  const now=new Date().toISOString();
  if(prepared.action===ACTION_TYPES.CREATE_INITIATIVE){
    const d=prepared.draft; const id=`${d.pillar[0]}${Date.now().toString().slice(-5)}`;
    const task={id,title:clean(d.title),description:clean(d.description),pillar:d.pillar,status:"BACKLOG",owner:clean(d.owner),priority:d.priority||"Media",is_must_win:false,objective:clean(d.objective),success_criteria:clean(d.success_criteria),dependencies:clean(d.dependencies),evidence_required:false,created_at:now};
    await db.put("initiatives",task); await db.put("checklist",{id:crypto.randomUUID(),task_id:id,category:"DOD",description:clean(d.dod),required:true,is_completed:false}); await log(id,"INITIATIVE_CREATED_BY_ASSISTANT","Creada tras confirmación explícita del usuario");
    return {ok:true,action:prepared.action,mutated:true,id,message:`Iniciativa ${id} creada en BACKLOG.`};
  }
  const t=find(snapshot,prepared.target_id);
  if(prepared.action===ACTION_TYPES.UPDATE_INITIATIVE){
    const changes={}; for(const k of UPDATE_FIELDS)if(Object.prototype.hasOwnProperty.call(prepared.changes,k))changes[k]=clean(prepared.changes[k]);
    if(changes.pillar&&!VALID_PILLARS.includes(changes.pillar))throw new Error("Pilar inválido.");
    if(changes.priority&&!VALID_PRIORITIES.includes(changes.priority))throw new Error("Prioridad inválida.");
    const updated={...t,...changes,updated_at:now}; await db.put("initiatives",updated); await log(t.id,"INITIATIVE_UPDATED_BY_ASSISTANT","Actualización confirmada por el usuario"); return {ok:true,action:prepared.action,mutated:true,id:t.id,message:`${t.id} actualizado.`};
  }
  if(prepared.action===ACTION_TYPES.START_INITIATIVE){
    const u={...t,status:"IN_PROGRESS",started_at:t.started_at||now,updated_at:now}; await db.put("initiatives",u); await log(t.id,"STATUS_CHANGED_BY_ASSISTANT",`${t.status} → IN_PROGRESS`); return {ok:true,action:prepared.action,mutated:true,id:t.id,message:`${t.id} pasó a IN_PROGRESS.`};
  }
  if(prepared.action===ACTION_TYPES.COMPLETE_INITIATIVE){
    const u={...t,status:"DONE",completed_at:now,updated_at:now}; await db.put("initiatives",u); await log(t.id,"STATUS_CHANGED_BY_ASSISTANT",`${t.status} → DONE; WIP liberado`); return {ok:true,action:prepared.action,mutated:true,id:t.id,message:`${t.id} completado y WIP liberado.`};
  }
  if(prepared.action===ACTION_TYPES.CANCEL_INITIATIVE){
    const u={...t,status:"CANCELLED",cancellation_reason:clean(proposal.reason),updated_at:now}; await db.put("initiatives",u); await log(t.id,"CANCELLED_BY_ASSISTANT",clean(proposal.reason)); return {ok:true,action:prepared.action,mutated:true,id:t.id,message:`${t.id} cancelado.`};
  }
  if(prepared.action===ACTION_TYPES.START_DEEP_WORK){
    const s={id:crypto.randomUUID(),task_id:t.id,status:"IN_PROGRESS",started_at:now,elapsed_seconds:0,actual_minutes:0,notes:""}; await db.put("deepWork",s); await log(t.id,"DEEP_WORK_STARTED_BY_ASSISTANT","Sesión de 120 minutos iniciada tras confirmación explícita"); return {ok:true,action:prepared.action,mutated:true,id:t.id,session_id:s.id,message:`Deep Work iniciado para ${t.id}.`};
  }
  throw new Error("Acción no ejecutada.");
}
