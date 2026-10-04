import {help} from "../learning/html.js";
import {db} from "../db/indexedDB.js";
import {state} from "../core/state.js";
import {getTransformWip} from "../engines/wipEngine.js";
import {validateTransition,validateFieldUpdate} from "../engines/transitionEngine.js";
import {requestRender} from "../core/events.js";
import {openInitiativeDetail,openCreateInitiative} from "./initiativeDetail.js";
import {openInitiativeCopilot} from "./initiativeCopilot.js";

const STATUS=["BACKLOG","READY","IN_PROGRESS","BLOCKED","DONE","CANCELLED"];
const PILLARS=["RUN","GROW","TRANSFORM"];

function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function label(s){return s.replaceAll("_"," ")}
function cls(s){return s.toLowerCase().replaceAll("_","-")}

export function board(d){
  const transformWip=getTransformWip(d.initiatives);
  return `<div class=head>
    <div data-rgt-target="board-header"><div class=eyebrow>Ejecución</div><h1>RGT Board</h1><div class=sub>RGT es el pilar. El estado controla el ciclo de ejecución.</div></div>
    <div><span class="wip-chip ${transformWip>=2?"wip-full":""}" data-rgt-target="wip-chip">TRANSFORM WIP <b>${transformWip}/2</b></span> ${help("component:wip-chip","popover")} <button class="btn" id="ai-copilot">✦ Crear con IA</button> <button class="btn primary" id="new-initiative" data-rgt-target="new-initiative">+ Nueva iniciativa</button></div>
  </div>
  <div class="board-help"><b>Cómo funciona:</b> arrastra una iniciativa entre RUN / GROW / TRANSFORM para cambiar su pilar. Cambia el estado desde la tarjeta. <b>BLOCKED sigue consumiendo WIP Transform.</b></div>
  <div class=board>
    ${PILLARS.map(p=>column(p,d.initiatives)).join("")}
  </div>
  <div class=callout><b>Regla WIP:</b> no se permite colocar una iniciativa Transform en IN_PROGRESS si ya existen 2 iniciativas Transform en IN_PROGRESS o BLOCKED.</div>`
}

function column(pillar,items){
  const list=items.filter(x=>x.pillar===pillar);
  const active=list.filter(x=>["IN_PROGRESS","BLOCKED"].includes(x.status)).length;
  const c=pillar.toLowerCase();
  return `<section class="rgt-column" data-pillar="${pillar}">
    <div class="colhead ${c}"><span>${pillar}</span><span>${active}${pillar==="TRANSFORM"?"/2":" active"}</span></div>
    <div class="stack" data-drop-pillar="${pillar}">
      ${list.length?list.map(card).join(""):"<div class=empty-drop>Suelta aquí una iniciativa</div>"}
    </div>
  </section>`
}

function card(x){
  return `<article class="card draggable-card" draggable="true" data-id="${esc(x.id)}" data-pillar="${x.pillar}">
    <div class="card-top"><span class=card-id>${esc(x.id)}</span><span class="status ${cls(x.status)}">${label(esc(x.status))}</span></div>
    <h3>${esc(x.title)}</h3><p>${esc(x.description)}</p>
    <button class="card-open" data-open-id="${esc(x.id)}">Abrir detalle →</button>
    <div class=cardfoot><span>${esc(x.owner)}</span><span>${x.is_must_win?"★ Must-Win":""}</span></div>
    <div class=card-actions>
      <label>Estado<select class="status-select" data-id="${esc(x.id)}">${STATUS.map(s=>`<option value="${s}" ${s===x.status?"selected":""}>${label(s)}</option>`).join("")}</select></label>
    </div>
  </article>`
}

export function bindBoard(){
  document.querySelectorAll(".draggable-card").forEach(card=>{
    card.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/rgt-id",card.dataset.id);card.classList.add("dragging")});
    card.addEventListener("dragend",()=>card.classList.remove("dragging"));
  });
  document.querySelectorAll("[data-drop-pillar]").forEach(zone=>{
    zone.addEventListener("dragover",e=>{e.preventDefault();zone.classList.add("drag-over")});
    zone.addEventListener("dragleave",()=>zone.classList.remove("drag-over"));
    zone.addEventListener("drop",async e=>{
      e.preventDefault();zone.classList.remove("drag-over");
      const id=e.dataTransfer.getData("text/rgt-id");
      await movePillar(id,zone.dataset.dropPillar);
    });
  });
  document.querySelectorAll(".status-select").forEach(select=>select.addEventListener("change",async e=>moveStatus(e.target.dataset.id,e.target.value)));
  document.querySelectorAll("[data-open-id]").forEach(btn=>btn.addEventListener("click",()=>openInitiativeDetail(btn.dataset.openId)));
  document.querySelector("#new-initiative")?.addEventListener("click",()=>openCreateInitiative());document.querySelector("#ai-copilot")?.addEventListener("click",()=>openInitiativeCopilot());
}

async function movePillar(id,pillar){
  const d=state.get(), task=d.initiatives.find(x=>x.id===id); if(!task||task.pillar===pillar)return;
  const candidate={...task,pillar};
  const check=validateFieldUpdate(task,{pillar},d);
  if(!check.allowed){toast(check.reason,"error");return}
  candidate.updated_at=new Date().toISOString();
  await db.put("initiatives",candidate);await db.put("activity",{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id:id,action:"PILLAR_CHANGED",detail:`${task.pillar} → ${pillar}`});
  state.set(await db.snapshot());requestRender();toast(`Iniciativa movida a ${pillar}.`,"success");
}

async function moveStatus(id,status){
  const d=state.get(), task=d.initiatives.find(x=>x.id===id); if(!task||task.status===status)return;
  let reason=null;
  if(status==="CANCELLED"){reason=prompt("Motivo de cancelación (obligatorio):")||"";}
  const check=validateTransition(task,status,d,{reason});
  if(!check.allowed){toast(check.reason,"error");requestRender();return}
  const candidate={...task,status,updated_at:new Date().toISOString()};
  if(status==="CANCELLED")candidate.cancellation_reason=reason.trim();
  if(status==="IN_PROGRESS"&&!task.started_at)candidate.started_at=new Date().toISOString();
  if(status==="DONE")candidate.completed_at=new Date().toISOString();
  await db.put("initiatives",candidate);
  await db.put("activity",{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id:id,action:"STATUS_CHANGED",detail:`${task.status} → ${status}`});
  state.set(await db.snapshot());requestRender();toast(check.reason,"success");
}

function toast(message,type){
  let el=document.querySelector("#rgt-toast");if(!el){el=document.createElement("div");el.id="rgt-toast";document.body.appendChild(el)}
  el.className=`toast ${type}`;el.textContent=message;clearTimeout(window.__rgtToast);window.__rgtToast=setTimeout(()=>el.remove(),3200)
}
