import assert from "node:assert/strict";
import {buildAIContext,AI_TOOLS,isAIWriteAllowed} from "../js/ai/aiContract.js";
import {getMustWin,getBlockedInitiatives,getExecutionHealth,getDeepWorkCandidates,getTodayTasks,resolveAssistantContext} from "../js/ai/assistantTools.js";
import {ASSISTANT_RESPONSE_SCHEMA,buildAssistantPrompt} from "../js/ai/rgtAssistant.js";
const snapshot={sprints:[{id:"S1",status:"ACTIVE",week_number:40,must_win_ids:["R1","G1","T1"]}],initiatives:[
{id:"R1",title:"Run",pillar:"RUN",status:"IN_PROGRESS",is_must_win:true},{id:"G1",title:"Grow",pillar:"GROW",status:"READY",is_must_win:true},{id:"T1",title:"Transform",pillar:"TRANSFORM",status:"IN_PROGRESS",is_must_win:true},{id:"T2",title:"Blocked",pillar:"TRANSFORM",status:"BLOCKED"}],checklist:[{id:"c1",task_id:"T1",category:"DOD",is_completed:false}],evidence:[],reviews:[],deep_work:[],activity:[]};
assert.equal(typeof getMustWin(snapshot).items.length,"number");assert.equal(getMustWin(snapshot).items.length,3);
assert.equal(getBlockedInitiatives(snapshot).items[0].id,"T2");
assert.equal(getExecutionHealth(snapshot).wip_transform,2);assert.equal(getExecutionHealth(snapshot).wip_status,"WITHIN_LIMIT");
assert.equal(getDeepWorkCandidates(snapshot).candidates[0].pillar,"TRANSFORM");
assert.equal(getTodayTasks(snapshot).mode,"ACTIVE_SPRINT_FALLBACK");
assert.equal(resolveAssistantContext(snapshot,"¿Qué está bloqueado?").tool,"getBlockedInitiatives");
assert.equal(resolveAssistantContext(snapshot,"¿Qué puedo hacer en Deep Work?").tool,"getDeepWorkCandidates");
assert.equal(AI_TOOLS.getExecutionHealth.permission,"READ");assert.equal(isAIWriteAllowed("getExecutionHealth"),false);
const prompt=buildAssistantPrompt("¿Qué está bloqueado?","getBlockedInitiatives",getBlockedInitiatives(snapshot),snapshot);assert.match(prompt,/SOLO CONSULTA/);assert.match(prompt,/No puedes crear, editar/);assert.match(prompt,/No calcules Pacing/);
assert.equal(ASSISTANT_RESPONSE_SCHEMA.properties.source_tool.type,"string");
console.log("PHASE AI-4 TESTS: PASS");
