import assert from 'node:assert/strict';
import {createRegistry} from '../js/learning/registry.js';
import {createTourEngine} from '../js/learning/tourEngine.js';
import {createProgressStore,createMemoryAdapter} from '../js/learning/progressStore.js';
import {registerRealRoutes} from '../js/learning/content/realRoutes.js';
import {registerValidator,VALIDATORS} from '../js/learning/validators.js';

const r=createRegistry();
registerRealRoutes();
// The real route is registered in the app singleton; copy it into the isolated registry for deterministic tests.
const source=(await import('../js/learning/registry.js')).registry.get('route','first-initiative-real');
r.register('route',source);
const progress=createProgressStore(createMemoryAdapter()); await progress.load();
const engine=createTourEngine({registry:r,progress,resolveTarget:()=>({}),getSnapshot:()=>({initiatives:[]}),validators:VALIDATORS});
assert.equal(engine.start('first-initiative-real').ok,true);
let s=engine.snapshot(); assert.equal(s.required,true); assert.equal(s.canNext,false);
assert.equal(engine.next().reason,'VALIDATION_REQUIRED');
assert.equal(engine.report({type:'acknowledge'}).ok,true); assert.equal(engine.next().ok,true);
assert.equal(engine.snapshot().required,true);
assert.equal(engine.report({type:'click',target:'new-initiative'}).ok,true);
assert.equal(engine.next().ok,true);
assert.equal(engine.snapshot().required,true);
assert.equal(engine.report({type:'input',target:'create-title',value:''}).ok,false);
assert.equal(engine.report({type:'input',target:'create-title',value:'Automatizar captura'}).ok,true);
assert.equal(engine.next().ok,true);
assert.equal(engine.report({type:'select',target:'create-pillar',value:'GROW'}).ok,false);
assert.equal(engine.report({type:'select',target:'create-pillar',value:'TRANSFORM'}).ok,true);
assert.equal(engine.next().ok,true);
console.log('ACADEMY REAL ROUTE TESTS: PASS (linear comprehension + real UI gates)');
