import {db} from "../db/indexedDB.js";
import {state} from "../core/state.js";
import {getActiveSprint,validateNewSprint,validateSprintUpdate} from "../engines/sprintEngine.js";
import {commercialPanel} from "./dashboard.js";
import {requestRender} from "../core/events.js";
import {esc} from "../core/html.js";
import {getMustWinIds} from "../engines/mustWinEngine.js";

export function planning(d){
  const s=getActiveSprint(d.sprints)||d.sprints.slice().sort((a,b)=>String(b.start_date||"").localeCompare(String(a.start_date||"")))[0]||{};
  const ids=getMustWinIds(s,d.initiatives);
  return `<div class=head><div><div class=eyebrow>Control semanal</div><h1>Planning Semanal</h1><div class=sub>Define el Sprint de la semana. El pacing comercial vive en RevNavigator.</div></div><div>${s.status==="ACTIVE"?`<button class="btn danger-btn" id="close-sprint">Cerrar Sprint</button>`:`<button class="btn primary" id="new-sprint">+ Nuevo Sprint</button>`}</div></div>
  <section class=panel><h2>Sprint actual</h2><div class=formgrid>
    <div class=field><label>Semana</label><input id="sp-week" type="number" value="${esc(s.week_number)}"></div>
    <div class=field><label>Año</label><input id="sp-year" type="number" value="${esc(s.year||new Date().getFullYear())}"></div>
    <div class=field><label>Inicio</label><input id="sp-start" type="date" value="${esc(s.start_date)}"></div>
    <div class=field><label>Fin</label><input id="sp-end" type="date" value="${esc(s.end_date)}"></div>
  </div><div class=modal-actions><button class="btn primary" id="save-sprint">Guardar Sprint</button></div></section>
  <div style="margin-top:14px">${commercialPanel(d.externalPacing)}</div>
  <section class=panel style="margin-top:14px"><div class=section-head><div><h2>Must-Win</h2><div class=sub>${ids.length}/3 definidos para esta semana. La selección se administra en su propio módulo.</div></div><a class="btn primary" href="#/execution/planificar/must-win">Ir a Must-Win →</a></div></section>
  <div class=callout><b>Reglas:</b> solo existe un Sprint ACTIVE; cerrar conserva la historia. Must-Win no crea trabajo nuevo: apunta a una iniciativa real y elegible.</div>`;
}

export function bindPlanning(){
  document.querySelector("#save-sprint")?.addEventListener("click",saveSprint);
  document.querySelector("#close-sprint")?.addEventListener("click",closeSprint);
  document.querySelector("#new-sprint")?.addEventListener("click",newSprint);
}
async function saveSprint(){
  const d=state.get(),s=getActiveSprint(d.sprints); if(!s)return toast("Solo se edita el Sprint ACTIVE.","error");
  const patch={week_number:Number(q("#sp-week").value),year:Number(q("#sp-year").value),start_date:q("#sp-start").value,end_date:q("#sp-end").value,updated_at:new Date().toISOString()};
  const check=validateSprintUpdate(d.sprints,s.id,patch);if(!check.allowed)return toast(check.reason,"error");
  await db.put("sprints",{...s,...patch});await log(s.id,"SPRINT_UPDATED","Calendario del Sprint actualizado");state.set(await db.snapshot());render();
}
async function closeSprint(){
  const d=state.get(),s=getActiveSprint(d.sprints);if(!s)return;
  if(!confirm(`¿Cerrar Sprint Semana ${s.week_number}? El historial quedará preservado.`))return;
  await db.put("sprints",{...s,status:"CLOSED",closed_at:new Date().toISOString()});await log(s.id,"SPRINT_CLOSED",`Semana ${s.week_number} cerrada`);state.set(await db.snapshot());render();toast("Sprint cerrado. La historia quedó preservada.","success");
}
const ISO=/^\d{4}-\d{2}-\d{2}$/;
async function newSprint(){
  const d=state.get(),candidate={id:crypto.randomUUID(),week_number:(d.sprints.reduce((m,x)=>Math.max(m,Number(x.week_number)||0),0)+1),year:new Date().getFullYear(),status:"ACTIVE",start_date:"",end_date:"",month_start:"",month_end:"",must_win_ids:[]};
  const pre=validateNewSprint(d.sprints,{...candidate,start_date:"2000-01-01",end_date:"2000-01-02"});if(!pre.allowed)return toast(pre.reason,"error");
  const start=prompt("Fecha de inicio (YYYY-MM-DD):");if(!start)return;
  const end=prompt("Fecha de fin (YYYY-MM-DD):");if(!end)return;
  if(!ISO.test(start)||!ISO.test(end)||isNaN(Date.parse(start))||isNaN(Date.parse(end)))return toast("Usa el formato YYYY-MM-DD.","error");
  candidate.start_date=start;candidate.end_date=end;candidate.year=Number(start.slice(0,4));candidate.month_start=start.slice(0,8)+"01";
  const lastDay=new Date(Number(start.slice(0,4)),Number(start.slice(5,7)),0).getDate();candidate.month_end=`${start.slice(0,8)}${String(lastDay).padStart(2,"0")}`;
  const valid=validateNewSprint(d.sprints,candidate);if(!valid.allowed)return toast(valid.reason,"error");
  await db.put("sprints",candidate);await log(candidate.id,"SPRINT_CREATED",`Semana ${candidate.week_number} creada`);state.set(await db.snapshot());render();
}
function render(){requestRender()}
function q(s){return document.querySelector(s)}
async function log(entity_id,action,detail){await db.put("activity",{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id,action,detail})}
function toast(message,type){let el=document.querySelector("#rgt-toast");if(!el){el=document.createElement("div");el.id="rgt-toast";document.body.appendChild(el)}el.className=`toast ${type}`;el.textContent=message;clearTimeout(window.__rgtToast);window.__rgtToast=setTimeout(()=>el.remove(),3500)}
