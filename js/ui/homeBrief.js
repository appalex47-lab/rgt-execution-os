import {state} from "../core/state.js";
import {generateHomeBrief} from "../ai/homeBrief.js";
import {isAIConfigured} from "../ai/aiConfig.js";

export function homeBrief(){return `<section class="panel home-brief"><div class="section-head"><div><div class="eyebrow">Inteligencia operativa</div><h2>Briefing del Command Center</h2><p class="sub">RGT calcula el estado. Cohere lo convierte en una lectura ejecutiva. Nada se ejecuta desde aquí.</p></div><button class="btn dark" id="generate-home-brief">✦ Generar briefing</button></div><div id="home-brief-content"><div class="home-brief-empty">Genera un briefing para convertir el estado actual de RGT en una lectura rápida de atención y siguientes pasos.</div></div></section>`}

export function bindHomeBrief(){document.querySelector("#generate-home-brief")?.addEventListener("click",generate);}

async function generate(){const box=document.querySelector("#home-brief-content"),button=document.querySelector("#generate-home-brief");if(!isAIConfigured()){box.innerHTML=`<div class="assistant-error">Configura primero tu API de Cohere en <b>IA / Cohere</b>.</div>`;return;}button.disabled=true;box.innerHTML=`<div class="home-brief-loading">Analizando el estado determinístico de RGT…</div>`;try{const {brief}=await generateHomeBrief(state.get());box.innerHTML=renderBrief(brief);}catch(e){box.innerHTML=`<div class="assistant-error">No se pudo generar el briefing: ${esc(e.message)}</div>`;}finally{button.disabled=false;}}
function renderBrief(b){return `<div class="brief-headline"><strong>${esc(b.headline)}</strong></div><div class="grid3"><div><h3>Atención</h3>${list(b.attention)}</div><div><h3>Must-Win</h3>${list(b.must_win)}</div><div><h3>Siguientes pasos</h3>${list(b.next_actions)}</div></div>${b.note?`<div class="callout">${esc(b.note)}</div>`:""}`}
function list(items=[]){return items.length?`<ul class="brief-list">${items.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<p class="sub">Sin elementos reportados.</p>`}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c))}
