import {requestRender} from "../core/events.js";
import {db} from "../db/indexedDB.js";
import {state} from "../core/state.js";

const DURATION=120*60;
let lastTs=0, acc=0;
let timer=null, elapsed=0, running=false, startedAt=null, activeId=null, notes="";

export function deepWork(d){
  const candidates=d.initiatives.filter(i=>i.status==="IN_PROGRESS"&&(i.pillar==="TRANSFORM"||i.pillar==="GROW"));
  const x=candidates.find(i=>i.pillar==="TRANSFORM")||candidates.find(i=>i.pillar==="GROW");
  const active=d.deepWork.find(s=>s.status==="IN_PROGRESS");
  const current=active?d.initiatives.find(i=>i.id===active.task_id):x;
  if(active&&!running){ elapsed=Number(active.elapsed_seconds||0); activeId=active.id; startedAt=active.started_at; notes=active.notes||""; }
  const seconds=Math.min(DURATION,elapsed);
  return `<div class="head" data-rgt-target="deep-work-header"><div><div class="eyebrow">Focus protegido</div><h1>Deep Work</h1><div class="sub">Bloque de 120 minutos para trabajo estratégico. TRANSFORM tiene prioridad sobre GROW.</div></div><div><button class="btn dark" id="focus-toggle">${active?"Modo foco activo":"Entrar a modo foco"}</button></div></div>
  <section class="panel timer" id="deep-work-panel"><div class="eyebrow">${current?.pillar||"Sin iniciativa elegible"}</div><h2>${esc(current?.title||"No hay iniciativa estratégica activa")}</h2><p class="sub">${esc(current?.success_criteria||"Activa una iniciativa TRANSFORM o GROW en el Board para comenzar.")}</p><strong id="dw-clock">${fmt(DURATION-seconds)}</strong><div class="modal-actions"><button class="btn primary" id="dw-start" ${current?"":"disabled"}>▶ ${active?"Reanudar":"Iniciar 120 min"}</button><button class="btn" id="dw-pause" ${active?"":"disabled"}>Ⅱ Pausar</button><button class="btn" id="dw-end" ${active?"":"disabled"}>■ Finalizar</button></div><div class="field" style="max-width:700px;margin:18px auto 0;text-align:left"><label>Notas / evidencia de la sesión</label><textarea id="dw-notes" rows="3" placeholder="Qué ejecutaste, qué verificaste o qué evidencia quedó registrada...">${esc(notes)}</textarea></div></section>
  <section class="panel" style="margin-top:14px"><h2>Sesiones recientes</h2>${d.deepWork.filter(s=>s.status!=="IN_PROGRESS").slice(-8).reverse().map(s=>{const i=d.initiatives.find(x=>x.id===s.task_id);return `<div class="row"><span>${esc(i?.id||s.task_id)} · ${esc(i?.title||"Iniciativa")}</span><b>${Number(s.actual_minutes||0)} min · ${esc(s.status)}</b></div>`}).join("")||`<div class="sub">Todavía no hay sesiones finalizadas.</div>`}</section>
  <div class="callout"><b>Reglas:</b> Deep Work no acepta RUN, BLOCKED ni trabajo administrativo. La sesión se registra contra una iniciativa real y puede pausarse/reanudarse sin perder el tiempo acumulado.</div>`;
}

export function bindDeepWork(){
  document.querySelector("#dw-start")?.addEventListener("click",startOrResume);
  document.querySelector("#dw-pause")?.addEventListener("click",pause);
  document.querySelector("#dw-end")?.addEventListener("click",()=>finish(false));
  document.querySelector("#focus-toggle")?.addEventListener("click",toggleFocus);
  document.querySelector("#dw-notes")?.addEventListener("input",e=>notes=e.target.value);
  const active=state.get().deepWork.find(s=>s.status==="IN_PROGRESS");
  if(active&&!activeId){activeId=active.id;elapsed=Number(active.elapsed_seconds||0);startedAt=active.started_at;running=false;}
}
async function startOrResume(){
  const d=state.get();let s=activeId?d.deepWork.find(x=>x.id===activeId):null;
  if(!s){
    const candidates=d.initiatives.filter(i=>i.status==="IN_PROGRESS"&&(i.pillar==="TRANSFORM"||i.pillar==="GROW"));
    const i=candidates.find(x=>x.pillar==="TRANSFORM")||candidates.find(x=>x.pillar==="GROW");
    if(!i)return toast("No hay una iniciativa TRANSFORM o GROW elegible en IN_PROGRESS.","error");
    s={id:crypto.randomUUID(),task_id:i.id,status:"IN_PROGRESS",started_at:new Date().toISOString(),elapsed_seconds:0,actual_minutes:0,notes:""};
    await db.put("deepWork",s);await db.put("activity",{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id:i.id,action:"DEEP_WORK_STARTED",detail:"Sesión de 120 minutos iniciada"});
    activeId=s.id;elapsed=0;startedAt=s.started_at;notes="";state.set(await db.snapshot());
  }
  running=true;startTick();render();
}
function startTick(){clearInterval(timer);lastTs=Date.now();acc=0;timer=setInterval(()=>{if(!running)return;const now=Date.now();acc+=(now-lastTs)/1000;lastTs=now;const whole=Math.floor(acc);if(!whole)return;acc-=whole;elapsed=Math.min(DURATION,elapsed+whole);const clock=document.querySelector("#dw-clock");if(clock)clock.textContent=fmt(DURATION-elapsed);if(elapsed>=DURATION)finish(true)},500)}
async function pause(){if(!activeId)return;running=false;clearInterval(timer);await persistActive();toast("Sesión pausada.","success");render()}
async function finish(auto){if(!activeId)return;running=false;clearInterval(timer);await persistActive();const d=state.get(),s=d.deepWork.find(x=>x.id===activeId);if(!s)return;const final={...s,status:"COMPLETED",auto_completed:Boolean(auto),ended_at:new Date().toISOString(),elapsed_seconds:Math.min(DURATION,elapsed),actual_minutes:Math.round(elapsed/60),notes:document.querySelector("#dw-notes")?.value??notes};await db.put("deepWork",final);await db.put("activity",{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id:s.task_id,action:"DEEP_WORK_COMPLETED",detail:`Sesión finalizada: ${final.actual_minutes} min`});activeId=null;elapsed=0;startedAt=null;notes="";toast(auto?"Deep Work completó los 120 minutos.":"Sesión finalizada y registrada.","success");state.set(await db.snapshot());render()}
async function persistActive(){const d=state.get(),s=d.deepWork.find(x=>x.id===activeId);if(!s)return;const now=new Date().toISOString();await db.put("deepWork",{...s,elapsed_seconds:Math.min(DURATION,elapsed),actual_minutes:Math.round(elapsed/60),notes:document.querySelector("#dw-notes")?.value??notes,updated_at:now});state.set(await db.snapshot())}
function toggleFocus(){document.body.classList.toggle("focus-mode");const active=document.body.classList.contains("focus-mode");const b=document.querySelector("#focus-toggle");if(b)b.textContent=active?"Salir de modo foco":"Entrar a modo foco"}
function render(){requestRender()}
function fmt(s){const m=Math.floor(Math.max(0,s)/60),sec=Math.max(0,s)%60;return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(message,type){let el=document.querySelector("#rgt-toast");if(!el){el=document.createElement("div");el.id="rgt-toast";document.body.appendChild(el)}el.className=`toast ${type}`;el.textContent=message;clearTimeout(window.__rgtToast);window.__rgtToast=setTimeout(()=>el.remove(),3500)}
