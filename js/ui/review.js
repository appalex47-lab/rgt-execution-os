import {requestRender} from "../core/events.js";
import {db} from "../db/indexedDB.js";
import {state} from "../core/state.js";
import {getActiveSprint} from "../engines/sprintEngine.js";
import {getReviewForSprint,getCarryOverCandidates,validateReviewInput,buildCarryOverIds} from "../engines/reviewEngine.js";

export function review(d){
 const s=getActiveSprint(d.sprints)||d.sprints.slice().sort((a,b)=>String(b.start_date||'').localeCompare(String(a.start_date||'')))[0];
 if(!s)return empty();
 const r=getReviewForSprint(d.reviews||[],s.id)||{};
 const candidates=getCarryOverCandidates(d.initiatives);
 const carry=new Set(r.carry_over_ids||buildCarryOverIds(d.initiatives));
 const inSprint=t=>{const x=String(t||'').slice(0,10);return x&&x>=String(s.start_date||'')&&x<=String(s.end_date||'')};const done=d.initiatives.filter(x=>x.status==='DONE'&&inSprint(x.completed_at)).length,block=d.initiatives.filter(x=>x.status==='BLOCKED').length;
 return `<div class=head><div><div class=eyebrow>Cierre semanal</div><h1>Weekly Review</h1><div class=sub>Captura el aprendizaje, decide qué continúa y conserva la identidad de cada iniciativa.</div></div><div><span class="status">Sprint ${esc(s.week_number)} · ${esc(s.status)}</span></div></div>
 <div class=grid3><div class=panel><small>Done en el Sprint</small><h2>${done}</h2></div><div class=panel><small>Bloqueadas</small><h2>${block}</h2></div><div class=panel><small>Carry-over</small><h2>${carry.size}</h2></div></div>
 <section class=panel style="margin-top:14px"><div class=section-head><div><h2>Preguntas de cierre</h2><div class=sub>El cierre requiere respuestas antes de guardar la revisión.</div></div><button class="btn primary" id="save-review">Guardar revisión</button></div><div class=formgrid>
 ${field('must_win_completed','¿Qué Must-Win se completó?',r.must_win_completed||'')}
 ${field('blocked_reason','¿Qué quedó bloqueado y por qué?',r.blocked_reason||'')}
 ${field('next_week','¿Qué continúa la próxima semana?',r.next_week||'')}
 ${field('learning','¿Qué aprendizaje queda registrado?',r.learning||'')}
 </div></section>
 <section class=panel style="margin-top:14px"><div class=section-head><div><h2>Carry-over</h2><div class=sub>Las iniciativas no terminadas conservan ID, historial, DoD y evidencia.</div></div><button class="btn primary" id="save-carry">Guardar carry-over</button></div>
 <div class="list">${candidates.length?candidates.map(i=>`<label class="mw-card ${i.pillar.toLowerCase()}" style="display:flex;gap:12px;align-items:flex-start"><input type="checkbox" data-carry="${esc(i.id)}" ${carry.has(i.id)?'checked':''}><span><b>${esc(i.id)} · ${esc(i.title)}</b><small>${esc(i.pillar)} · ${esc(i.status)}</small></span></label>`).join(''):'<div class=sub>No hay iniciativas elegibles para carry-over.</div>'}</div></section>
 <div class=callout><b>Regla:</b> Carry-over no duplica ni reinicia una iniciativa. La misma identidad continúa en el siguiente Sprint y su historial permanece trazable.</div>`;
}
function field(id,label,value){return `<div class="field full"><label>${label}</label><textarea id="review-${id}" rows="3" placeholder="Registrar respuesta...">${esc(value)}</textarea></div>`}
export function bindReview(){document.querySelector('#save-review')?.addEventListener('click',saveReview);document.querySelector('#save-carry')?.addEventListener('click',saveCarry)}
async function saveReview(){const d=state.get(),s=getActiveSprint(d.sprints)||d.sprints.slice(-1)[0];if(!s)return;const input={must_win_completed:q('#review-must_win_completed').value,blocked_reason:q('#review-blocked_reason').value,next_week:q('#review-next_week').value,learning:q('#review-learning').value};const v=validateReviewInput(input);if(!v.allowed)return toast(v.reason,'error');const old=getReviewForSprint(d.reviews||[],s.id)||{};const r={...old,id:old.id||crypto.randomUUID(),sprint_id:s.id,...input,updated_at:new Date().toISOString()};await db.put('reviews',r);await log(s.id,'WEEKLY_REVIEW_SAVED','Revisión semanal guardada');state.set(await db.snapshot());render();toast('Revisión guardada.','success')}
async function saveCarry(){const d=state.get(),s=getActiveSprint(d.sprints)||d.sprints.slice(-1)[0];if(!s)return;const ids=[...document.querySelectorAll('[data-carry]:checked')].map(x=>x.dataset.carry);const allowed=new Set(getCarryOverCandidates(d.initiatives).map(x=>x.id));if(ids.some(id=>!allowed.has(id)))return toast('Solo iniciativas READY, IN_PROGRESS o BLOCKED pueden continuar.','error');const old=getReviewForSprint(d.reviews||[],s.id)||{};const r={...old,id:old.id||crypto.randomUUID(),sprint_id:s.id,carry_over_ids:buildCarryOverIds(d.initiatives,[]).filter(id=>ids.includes(id)),updated_at:new Date().toISOString()};await db.put('reviews',r);await db.put('sprints',{...s,carry_over_ids:r.carry_over_ids,updated_at:new Date().toISOString()});await log(s.id,'CARRY_OVER_UPDATED',r.carry_over_ids.join(', ')||'Sin carry-over');state.set(await db.snapshot());render();toast('Carry-over guardado sin duplicar iniciativas.','success')}
function q(x){return document.querySelector(x)} function render(){requestRender()} function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))} function toast(message,type){let el=document.querySelector('#rgt-toast');if(!el){el=document.createElement('div');el.id='rgt-toast';document.body.appendChild(el)}el.className=`toast ${type}`;el.textContent=message;clearTimeout(window.__rgtToast);window.__rgtToast=setTimeout(()=>el.remove(),3500)} async function log(entity_id,action,detail){await db.put('activity',{id:crypto.randomUUID(),timestamp:new Date().toISOString(),entity_id,action,detail})}
function empty(){return `<section class=panel><h2>No hay Sprint</h2><p>Crea un Sprint desde Planning Semanal para habilitar Weekly Review.</p></section>`}
