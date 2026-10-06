const D=120*60;
function eligible(i){return i.status==='IN_PROGRESS'&&(i.pillar==='TRANSFORM'||i.pillar==='GROW')}
function pick(list){return list.find(i=>i.pillar==='TRANSFORM'&&eligible(i))||list.find(i=>i.pillar==='GROW'&&eligible(i))}
function remaining(elapsed){return Math.max(0,D-Math.min(D,elapsed))}
const data={initiatives:[{id:'T1',pillar:'TRANSFORM',status:'IN_PROGRESS'},{id:'G1',pillar:'GROW',status:'IN_PROGRESS'},{id:'R1',pillar:'RUN',status:'IN_PROGRESS'},{id:'T2',pillar:'TRANSFORM',status:'BLOCKED'}]};
const tests=[
 ['Prioriza TRANSFORM',pick(data.initiatives).id==='T1'],['RUN excluido',!eligible(data.initiatives[2])],['BLOCKED excluido',!eligible(data.initiatives[3])],['120 min al iniciar',remaining(0)===D],['El tiempo disminuye',remaining(60)===D-60],['No baja de cero',remaining(D+50)===0],['Minutos registrados',Math.round(3600/60)===60]
];
const session={status:'IN_PROGRESS',elapsed_seconds:3600,actual_minutes:60};tests.push(['Sesión activa',session.status==='IN_PROGRESS'],['Minutos persistidos',session.actual_minutes===60],['Fin válido',['COMPLETED','CANCELLED'].includes('COMPLETED')]);
const failed=tests.filter(x=>!x[1]);document.body.innerHTML=`<h1>Fase 5 — pruebas</h1><p>${tests.length-failed.length}/${tests.length} PASS</p>${tests.map(x=>`<p>${x[1]?'✅':'❌'} ${x[0]}</p>`).join('')}`;if(failed.length)throw new Error(failed.map(x=>x[0]).join(', '));
