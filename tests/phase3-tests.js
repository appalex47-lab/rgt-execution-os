import {canStartTaskReady} from "../js/engines/readyEngine.js";
import {canCompleteTask} from "../js/engines/dodEngine.js";
import {canStartTask} from "../js/engines/wipEngine.js";
const completeTask={id:"T",title:"Task",description:"Problem",pillar:"TRANSFORM",objective:"Obj",success_criteria:"Success",owner:"Owner",dependencies:"Ninguna",status:"BACKLOG",evidence_required:true};
const dod=[{id:"D",task_id:"T",category:"DOD",description:"Validar",required:true,is_completed:true}];
const tests=[
 ["Ready completo",canStartTaskReady(completeTask,dod).allowed],
 ["Ready bloquea campos faltantes",!canStartTaskReady({...completeTask,objective:""},dod).allowed],
 ["WIP cuenta BLOCKED",!canStartTask({...completeTask,status:"IN_PROGRESS"},[{pillar:"TRANSFORM",status:"IN_PROGRESS"},{pillar:"TRANSFORM",status:"BLOCKED"}]).allowed],
 ["DoD incompleto bloquea DONE",!canCompleteTask(completeTask,[{...dod[0],is_completed:false}],[]).allowed],
 ["Evidencia requerida bloquea DONE",!canCompleteTask(completeTask,dod,[]).allowed],
 ["DoD + evidencia permiten DONE",canCompleteTask(completeTask,dod,[{id:"E",task_id:"T"}]).allowed]
];
const failed=tests.filter(x=>!x[1]);document.body.innerHTML=`<h1>Fase 3 — pruebas</h1>${tests.map(x=>`<p>${x[1]?"✅":"❌"} ${x[0]}</p>`).join("")}`;if(failed.length)throw new Error(failed.map(x=>x[0]).join(", "));
