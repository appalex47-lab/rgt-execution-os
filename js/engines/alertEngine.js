export function buildAlerts(d, now=new Date()){
 const s=d.sprints.find(x=>x.status==='ACTIVE')||d.sprints[0]; if(!s) return [];
 const a=[];
 const activeT=d.initiatives.filter(x=>x.pillar==='TRANSFORM'&&x.status==='IN_PROGRESS').length;
 const blockedT=d.initiatives.filter(x=>x.pillar==='TRANSFORM'&&x.status==='BLOCKED').length;
 const blocked=d.initiatives.filter(x=>x.status==='BLOCKED').length;
 const pendingDod=d.checklist.filter(x=>!x.is_completed).length;
 const pacing=s.monthly_target_revenue?Number(s.actual_revenue||0)/Number(s.monthly_target_revenue):null;
 const end=new Date(`${s.end_date}T23:59:59`);
 if(activeT+blockedT>2) a.push({id:'wip-over',level:'BLOCKER',title:'WIP TRANSFORM excedido',detail:`Hay ${activeT+blockedT} iniciativas consumiendo WIP y el máximo es 2.`});
 if(blocked>0) a.push({id:'blocked',level:'WARNING',title:'Trabajo bloqueado',detail:`Hay ${blocked} iniciativa(s) bloqueada(s) que requieren decisión o desbloqueo.`});
 if(pendingDod>0) a.push({id:'dod',level:'INFO',title:'DoD pendiente',detail:`Hay ${pendingDod} elemento(s) de Definition of Done sin completar.`});
 if(pacing!==null && pacing<0.8) a.push({id:'pacing-low',level:'WARNING',title:'Pacing por debajo del umbral',detail:`El pacing comercial registrado es ${(pacing*100).toFixed(1)}%.`});
 if(s.status==='ACTIVE' && end<now) a.push({id:'sprint-overdue',level:'BLOCKER',title:'Sprint vencido',detail:'El Sprint activo terminó por fecha y requiere cierre/revisión.'});
 const mw=Array.isArray(s.must_win_ids)?s.must_win_ids.length:0;
 if(mw<3) a.push({id:'must-win',level:'WARNING',title:'Must-Win incompletos',detail:`Hay ${mw}/3 Must-Win definidos.`});
 return a;
}
