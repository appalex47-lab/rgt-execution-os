import {canStartTask,getTransformWip} from "../js/engines/wipEngine.js";
const cases=[
  ["1 Transform active permite iniciar",canStartTask({id:"3",pillar:"TRANSFORM",status:"IN_PROGRESS"},[{id:"1",pillar:"TRANSFORM",status:"IN_PROGRESS"},{id:"2",pillar:"TRANSFORM",status:"READY"}]).allowed],
  ["2 Transform activos bloquean",!canStartTask({id:"3",pillar:"TRANSFORM",status:"IN_PROGRESS"},[{id:"1",pillar:"TRANSFORM",status:"IN_PROGRESS"},{id:"2",pillar:"TRANSFORM",status:"IN_PROGRESS"}]).allowed],
  ["1 active + 1 blocked bloquean",!canStartTask({id:"3",pillar:"TRANSFORM",status:"IN_PROGRESS"},[{id:"1",pillar:"TRANSFORM",status:"IN_PROGRESS"},{id:"2",pillar:"TRANSFORM",status:"BLOCKED"}]).allowed],
  ["Blocked cuenta como WIP",getTransformWip([{pillar:"TRANSFORM",status:"BLOCKED"},{pillar:"TRANSFORM",status:"READY"}])===1],
  ["RUN no tiene límite rígido",canStartTask({id:"3",pillar:"RUN",status:"IN_PROGRESS"},[{id:"1",pillar:"RUN",status:"IN_PROGRESS"},{id:"2",pillar:"RUN",status:"IN_PROGRESS"}]).allowed],
  ["DONE libera WIP",canStartTask({id:"3",pillar:"TRANSFORM",status:"IN_PROGRESS"},[{id:"1",pillar:"TRANSFORM",status:"DONE"},{id:"2",pillar:"TRANSFORM",status:"IN_PROGRESS"}]).allowed]
];
document.body.innerHTML=`<h1>RGT Fase 2 — Smoke Tests</h1><p>${cases.filter(x=>x[1]).length}/${cases.length} PASS</p>`+cases.map(x=>`<p>${x[1]?"✅":"❌"} ${x[0]}</p>`).join("");
