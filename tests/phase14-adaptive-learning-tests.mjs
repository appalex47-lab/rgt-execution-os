import assert from 'node:assert/strict';
import {createProgressStore, createMemoryAdapter} from '../js/learning/progressStore.js';
import {LESSONS} from '../js/academy.js';
import {createRegistry} from '../js/learning/registry.js';
import {createTourEngine} from '../js/learning/tourEngine.js';

const ad=createMemoryAdapter();
const p=createProgressStore(ad); await p.load();
assert.equal(p.recommendedLearning(), null);
p.recordLearning(['WIP'], {score:40, correct:1, total:2, source:'lesson'});
let m=p.conceptMastery('WIP');
assert.equal(m.mastery,40); assert.equal(m.state,'REINFORCE'); assert.equal(m.attempts,1);
p.recordLearning(['WIP'], {score:100, correct:2, total:2, source:'lesson'});
m=p.conceptMastery('WIP');
assert.equal(m.mastery,70); assert.equal(m.state,'LEARNING');
assert.equal(p.recommendedLearning(),'WIP');
assert.ok(LESSONS.every(l => Array.isArray(l.concepts) && l.concepts.length));

const r=createRegistry();
r.register('route',{id:'adaptive-route',title:'Adaptive',concepts:['READY'],steps:[{id:'s1',title:'Do it',action:'CLICK',target:"[data-rgt-target='x']"}]});
const rp=createProgressStore(createMemoryAdapter()); await rp.load();
const engine=createTourEngine({registry:r,progress:rp,resolveTarget:()=>({}),getSnapshot:()=>({})});
assert.equal(engine.start('adaptive-route').ok,true);
assert.equal(engine.report({type:'click',target:'x'}).ok,true);
assert.equal(engine.next().completed,true);
assert.equal(rp.conceptMastery('READY').mastery,100);
console.log('PHASE 14 ADAPTIVE LEARNING TESTS: PASS');
