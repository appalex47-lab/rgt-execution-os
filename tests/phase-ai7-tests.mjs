import assert from 'node:assert/strict';
import {buildExecutionPerformance,buildPerformanceNarrativePrompt} from '../js/engines/performanceEngine.js';
import {PERFORMANCE_NARRATIVE_SCHEMA} from '../js/ai/performanceNarrative.js';
const snap={sprints:[{id:'S1',status:'ACTIVE',start_date:'2026-09-28',end_date:'2026-10-04',must_win_ids:['R1','G1','T1']}],initiatives:[{id:'R1',pillar:'RUN',status:'DONE',updated_at:'2026-10-01T10:00:00Z'},{id:'G1',pillar:'GROW',status:'IN_PROGRESS',updated_at:'2026-10-01T10:00:00Z'},{id:'T1',pillar:'TRANSFORM',status:'IN_PROGRESS',updated_at:'2026-10-01T10:00:00Z'},{id:'T2',pillar:'TRANSFORM',status:'BLOCKED',updated_at:'2026-10-01T10:00:00Z'}],checklist:[{id:'c1',required:true,is_completed:true},{id:'c2',required:true,is_completed:false}],deepWork:[{id:'d1',status:'COMPLETED',actual_minutes:110,completed_at:'2026-10-01T12:00:00Z'}],activity:[{id:'a1',timestamp:'2026-10-01T12:00:00Z',action:'DEEP_WORK_COMPLETED'}],reviews:[{id:'r',sprint_id:'S1',learning:'x',next_week:'y'}]};
const p=buildExecutionPerformance(snap,{start:'2026-09-28T00:00:00Z',end:'2026-10-04T23:59:59Z'});
assert.equal(p.metrics.initiativesCompleted,1);assert.equal(p.metrics.mustWin.completed,1);assert.equal(p.metrics.dod.completed,1);assert.equal(p.metrics.deepWork.minutes,110);assert.equal(p.metrics.executionMix.RUN,1);assert.equal(p.metrics.executionMix.GROW,0);assert.equal(p.metrics.executionMix.TRANSFORM,0);assert.equal(p.deterministic,true);
const prompt=buildPerformanceNarrativePrompt(p);assert.match(prompt,/No calcules Pacing/);assert.match(prompt,/No inventes causas/);assert.match(prompt,/No ejecutes acciones/);
assert.equal(PERFORMANCE_NARRATIVE_SCHEMA.required.length,5);assert.ok(!('score' in p.metrics));
console.log('PHASE AI-7 TESTS: PASS');
