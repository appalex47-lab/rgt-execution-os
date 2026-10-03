import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateAIResponseEnvelope,AI_CONTRACT_VERSION} from '../js/ai/aiContract.js';
import {validateActionProposal,prepareAction,ACTION_TYPES} from '../js/ai/actionEngine.js';
import {REVNAV_INTEGRATION_VERSION,REVNAV_MESSAGE_NAMESPACE,REVNAV_EVENTS,createMessage,isIntegrationMessage} from '../js/integration/revNavigatorContract.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const jsRoot=path.join(root,'js');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.js'))files.push(p)}}
walk(jsRoot);
assert(files.length>=45);

assert.equal(AI_CONTRACT_VERSION,'1.0.0');
assert.equal(validateAIResponseEnvelope({type:'EXPLAIN',message:'ok',data:{}}),true);
assert.equal(validateAIResponseEnvelope({type:'EXPLAIN',message:'',data:{}}),false);

const empty={sprints:[],initiatives:[],checklist:[],evidence:[],deepWork:[],activity:[]};
for(const action of [ACTION_TYPES.CREATE_INITIATIVE,ACTION_TYPES.UPDATE_INITIATIVE,ACTION_TYPES.START_INITIATIVE,ACTION_TYPES.COMPLETE_INITIATIVE,ACTION_TYPES.CANCEL_INITIATIVE,ACTION_TYPES.START_DEEP_WORK]){
  const p={action,target_id:null,reason:action===ACTION_TYPES.CANCEL_INITIATIVE?'test':null,changes:null,draft:null};
  const result=validateActionProposal(p,empty);
  const prepared=prepareAction(p,empty);
  if(action===ACTION_TYPES.START_DEEP_WORK) assert.equal(prepared.allowed,false,`Unsafe Deep Work proposal unexpectedly prepared: ${action}`);
  else assert.equal(result.allowed,false,`Unsafe proposal unexpectedly allowed: ${action}`);
}

for(const e of Object.values(REVNAV_EVENTS)) assert.equal(isIntegrationMessage(createMessage(e)),true);
assert.equal(isIntegrationMessage({...createMessage(REVNAV_EVENTS.READY),version:'9.9.9'}),false);
assert.equal(isIntegrationMessage({...createMessage(REVNAV_EVENTS.READY),namespace:'OTHER'}),false);

const bridge=fs.readFileSync(path.join(jsRoot,'integration/revNavigatorBridge.js'),'utf8');
assert.match(bridge,/event\.origin/);
assert.match(bridge,/allowedOrigins/);
assert.doesNotMatch(bridge,/targetOrigin\s*=\s*["']\*["']/);
assert.doesNotMatch(bridge,/postMessage\([^\n]*,\s*["']\*["']\)/);

const config=fs.readFileSync(path.join(jsRoot,'ai/aiConfig.js'),'utf8');
assert.doesNotMatch(config,/sk-[A-Za-z0-9]{20,}/);

const allSource=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const integrationSource=files.filter(f=>f.includes('/integration/')||f.includes('/ai/')).map(f=>fs.readFileSync(f,'utf8')).join('\n');
assert.doesNotMatch(integrationSource,/calculatePacing|calculateForecast|calculateReforecast|calculateRecovery/);
assert.doesNotMatch(allSource,/OPENAI_API_KEY\s*=\s*["'][^"']+/);

const reports=fs.readdirSync(path.join(root,'docs')).filter(x=>/^PHASE-AI-[1-9]-REPORT\.md$/.test(x));
assert.equal(reports.length,8);

console.log(`PHASE AI-10 SECURITY + RELEASE TESTS: PASS (${files.length} JS files audited)`);
