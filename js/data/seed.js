const S={sprints:[{id:"S40",week_number:40,year:2026,target_revenue:1200000,actual_revenue:740000,target_aov:900,actual_aov:850,target_cr:.015,actual_cr:.0145}],initiatives:[
{id:"R001",title:"QA Checkout & Pasarelas",description:"Validar checkout y pagos.",pillar:"RUN",status:"IN_PROGRESS",owner:"Analista",priority:"Alta",is_must_win:true,objective:"Eliminar errores críticos en checkout.",success_criteria:"Checkout sin errores críticos",dependencies:"Ninguna",evidence_required:true},
{id:"R002",title:"Sync Inventario ERP",description:"Resolver diferencia de inventario.",pillar:"RUN",status:"BLOCKED",owner:"Analista",priority:"Alta",is_must_win:false,objective:"Sincronizar disponibilidad entre ERP y canal digital.",success_criteria:"Stock actualizado < 2h",dependencies:"Actualización ERP",evidence_required:false},
{id:"G001",title:"Cross-sell AOV PDP",description:"Aumentar AOV desde PDP.",pillar:"GROW",status:"IN_PROGRESS",owner:"Growth",priority:"Alta",is_must_win:true,objective:"Incrementar valor de pedido mediante cross-sell.",success_criteria:"AOV +$80",dependencies:"Diseño PDP",evidence_required:true},
{id:"G002",title:"Optimización Banners",description:"Optimizar módulos promocionales.",pillar:"GROW",status:"READY",owner:"Marketing",priority:"Media",is_must_win:false,objective:"Mejorar interacción con módulos promocionales.",success_criteria:"CTR +15%",dependencies:"Ninguna",evidence_required:false},
{id:"T001",title:"Data Layer Purchase GTM",description:"Implementar y validar Purchase.",pillar:"TRANSFORM",status:"IN_PROGRESS",owner:"Dev",priority:"Alta",is_must_win:true,objective:"Asegurar tracking completo de Purchase.",success_criteria:"Purchase validado en destino",dependencies:"GTM Container",evidence_required:true},
{id:"T002",title:"Meta Pixel Conversion API",description:"Eventos server-side.",pillar:"TRANSFORM",status:"IN_PROGRESS",owner:"Dev",priority:"Alta",is_must_win:false,objective:"Mejorar cobertura de conversiones.",success_criteria:"Eventos >95%",dependencies:"Acceso Meta",evidence_required:true},
{id:"T003",title:"CRO Checkout",description:"Proyecto estructural de conversión.",pillar:"TRANSFORM",status:"BACKLOG",owner:"UX",priority:"Media",is_must_win:false,objective:"Mejorar conversión del checkout.",success_criteria:"CR +0.15 pp",dependencies:"Baseline CR",evidence_required:true} ],
checklist:[
{id:"C1",task_id:"R001",category:"DOD",description:"Checkout probado en flujo completo",required:true,is_completed:true},
{id:"C2",task_id:"T001",category:"DOD",description:"Variables declaradas",required:true,is_completed:true},
{id:"C3",task_id:"T001",category:"DOD",description:"Payload validado",required:true,is_completed:false},
{id:"C4",task_id:"T001",category:"DOD",description:"Validación en producción",required:true,is_completed:false},
{id:"C5",task_id:"G001",category:"DOD",description:"Resultado del experimento medido",required:true,is_completed:false},
{id:"C6",task_id:"G002",category:"DOD",description:"Baseline CTR documentado",required:true,is_completed:false} ],
evidence:[{id:"E1",task_id:"T001",type:"URL",url_or_reference:"https://tagassistant.google.com/"}],
deepWork:[{id:"DW1",task_id:"T001",planned_minutes:120,actual_minutes:110,status:"COMPLETED"}],
activity:[{id:"A1",timestamp:"2026-09-30T09:50:00",entity_id:"T001",action:"DEEP_WORK_COMPLETED",detail:"110 minutos"}]};
export async function seed(db){let x=await db.snapshot();if(Object.values(x).some(a=>a.length))return;for(const [s,items] of Object.entries(S))for(const x of items)await db.put(s,x)}