import {getExecutionHealth} from '../js/engines/executionHealthEngine.js';
function assert(c,m){if(!c)throw new Error(m)}
const base={initiatives:[],checklist:[],sprints:[{id:'S1',status:'ACTIVE',must_win_ids:['R1','G1','T1']}],externalPacing:{target:999,actual:1}};
let h=getExecutionHealth({...base,initiatives:[{id:'R1',pillar:'RUN',status:'DONE'},{id:'G1',pillar:'GROW',status:'IN_PROGRESS'},{id:'T1',pillar:'TRANSFORM',status:'IN_PROGRESS'}],checklist:[{is_completed:true}]});
assert(h.status==='STABLE','healthy execution should be stable');
assert(h.wip===1,'wip should count transform');
h=getExecutionHealth({...base,initiatives:[{id:'T1',pillar:'TRANSFORM',status:'IN_PROGRESS'},{id:'T2',pillar:'TRANSFORM',status:'IN_PROGRESS'},{id:'T3',pillar:'TRANSFORM',status:'IN_PROGRESS'},{id:'B1',pillar:'RUN',status:'BLOCKED'}],checklist:[{is_completed:false},{is_completed:false}]});
assert(h.status==='AT_RISK','overloaded execution should be at risk');
assert(h.wip===3,'wip must detect overload');
assert(h.blocked===1,'blocked must be counted');
h=getExecutionHealth({...base,initiatives:[],checklist:[]});
assert(h.score>=0&&h.score<=1,'score range');
console.log('PHASE 8 TESTS: PASS');
