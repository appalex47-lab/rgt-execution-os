import assert from "node:assert/strict";
import {buildHomeBriefContext,buildHomeBriefPrompt,HOME_BRIEF_SCHEMA} from "../js/ai/homeBrief.js";
const snapshot={sprints:[{id:"S1",status:"ACTIVE",week_number:40,must_win_ids:["R1","G1","T1"]}],initiatives:[
{id:"R1",title:"QA checkout",pillar:"RUN",status:"READY",owner:"Ana",priority:"Alta",success_criteria:"Validar checkout"},
{id:"G1",title:"CRO",pillar:"GROW",status:"IN_PROGRESS",owner:"Ana",priority:"Media",success_criteria:"Mejorar conversión"},
{id:"T1",title:"Data Layer",pillar:"TRANSFORM",status:"IN_PROGRESS",owner:"Ana",priority:"Alta",success_criteria:"Cobertura validada"},
{id:"T2",title:"Automatización",pillar:"TRANSFORM",status:"BLOCKED",owner:"Ana",priority:"Media",success_criteria:"Flujo operativo"}],checklist:[{task_id:"R1",category:"DOD",is_completed:false},{task_id:"G1",category:"DOD",is_completed:true}],evidence:[],deepWork:[],reviews:[],activity:[]};
const ctx=buildHomeBriefContext(snapshot,"2026-10-02");
assert.equal(ctx.date,"2026-10-02");assert.equal(ctx.must_win.items.length,3);assert.equal(ctx.blocked.items.length,1);assert.equal(ctx.execution_health.wip_transform,2);assert.equal(ctx.deep_work.candidates.length,2);
const prompt=buildHomeBriefPrompt(snapshot,ctx);assert.match(prompt,/No uses ni calcules Pacing, Forecast, Reforecast o Recovery/);assert.match(prompt,/Nada se ejecuta|No crear, editar, completar, cancelar ni iniciar/i);
assert.deepEqual(Object.keys(HOME_BRIEF_SCHEMA.properties).sort(),["attention","headline","must_win","next_actions","note"].sort());
console.log("PHASE AI-6 TESTS: PASS");
