import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REVNAV_INTEGRATION_VERSION,REVNAV_MESSAGE_NAMESPACE,REVNAV_EVENTS,createMessage,isIntegrationMessage,normalizeCommercialContext,normalizeExecutionContext} from '../js/integration/revNavigatorContract.js';
import {toCommercialContext,toExecutionContext,buildIntegrationAIContext} from '../js/integration/revNavigatorAdapter.js';

assert.equal(REVNAV_INTEGRATION_VERSION,'1.0.0');
assert.equal(REVNAV_MESSAGE_NAMESPACE,'RGT_REVNAVIGATOR');
for(const e of Object.values(REVNAV_EVENTS)) assert.equal(isIntegrationMessage(createMessage(e)),true);
assert.equal(isIntegrationMessage({namespace:'OTHER',version:'1.0.0',event:'READY'}),false);

const commercial=normalizeCommercialContext({target:'100',actual:'80',pacingStatus:'ATTENTION',forecast:'95',recoveryRequired:'5',channels:['Ecommerce'],diagnostics:['x'],source:'RevNavigator'});
assert.equal(commercial.target,100);assert.equal(commercial.actual,80);assert.equal(commercial.forecast,95);assert.equal(commercial.recoveryRequired,5);assert.equal(commercial.source,'RevNavigator');

const snapshot={sprints:[{id:'s1',status:'ACTIVE'}],initiatives:[{id:'i1',status:'BLOCKED'}],externalPacing:commercial};
const execution=toExecutionContext(snapshot,{mustWin:[{id:'m1'}],transformWIP:1,weeklyCompletion:0.5});
assert.equal(execution.activeSprint.id,'s1');assert.equal(execution.blockedInitiatives.length,1);assert.equal(execution.transformWIP,1);assert.equal(execution.weeklyCompletion,0.5);

const ctx=buildIntegrationAIContext(snapshot);
assert.equal(ctx.integration.commercial_source,'RevNavigator');
assert.equal(ctx.integration.execution_source,'RGT');
assert.match(ctx.integration.rule,/Never duplicate|Never.*recalculate/i);

const contract=readFileSync(new URL('../js/integration/revNavigatorContract.js',import.meta.url),'utf8');
const bridge=readFileSync(new URL('../js/integration/revNavigatorBridge.js',import.meta.url),'utf8');
const adapter=readFileSync(new URL('../js/integration/revNavigatorAdapter.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.match(contract,/COMMERCIAL_CONTEXT_UPDATE/);assert.match(contract,/EXECUTION_CONTEXT_UPDATE/);
assert.match(bridge,/postMessage/);assert.match(bridge,/requestCommercialContext/);assert.match(bridge,/publishExecutionContext/);
assert.match(adapter,/buildAIContext/);assert.match(app,/revNavigatorBridge\.start/);assert.match(app,/requestCommercialContext/);
assert.doesNotMatch(adapter,/function\s+calculate|calculatePacing|calculateForecast|calculateRecovery/i);
console.log('PHASE AI-9 TESTS: PASS');
