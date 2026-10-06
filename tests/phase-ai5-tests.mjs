import assert from "node:assert/strict";
import {ACTION_TYPES,validateActionProposal,prepareAction} from "../js/ai/actionEngine.js";
import {AI_TOOLS,AI_PERMISSIONS} from "../js/ai/aiContract.js";
import {buildAssistantPrompt,ASSISTANT_RESPONSE_SCHEMA} from "../js/ai/rgtAssistant.js";

const snapshot={
 sprints:[{id:"S1",status:"ACTIVE",week_number:40,must_win_ids:["R1","G1","T1"]}],
 initiatives:[
  {id:"R1",title:"Run",pillar:"RUN",status:"READY",owner:"Ana",description:"d",objective:"o",success_criteria:"s",dependencies:"Ninguna",priority:"Media"},
  {id:"G1",title:"Grow",pillar:"GROW",status:"IN_PROGRESS",owner:"Ana",description:"d",objective:"o",success_criteria:"s",dependencies:"Ninguna",priority:"Media"},
  {id:"T1",title:"Transform",pillar:"TRANSFORM",status:"READY",owner:"Ana",description:"d",objective:"o",success_criteria:"s",dependencies:"Ninguna",priority:"Alta"},
  {id:"T2",title:"Transform 2",pillar:"TRANSFORM",status:"IN_PROGRESS",owner:"Ana",description:"d",objective:"o",success_criteria:"s",dependencies:"Ninguna",priority:"Media"}
 ],
 checklist:[{id:"c1",task_id:"R1",category:"DOD",description:"evidencia",required:true,is_completed:false},{id:"c2",task_id:"G1",category:"DOD",description:"done",required:true,is_completed:true},{id:"c3",task_id:"T1",category:"DOD",description:"done",required:true,is_completed:false}],
 evidence:[],deepWork:[],reviews:[],activity:[]
};

assert.equal(AI_TOOLS.proposeControlledAction.permission,AI_PERMISSIONS.CONFIRM_REQUIRED);
assert.equal(AI_TOOLS.executeControlledAction.permission,AI_PERMISSIONS.WRITE);
assert.equal(validateActionProposal({action:ACTION_TYPES.NONE,target_id:null,reason:null,changes:null,draft:null},snapshot).allowed,true);
assert.equal(validateActionProposal({action:ACTION_TYPES.START_INITIATIVE,target_id:"NOPE",reason:null,changes:null,draft:null},snapshot).allowed,false);
assert.equal(validateActionProposal({action:ACTION_TYPES.CANCEL_INITIATIVE,target_id:"R1",reason:"",changes:null,draft:null},snapshot).allowed,false);
assert.equal(validateActionProposal({action:ACTION_TYPES.UPDATE_INITIATIVE,target_id:"R1",reason:null,changes:{title:"Nuevo"},draft:null},snapshot).allowed,true);
assert.equal(validateActionProposal({action:ACTION_TYPES.UPDATE_INITIATIVE,target_id:"R1",reason:null,changes:{status:"DONE"},draft:null},snapshot).allowed,false);
assert.equal(prepareAction({action:ACTION_TYPES.START_INITIATIVE,target_id:"R1",reason:null,changes:null,draft:null},snapshot).allowed,true);
assert.equal(prepareAction({action:ACTION_TYPES.COMPLETE_INITIATIVE,target_id:"R1",reason:null,changes:null,draft:null},snapshot).allowed,false);
assert.equal(prepareAction({action:ACTION_TYPES.START_DEEP_WORK,target_id:"G1",reason:null,changes:null,draft:null},snapshot).allowed,true);
assert.equal(prepareAction({action:ACTION_TYPES.START_INITIATIVE,target_id:"T1",reason:null,changes:null,draft:null},snapshot).allowed,true);
const prompt=buildAssistantPrompt("Inicia R1","getWeekTasks",{},snapshot);
assert.match(prompt,/confirmación explícita/i);assert.match(prompt,/Nunca marques una acción como ejecutada/i);assert.match(prompt,/Pacing, Forecast, Reforecast ni Recovery/i);
assert.equal(ASSISTANT_RESPONSE_SCHEMA.properties.proposal.properties.action.enum.includes("NONE"),true);
console.log("PHASE AI-5 TESTS: PASS");
