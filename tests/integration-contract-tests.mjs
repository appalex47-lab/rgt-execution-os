import assert from 'node:assert/strict';
import {parseCommercialContext,validateExecutionContext,createMessage,isIntegrationMessage,REVNAV_EVENTS,COMMERCIAL_CONTEXT_FIELDS} from '../js/integration/revNavigatorContract.js';
import {buildExecutionContext} from '../js/integration/executionContext.js';
import {toCommercialContext,buildIntegrationAIContext} from '../js/integration/revNavigatorAdapter.js';
import {buildAIContext} from '../js/ai/aiContract.js';

const good={period:'2026-10',target:1000,actual:400,pacingStatus:'BEHIND',forecast:900,recoveryRequired:true,channels:[{name:'Web'}],diagnostics:[],source:'RevNavigator'};
let r=parseCommercialContext(good);assert.equal(r.valid,true);assert.deepEqual(r.context.channels,[{name:'Web'}]);assert.equal(r.context.recoveryRequired,true);
r=parseCommercialContext({...good,actual:null,forecast:null,target:null,recoveryRequired:null,pacingStatus:null,period:null});assert.equal(r.valid,true);
for(const k of ['actual','forecast','target','recoveryRequired','pacingStatus','period'])assert.equal(r.context[k],null,`${k} must stay null`);
for(const k of COMMERCIAL_CONTEXT_FIELDS){const c={...good};delete c[k];const x=parseCommercialContext(c);assert.equal(x.valid,false,`missing ${k} accepted`);assert.equal(x.context,null);}
for(const [k,v] of [['target','100'],['actual','80'],['forecast',NaN],['actual',Infinity],['period',202610],['pacingStatus',5],['channels','Web'],['diagnostics',{}],['recoveryRequired','yes'],['source',''],['source',7]])assert.equal(parseCommercialContext({...good,[k]:v}).valid,false,`${k}=${String(v)} accepted`);
for(const bad of [null,undefined,[],'x',5])assert.equal(parseCommercialContext(bad).valid,false);
r=parseCommercialContext({...good,secretToken:'abc',extra:1});assert.equal(r.valid,true);assert.equal('secretToken' in r.context,false);assert.equal(r.warnings.length,2);
assert.equal(parseCommercialContext({...good,channels:new Array(501).fill('x')}).valid,false);
const src={...good,channels:['a']};r=parseCommercialContext(src);r.context.channels.push('b');assert.deepEqual(src.channels,['a']);
assert.equal(toCommercialContext(good).valid,true);

const ini=(id,pillar,status,extra={})=>({id,title:id,pillar,status,owner:'o',description:'SECRET-DESC',...extra});
const snap={sprints:[{id:'S1',status:'ACTIVE',week_number:40,year:2026,start_date:'2026-09-28',end_date:'2026-10-04',must_win_ids:['R','G','T1']}],
 initiatives:[ini('R','RUN','DONE',{completed_at:'2026-09-30T10:00:00'}),ini('G','GROW','IN_PROGRESS'),ini('T1','TRANSFORM','IN_PROGRESS'),ini('T2','TRANSFORM','BLOCKED')],
 checklist:[{id:'c',task_id:'T1',category:'DOD',required:true,is_completed:false}],evidence:[],deepWork:[{id:'d',task_id:'T1',status:'COMPLETED',actual_minutes:90,completed_at:'2026-09-30T10:00:00'},{id:'e',task_id:'G',status:'IN_PROGRESS'}],reviews:[],activity:[],
 externalPacing:{...good}};
const ex=buildExecutionContext(snap,new Date('2026-09-30T12:00:00'));
assert.equal(validateExecutionContext(ex).valid,true);
assert.equal(ex.source,'RGT');assert.equal(ex.activeSprint.id,'S1');
assert.deepEqual(ex.mustWin.map(x=>x.id),['R','G','T1']);
assert.deepEqual(ex.blockedInitiatives.map(x=>x.id),['T2']);
assert.deepEqual(ex.transformWIP,{active:2,limit:2});
assert.ok(['STABLE','ATTENTION','AT_RISK'].includes(ex.executionHealth.status));
assert.equal(ex.deepWork.activeSession,true);
assert.equal(typeof ex.weeklyCompletion.mustWinTotal,'number');
assert.ok(Array.isArray(ex.criticalActions));
assert.doesNotMatch(JSON.stringify(ex),/SECRET-DESC/);
assert.doesNotMatch(JSON.stringify(ex),/"(target|actual|forecast|pacing|recovery)/i);
assert.equal(validateExecutionContext({...ex,source:'X'}).valid,false);
assert.equal(validateExecutionContext({...ex,mustWin:'x'}).valid,false);
assert.equal(validateExecutionContext(null).valid,false);
const noSprint=buildExecutionContext({sprints:[],initiatives:[],checklist:[],deepWork:[]});assert.equal(noSprint.activeSprint,null);assert.equal(validateExecutionContext(noSprint).valid,true);
assert.equal(buildAIContext(snap).data.deep_work.length,2);
const ai=buildIntegrationAIContext({...snap,externalPacing:{...good,actual:null}});assert.equal(ai.integration.commercial_context.actual,null);
const m=createMessage(REVNAV_EVENTS.REQUEST_COMMERCIAL_CONTEXT,{}, {correlationId:'abc'});assert.equal(isIntegrationMessage(m),true);
assert.equal(isIntegrationMessage({...m,correlationId:'x'.repeat(65)}),false);
assert.equal(isIntegrationMessage({...m,correlationId:5}),false);
assert.equal(isIntegrationMessage({...m,event:'EVAL'}),false);
assert.equal(isIntegrationMessage('string'),false);assert.equal(isIntegrationMessage(null),false);
assert.throws(()=>createMessage('NOPE'));
console.log('INTEGRATION CONTRACT TESTS: PASS');
