import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildAlerts} from '../js/engines/alertEngine.js';
import {getExecutionHealth} from '../js/engines/executionHealthEngine.js';
import {buildBackup, validateBackup} from '../js/engines/backupEngine.js';
import {getTransformWip, canStartTask} from '../js/engines/wipEngine.js';
import {canStartTaskReady} from '../js/engines/readyEngine.js';
import {canCompleteTask} from '../js/engines/dodEngine.js';
import * as sprintEngine from '../js/engines/sprintEngine.js';
import {validateNewSprint} from '../js/engines/sprintEngine.js';
import {validateMustWins} from '../js/engines/mustWinEngine.js';
import {getCarryOverCandidates, validateReviewInput} from '../js/engines/reviewEngine.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.js'))files.push(p)}}walk(path.join(root,'js'));
assert(files.length>0,'No JS files found');
for(const f of files){const src=fs.readFileSync(f,'utf8');assert(!src.includes('localhost:')||f.includes('tests'),'Unexpected localhost dependency in production JS: '+path.relative(root,f));}

const initiatives=[
 {id:'R1',pillar:'RUN',status:'IN_PROGRESS',title:'RUN'},
 {id:'G1',pillar:'GROW',status:'READY',title:'GROW'},
 {id:'T1',pillar:'TRANSFORM',status:'IN_PROGRESS',title:'TRANSFORM'},
 {id:'T2',pillar:'TRANSFORM',status:'BLOCKED',title:'TRANSFORM 2'},
];
const sprint={id:'S1',status:'ACTIVE',week_number:40,start_date:'2026-10-01',end_date:'2026-10-07',month_start:'2026-10-01',month_end:'2026-10-31',monthly_target_revenue:3100000,actual_revenue:930000,target_revenue:700000,must_win_ids:['R1','G1','T1']};

assert.equal(getTransformWip(initiatives),2);
assert.equal(canStartTask({id:'T3',pillar:'TRANSFORM',status:'IN_PROGRESS'},initiatives).allowed,false);
const ready={id:'X',title:'X',description:'D',pillar:'TRANSFORM',objective:'O',success_criteria:'S',owner:'U',dependencies:'N',status:'BACKLOG'};
assert.equal(canStartTaskReady(ready,[{task_id:'X',category:'DOD',required:true,is_completed:false}]).allowed,true);
assert.equal(canCompleteTask({...ready,evidence_required:true},[{task_id:'X',category:'DOD',required:true,is_completed:true}],[]).allowed,false);
assert.equal(validateNewSprint([sprint],{week_number:41,start_date:'2026-10-08',end_date:'2026-10-14'}).allowed,false);
assert.equal('calculatePacing' in sprintEngine,false,'RGT must not calculate pacing');
assert.equal(validateMustWins(['R1','G1','T1'],initiatives).allowed,true);
assert.equal(getCarryOverCandidates([...initiatives,{id:'D',status:'DONE'}]).some(x=>x.id==='D'),false);
assert.equal(validateReviewInput({must_win_completed:'x',blocked_reason:'x',next_week:'x',learning:'x'}).allowed,true);
const alerts=buildAlerts({sprints:[sprint],initiatives:[...initiatives,{id:'T3',pillar:'TRANSFORM',status:'IN_PROGRESS'}],checklist:[{id:'c',is_completed:false}]},new Date('2026-10-10T12:00:00'));
assert(alerts.length>0);
const health=getExecutionHealth({sprints:[sprint],initiatives,checklist:[{is_completed:false}]});assert(health.score>=0&&health.score<=1);
const snap={sprints:[sprint],initiatives,checklist:[],evidence:[],deepWork:[],reviews:[],activity:[]};const backup=buildBackup(snap,{source:'release-test'});assert(validateBackup(backup).valid);
assert.equal(fs.existsSync(path.join(root,'js/integration/pacingBridge.js')),false,'legacy wildcard pacingBridge must stay removed');
const pacingFiles=files.filter(f=>/pacing|forecast|reforecast|recovery/i.test(path.basename(f)));
const productionPacingEngines=pacingFiles.filter(f=>!f.includes('integration'));
assert.equal(productionPacingEngines.length,0,'RGT must not add new pacing/forecast/reforecast/recovery engines.');
console.log(`PHASE 10 RELEASE TESTS: PASS (${files.length} JS files audited)`);
