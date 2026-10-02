import {db} from "../db/indexedDB.js";
import {state} from "../core/state.js";
import {validateStatusChange,getTransformWip} from "../engines/wipEngine.js";
import {openInitiativeDetail,openCreateInitiative} from "./initiativeDetail.js";

const STATUS=["BACKLOG","READY","IN_PROGRESS","BLOCKED","DONE","CANCELLED"];
const PILLARS=["RUN","GROW","TRANSFORM"];

function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function label(s){return s.replaceAll("_"," ")}
function cls(s){return s.toLowerCase().replaceAll("_","-")}

export function board(d){
  const transformWip=getTransformWip(d.initiatives);
  return `<div class=head>
    <div><div class=eyebrow>Ejecución</div><h1>RGT Board</h1><div class=sub>RGT es el pilar. El estado controla el ciclo de ejecución.</div></div>
    <div><span class="wip-chip ${transformWip>=2?"wip-full":""}">TRANSFORM WIP <b>${transformWip}/2</b></span> <button class="btn primary" id="new-initiative">+ Nueva iniciativa</button></div>
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
  document.querySelector("#new-initiative")?.addEventListener("click",()=>openCreateInitiative());
}

async function movePillar(id,pillar){
  const d=state.get(), task=d.initiatives.find(x=>x.id===id); if(!task||task.pillar===pillar)return;
  const candidate={...task,pillar};
  const check=validateStatusChange(candidate,candidate.status,d.initiatives);
  if(!check.allowed){toast(check.reason,"error");return}
  candidate.updated_at=new Date().toISOString();
  await db.put("initiatives",candidate);await db.put("activity",{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id:id,action:"PILLAR_CHANGED",detail:`${task.pillar} → ${pillar}`});
  state.set(await db.snapshot());window.dispatchEvent(new Event("rgt:render"));toast(`Iniciativa movida a ${pillar}.`,"success");
}

async function moveStatus(id,status){
  const d=state.get(), task=d.initiatives.find(x=>x.id===id); if(!task||task.status===status)return;
  const check=validateStatusChange(task,status,d.initiatives);
  if(!check.allowed){toast(check.reason,"error");window.dispatchEvent(new Event("rgt:render"));return}
  const candidate={...task,status,updated_at:new Date().toISOString()};
  if(status==="IN_PROGRESS"&&!task.started_at)candidate.started_at=new Date().toISOString();
  if(status==="DONE")candidate.completed_at=new Date().toISOString();
  await db.put("initiatives",candidate);
  await db.put("activity",{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id:id,action:"STATUS_CHANGED",detail:`${task.status} → ${status}`});
  state.set(await db.snapshot());window.dispatchEvent(new Event("rgt:render"));toast(check.reason,"success");
}

function toast(message,type){
  let el=document.querySelector("#rgt-toast");if(!el){el=document.createElement("div");el.id="rgt-toast";document.body.appendChild(el)}
  el.className=`toast ${type}`;el.textContent=message;clearTimeout(window.__rgtToast);window.__rgtToast=setTimeout(()=>el.remove(),3200)
}
