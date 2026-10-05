import assert from 'node:assert/strict';
import {buildAlerts} from '../js/engines/alertEngine.js';
const base={sprints:[{id:'S1',status:'ACTIVE',monthly_target_revenue:100000,actual_revenue:70000,must_win_ids:[],end_date:'2026-09-20'}],initiatives:[{id:'T1',pillar:'TRANSFORM',status:'IN_PROGRESS'},{id:'T2',pillar:'TRANSFORM',status:'IN_PROGRESS'},{id:'T3',pillar:'TRANSFORM',status:'BLOCKED'},{id:'R1',pillar:'RUN',status:'BLOCKED'}],checklist:[{id:'c1',is_completed:false}]};
const a=buildAlerts(base,new Date('2026-10-02T00:00:00'));
for(const id of ['wip-over','blocked','sprint-overdue','must-win','dod']) assert(a.some(x=>x.id===id),'missing alert '+id);
// Commercial pacing must never be computed inside RGT, even if legacy revenue fields exist in the data.
assert(!a.some(x=>x.id==='pacing-low'),'RGT must not emit a pacing alert');
console.log('Fase 7 tests: OK');
