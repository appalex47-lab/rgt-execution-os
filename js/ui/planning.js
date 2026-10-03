import {db} from "../db/indexedDB.js";
import {state} from "../core/state.js";
import {getActiveSprint,calculatePacing,validateNewSprint,validateSprintUpdate} from "../engines/sprintEngine.js";
import {PILLARS,getMustWinIds,validateMustWins,getEligibleByPillar} from "../engines/mustWinEngine.js";

export function planning(d){
  const s=getActiveSprint(d.sprints)||d.sprints.slice().sort((a,b)=>String(b.start_date||"").localeCompare(String(a.start_date||"")))[0]||{};
  const p=calculatePacing(s,new Date());
  const ids=getMustWinIds(s,d.initiatives);
  return `<div class=head><div><div class=eyebrow>Control semanal</div><h1>Planning Semanal</h1><div class=sub>Sprint + pacing comercial + exactamente 3 Must-Win Battles.</div></div><div>${s.status==="ACTIVE"?`<button class="btn danger-btn" id="close-sprint">Cerrar Sprint</button>`:`<button class="btn primary" id="new-sprint">+ Nuevo Sprint</button>`}</div></div>
  <section class=panel><h2>Sprint actual</h2><div class=formgrid>
    <div class=field><label>Semana</label><input id="sp-week" type="number" value="${esc(s.week_number)}"></div>
    <div class=field><label>Año</label><input id="sp-year" type="number" value="${esc(s.year||new Date().getFullYear())}"></div>
    <div class=field><label>Inicio</label><input id="sp-start" type="date" value="${esc(s.start_date)}"></div>
    <div class=field><label>Fin</label><input id="sp-end" type="date" value="${esc(s.end_date)}"></div>
    <div class=field><label>Meta mensual</label><input id="sp-month-target" type="number" value="${Number(s.monthly_target_revenue||0)}"></div>
    <div class=field><label>Venta acumulada</label><input id="sp-actual" type="number" value="${Number(s.actual_revenue||0)}"></div>
    <div class=field><label>Meta Sprint</label><input id="sp-target" type="number" value="${Number(s.target_revenue||0)}"></div>
    <div class=field><label>CR actual</label><input id="sp-cr" type="number" step="0.0001" value="${Number(s.actual_cr||0)}"></div>
    <div class=field><label>CR target</label><input id="sp-cr-target" type="number" step="0.0001" value="${Number(s.target_cr||0)}"></div>
    <div class=field><label>AOV actual</label><input id="sp-aov" type="number" value="${Number(s.actual_aov||0)}"></div>
    <div class=field><label>AOV target</label><input id="sp-aov-target" type="number" value="${Number(s.target_aov||0)}"></div>
  </div><div class=modal-actions><button class="btn primary" id="save-sprint">Guardar Sprint</button></div></section>
  <div class=grid3 style="margin-top:14px">
    <section class=kpi><small>Pacing mensual</small><strong>${pc(p.pacing)}</strong><div class=mini>${money(p.actual)} / ${money(p.target)}</div></section>
    <section class=kpi><small>Días transcurridos</small><strong>${p.elapsedDays}</strong><div class=mini>${p.remainingDays} restantes</div></section>
    <section class=kpi><small>Venta diaria requerida</small><strong>${money(p.requiredDaily)}</strong><div class=mini>para cerrar meta mensual</div></section>
  </div>
  <section class=panel style="margin-top:14px"><div class=section-head><div><h2>Must-Win Battles</h2><div class=sub>Selecciona una iniciativa elegible por cada pilar. Guardar exige 1 RUN + 1 GROW + 1 TRANSFORM.</div></div><button class="btn primary" id="save-mustwins">Guardar 3 Must-Win</button></div>
  <div class=grid3>${PILLARS.map(pillar=>{const selected=ids.find(id=>d.initiatives.find(x=>x.id===id)?.pillar===pillar);const options=getEligibleByPillar(d.initiatives,pillar);return `<div class="mw-card ${pillar.toLowerCase()}"><b>${pillar}</b><select data-mw="${pillar}"><option value="">Seleccionar iniciativa…</option>${options.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?"selected":""}>${esc(x.id)} · ${esc(x.title)}</option>`).join("")}</select><small>${options.length} elegible(s)</small></div>`}).join("")}</div></section>
  <div class=callout><b>Reglas:</b> solo existe un Sprint ACTIVE; cerrar conserva la historia. Must-Win no crea trabajo nuevo: apunta a una iniciativa real y elegible.</div>`;
}

export function bindPlanning(){
  document.querySelector("#save-sprint")?.addEventListener("click",saveSprint);
  document.querySelector("#close-sprint")?.addEventListener("click",closeSprint);
  document.querySelector("#new-sprint")?.addEventListener("click",newSprint);
  document.querySelector("#save-mustwins")?.addEventListener("click",saveMustWins);
}
async function saveSprint(){
  const d=state.get(),s=getActiveSprint(d.sprints)||d.sprints.slice(-1)[0]; if(!s)return;
  const patch={week_number:Number(q("#sp-week").value),year:Number(q("#sp-year").value),start_date:q("#sp-start").value,end_date:q("#sp-end").value,monthly_target_revenue:Number(q("#sp-month-target").value),actual_revenue:Number(q("#sp-actual").value),target_revenue:Number(q("#sp-target").value),actual_cr:Number(q("#sp-cr").value),target_cr:Number(q("#sp-cr-target").value),actual_aov:Number(q("#sp-aov").value),target_aov:Number(q("#sp-aov-target").value),updated_at:new Date().toISOString()};
  const check=validateSprintUpdate(d.sprints,s.id,patch);if(!check.allowed)return toast(check.reason,"error");
  await db.put("sprints",{...s,...patch});await log(s.id,"SPRINT_UPDATED","Datos comerciales y calendario actualizados");state.set(await db.snapshot());render();
}
async function closeSprint(){
  const d=state.get(),s=getActiveSprint(d.sprints);if(!s)return;
  if(!confirm(`¿Cerrar Sprint Semana ${s.week_number}? El historial quedará preservado.`))return;
  await db.put("sprints",{...s,status:"CLOSED",closed_at:new Date().toISOString()});await log(s.id,"SPRINT_CLOSED",`Semana ${s.week_number} cerrada`);state.set(await db.snapshot());render();toast("Sprint cerrado. La historia quedó preservada.","success");
}
async function newSprint(){
  const d=state.get(),candidate={id:crypto.randomUUID(),week_number:(d.sprints.reduce((m,x)=>Math.max(m,Number(x.week_number)||0),0)+1),year:new Date().getFullYear(),status:"ACTIVE",start_date:"",end_date:"",month_start:"",month_end:"",monthly_target_revenue:0,target_revenue:0,actual_revenue:0,target_aov:0,actual_aov:0,target_cr:0,actual_cr:0,must_win_ids:[]};
  const check=validateNewSprint(d.sprints,candidate);if(!check.allowed)return toast(check.reason,"error");
  // Ask only for the missing dates/targets through a compact prompt, then persist the complete sprint.
  const start=prompt("Fecha de inicio (YYYY-MM-DD):");if(!start)return;
  const end=prompt("Fecha de fin (YYYY-MM-DD):");if(!end)return;
  candidate.start_date=start;candidate.end_date=end;candidate.month_start=start.slice(0,8)+"01";
  const lastDay=new Date(Number(start.slice(0,4)),Number(start.slice(5,7)),0).getDate();candidate.month_end=`${start.slice(0,8)}${String(lastDay).padStart(2,"0")}`;
  const target=Number(prompt("Meta mensual:", "0")||0);candidate.monthly_target_revenue=target;
  const sprintTarget=Number(prompt("Meta del Sprint:", "0")||0);candidate.target_revenue=sprintTarget;
  const valid=validateNewSprint(d.sprints,candidate);if(!valid.allowed)return toast(valid.reason,"error");
  await db.put("sprints",candidate);await log(candidate.id,"SPRINT_CREATED",`Semana ${candidate.week_number} creada`);state.set(await db.snapshot());render();
}
async function saveMustWins(){
  const d=state.get(),s=getActiveSprint(d.sprints);if(!s)return;
  const ids=PILLARS.map(p=>q(`[data-mw="${p}"]`)?.value).filter(Boolean);
  const check=validateMustWins(ids,d.initiatives);if(!check.allowed)return toast(check.reason,"error");
  const selectedSet=new Set(ids);
  const updated=d.initiatives.map(x=>({...x,is_must_win:selectedSet.has(x.id)}));
  for(const x of updated)await db.put("initiatives",x);
  await db.put("sprints",{...s,must_win_ids:ids,updated_at:new Date().toISOString()});
  await log(s.id,"MUST_WINS_UPDATED",ids.join(", "));
  state.set(await db.snapshot());render();toast("3 Must-Win Battles guardadas.","success");
}
function render(){window.dispatchEvent(new Event("rgt:render"))}
function q(s){return document.querySelector(s)}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(n){return "$"+Number(n||0).toLocaleString("es-MX",{maximumFractionDigits:0})}
function pc(n){return (Number(n||0)*100).toFixed(1)+"%"}
async function log(entity_id,action,detail){await db.put("activity",{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id,action,detail})}
function toast(message,type){let el=document.querySelector("#rgt-toast");if(!el){el=document.createElement("div");el.id="rgt-toast";document.body.appendChild(el)}el.className=`toast ${type}`;el.textContent=message;clearTimeout(window.__rgtToast);window.__rgtToast=setTimeout(()=>el.remove(),3500)}
