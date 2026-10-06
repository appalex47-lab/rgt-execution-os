import * as sprintEngine from "../js/engines/sprintEngine.js";
import {getActiveSprint,validateNewSprint,validateSprintUpdate} from "../js/engines/sprintEngine.js";
import {validateMustWins,getEligibleByPillar} from "../js/engines/mustWinEngine.js";
const initiatives=[
{id:"R",title:"Run",pillar:"RUN",status:"IN_PROGRESS"},
{id:"G",title:"Grow",pillar:"GROW",status:"READY"},
{id:"T",title:"Transform",pillar:"TRANSFORM",status:"IN_PROGRESS"},
{id:"R2",title:"Run 2",pillar:"RUN",status:"READY"},
{id:"D",title:"Done",pillar:"RUN",status:"DONE"}
];
const active={id:"S1",status:"ACTIVE",week_number:40,start_date:"2026-10-01",end_date:"2026-10-07",month_start:"2026-10-01",month_end:"2026-10-31",monthly_target_revenue:3100000,actual_revenue:930000,target_revenue:700000};
const closed={id:"S0",status:"CLOSED"};
const tests=[
["Detecta Sprint ACTIVE",getActiveSprint([closed,active])?.id==="S1"],
["Nuevo Sprint bloquea segundo ACTIVE",!validateNewSprint([active],{week_number:41,start_date:"2026-10-08",end_date:"2026-10-14"}).allowed],
["Nuevo Sprint permite si no hay ACTIVE",validateNewSprint([closed],{week_number:41,start_date:"2026-10-08",end_date:"2026-10-14"}).allowed],
["RGT no calcula pacing (vive en RevNavigator)",!("calculatePacing" in sprintEngine)],
["No permite activar si otro ACTIVE",!validateSprintUpdate([active,{id:"S2",status:"CLOSED"}],"S2",{status:"ACTIVE"}).allowed],
["Must-Win exige 3",!validateMustWins(["R","G"],initiatives).allowed],
["Must-Win exige un pilar de cada (dos RUN no valen)",!validateMustWins(["R","R2","G"],initiatives).allowed],
["Must-Win válido 1 por pilar",validateMustWins(["R","G","T"],initiatives).allowed],
["Done no es elegible",getEligibleByPillar(initiatives,"RUN").every(x=>x.status!=="DONE")]
];
const failed=tests.filter(x=>!x[1]);document.body.innerHTML=`<h1>Fase 4 — pruebas</h1>${tests.map(x=>`<p>${x[1]?"✅":"❌"} ${x[0]}</p>`).join("")}`;if(failed.length)throw new Error(failed.map(x=>x[0]).join(", "));
