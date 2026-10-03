import {getExecutionHealth} from '../engines/executionHealthEngine.js';
export function executionHealth(d){
 const h=getExecutionHealth(d);
 const labels={STABLE:'ESTABLE',ATTENTION:'ATENCIÓN',AT_RISK:'RIESGO OPERATIVO'};
 return `<div class="head"><div><div class="eyebrow">Control de ejecución</div><h1>Execution Health</h1><div class="sub">Lectura determinística de capacidad, flujo, entrega y foco. No sustituye el diagnóstico comercial.</div></div><button class="btn primary" data-go="dashboard">← Command Center</button></div>
 <section class="health-hero ${h.status.toLowerCase()}"><div><small>Estado de ejecución</small><strong>${labels[h.status]}</strong></div><div class="health-score">${Math.round(h.score*100)}<span>/100</span></div></section>
 <div class="grid2 health-grid">${Object.values(h.dimensions).map(x=>`<section class="panel health-dimension"><div class="section-head"><h2>${x.label}</h2><b>${Math.round(x.value*100)}%</b></div><div class="health-bar"><i style="width:${Math.round(x.value*100)}%"></i></div><p>${x.detail}</p></section>`).join('')}</div>
 <section class="panel" style="margin-top:14px"><h2>Lectura operativa</h2><div class="row"><span>WIP TRANSFORM</span><b>${h.wip}/2</b></div><div class="row"><span>Iniciativas bloqueadas</span><b>${h.blocked}</b></div><div class="row"><span>DoD pendientes</span><b>${h.dodPending}</b></div><div class="row"><span>Must-Win completados</span><b>${h.mwDone}/${h.mwTotal||3}</b></div></section>
 <div class="callout"><b>Cómo usar esta vista:</b> Execution Health no crea tareas ni cambia prioridades automáticamente. Sirve para identificar dónde está la fricción de ejecución y volver al Command Center, Board o Weekly Review para actuar.</div></section>`;
}
