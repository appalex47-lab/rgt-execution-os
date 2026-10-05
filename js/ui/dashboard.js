import {homeBrief} from "./homeBrief.js";
import {getActiveSprint} from "../engines/sprintEngine.js";
import {getMustWinIds} from "../engines/mustWinEngine.js";
import {getTransformWip,WIP_LIMIT} from "../engines/wipEngine.js";
import {esc} from "../core/html.js";

/** Commercial values are rendered exactly as received from RevNavigator. RGT never derives them. */
const show=(v,fmt=x=>x)=>v==null?"—":esc(fmt(v));
const money=n=>"$"+Number(n).toLocaleString("es-MX",{maximumFractionDigits:0});

export function commercialPanel(ctx){
 if(!ctx)return `<section class="panel commercial-context empty-commercial"><div class=section-head><h2>Contexto comercial</h2><span class=status>RevNavigator</span></div><p class=sub>Sin contexto comercial. RevNavigator es la fuente de verdad de target, actual, pacing, forecast y recovery; RGT no los calcula.</p></section>`;
 return `<section class="panel commercial-context"><div class=section-head><h2>Contexto comercial</h2><span class=status>Fuente: ${esc(ctx.source)}</span></div>
 <div class=kpis><div class=kpi><small>Periodo</small><strong>${show(ctx.period)}</strong></div><div class=kpi><small>Target</small><strong>${show(ctx.target,money)}</strong></div><div class=kpi><small>Actual</small><strong>${show(ctx.actual,money)}</strong></div><div class=kpi><small>Estado de pacing</small><strong>${show(ctx.pacingStatus)}</strong></div><div class=kpi><small>Forecast</small><strong>${show(ctx.forecast,money)}</strong></div><div class=kpi><small>Recovery requerido</small><strong>${show(ctx.recoveryRequired,v=>typeof v==="number"?money(v):(v?"Sí":"No"))}</strong></div></div>
 ${ctx.channels?.length?`<div class=sub>Canales: ${ctx.channels.map(c=>esc(typeof c==="string"?c:(c?.name??c?.channel??JSON.stringify(c)))).join(" · ")}</div>`:""}
 ${ctx.asOf?`<div class=mini>Actualizado: ${esc(ctx.asOf)}</div>`:""}</section>`;
}

export function dashboard(d){
 const s=getActiveSprint(d.sprints)||d.sprints[0]||{},ids=getMustWinIds(s,d.initiatives),i=d.initiatives,w=getTransformWip(i),b=i.filter(x=>x.status==="BLOCKED").length,dd=d.checklist.filter(x=>!x.is_completed).length;
 return `<div class=head><div><div class=eyebrow>Centro de Control</div><h1>Command Center</h1><div class=sub>La operación debe decirte dónde poner atención, no solo mostrar información.</div></div><div><button class="btn dark" data-go="deep-work">◉ Iniciar Deep Work</button> <button class="btn primary" data-go="planning">Planning Semanal</button></div></div>
 ${commercialPanel(d.externalPacing)}
 ${homeBrief(d)}
 <div class=grid2 style="margin-top:14px"><section class=panel><div class=section-head><h2>Must-Win Battles</h2><span class=status>${ids.length}/3 definidas</span></div><div class=battles>${["RUN","GROW","TRANSFORM"].map(pillar=>{let x=ids.map(id=>i.find(a=>a.id===id)).find(a=>a?.pillar===pillar);return `<div class="battle ${pillar.toLowerCase()}"><b>${pillar}</b><h3>${esc(x?.title||"Sin Must-Win")}</h3><p>${esc(x?.success_criteria||"Configura el Battle en Planning Semanal.")}</p></div>`}).join("")}</div></section>
 <section class=panel><h2>Attention Required</h2><div class=row><span>WIP Transform</span><b>${w}/${WIP_LIMIT}</b></div><div class=row><span>Bloqueadas</span><b>${b}</b></div><div class=row><span>DoD pendientes</span><b>${dd}</b></div></section></div>
 <div class=grid2 style="margin-top:14px"><section class=panel><h2>Estado RGT</h2>${["RUN","GROW","TRANSFORM"].map(pillar=>`<div class=row><span>${pillar}</span><b>${i.filter(x=>x.pillar===pillar&&x.status==="IN_PROGRESS").length} active · ${i.filter(x=>x.pillar===pillar&&x.status==="BLOCKED").length} blocked</b></div>`).join("")}</section>
 <section class=panel><h2>Sprint ${esc(s.status==="ACTIVE"?"ACTIVE":"CLOSED")} · Semana ${esc(s.week_number||"—")}</h2><div class=row><span>Periodo</span><b>${esc(s.start_date||"—")} → ${esc(s.end_date||"—")}</b></div></section></div>`;
}
