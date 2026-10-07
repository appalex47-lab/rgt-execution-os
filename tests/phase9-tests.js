import {buildBackup,validateBackup,formatBackupSummary} from '../js/engines/backupEngine.js';
function assert(c,m){if(!c)throw new Error(m)}
const snap={sprints:[{id:'S1',status:'ACTIVE',must_win_ids:['I1']}],initiatives:[{id:'I1',title:'Init',pillar:'RUN',status:'READY'}],checklist:[{id:'C1',task_id:'I1'}],evidence:[{id:'E1',task_id:'I1'}],deepWork:[],reviews:[],activity:[]};
const b=buildBackup(snap,{source:'test'});let r=validateBackup(b);assert(r.valid,'valid backup rejected');assert(b.format==='RGT_EXECUTION_OS_BACKUP','format');assert(formatBackupSummary(b).includes('initiatives: 1'),'summary');
r=validateBackup({...b,data:{...b.data,initiatives:[{id:'I1'},{id:'I1'}]}});assert(!r.valid,'duplicate IDs accepted');
r=validateBackup({...b,data:{...b.data,checklist:[{id:'C1',task_id:'NOPE'}]}});assert(!r.valid,'broken foreign key accepted');
r=validateBackup({...b,data:{...b.data,sprints:[{id:'S1',status:'ACTIVE'},{id:'S2',status:'ACTIVE'}]}});assert(!r.valid,'multiple active sprints accepted');
r=validateBackup({...b,format:'OTHER'});assert(!r.valid,'invalid format accepted');
r=validateBackup({...b,data:{...b.data,initiatives:[{id:'I1',title:'x',pillar:'NOPE',status:'READY'}]}});assert(!r.valid,'invalid pillar accepted');
r=validateBackup({...b,data:{...b.data,initiatives:[{id:'I1',title:'x',pillar:'RUN',status:'WEIRD'}]}});assert(!r.valid,'invalid status accepted');
const t=(id,st)=>({id,title:id,pillar:'TRANSFORM',status:st});
r=validateBackup({...b,data:{...b.data,sprints:[],checklist:[],evidence:[],initiatives:[t('A','IN_PROGRESS'),t('B','BLOCKED'),t('C','IN_PROGRESS')]}});assert(!r.valid,'WIP-violating backup accepted');
console.log('PHASE 9 TESTS: PASS');
