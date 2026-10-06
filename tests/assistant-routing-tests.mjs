import assert from 'node:assert/strict';
import {resolveAssistantContext} from '../js/ai/assistantTools.js';
const snapshot={
 sprints:[{id:'S1',status:'ACTIVE',week_number:40,must_win_ids:['R1']}],
 initiatives:[{id:'R1',title:'Run',pillar:'RUN',status:'READY',owner:'Ana',priority:'Alta'}],
 checklist:[],evidence:[],deepWork:[],reviews:[],activity:[]
};
assert.equal(resolveAssistantContext(snapshot,'¿qué tengo pendiente hoy?').tool,'getTodayTasks');
assert.equal(resolveAssistantContext(snapshot,'¿cuáles son mis 3 Must-Win?').tool,'getMustWin');
assert.equal(resolveAssistantContext(snapshot,'¿qué está bloqueado?').tool,'getBlockedInitiatives');
assert.equal(resolveAssistantContext(snapshot,'¿puedo hacer Deep Work?').tool,'getDeepWorkCandidates');
assert.equal(resolveAssistantContext(snapshot,'¿cuál es el sprint actual?').tool,'getCurrentSprint');
assert.equal(resolveAssistantContext(snapshot,'háblame de R1').tool,'getInitiative');
console.log('ASSISTANT ROUTING TESTS: PASS');
