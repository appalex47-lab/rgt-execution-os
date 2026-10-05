import assert from "node:assert/strict";
import {toCohereSchema, assertCohereSchemaCompatible} from "../js/ai/cohereSchema.js";
import {chat} from "../js/ai/cohereGateway.js";
import {ASSISTANT_RESPONSE_SCHEMA, normalizeAssistantProposal} from "../js/ai/rgtAssistant.js";
import {INITIATIVE_DRAFT_SCHEMA, validateInitiativeDraft} from "../js/ai/initiativeCopilot.js";
import {GROUPS, buildRoute, resolveHash} from "../js/core/nav.js";
import fs from "node:fs";

assertCohereSchemaCompatible(ASSISTANT_RESPONSE_SCHEMA);
assertCohereSchemaCompatible(INITIATIVE_DRAFT_SCHEMA);
let captured=null;
const fakeFetch=async (_url,opts)=>{
  captured=JSON.parse(opts.body);
  return {ok:true,json:async()=>({message:{content:[{type:"text",text:JSON.stringify({message:"ok",facts:[],actions:[],source_tool:"x",proposal:{action:"NONE",target_id:"",reason:"",changes:{title:"",description:"",pillar:"",owner:"",objective:"",success_criteria:"",dependencies:"",priority:""},draft:{title:"",description:"",pillar:"",owner:"",objective:"",success_criteria:"",dependencies:"",priority:"",dod:""}}})}]}})};
};
await chat({config:{provider:"cohere",apiKey:"test",model:"command-a-plus-05-2026"},messages:[{role:"user",content:"Generate JSON."}],responseFormat:{type:"json_object",schema:ASSISTANT_RESPONSE_SCHEMA},fetchImpl:fakeFetch});
assert.equal(captured.response_format.schema.properties.proposal.properties.changes.type,"object");
assert.equal("minimum" in captured.response_format.schema,false);
const wire=toCohereSchema(ASSISTANT_RESPONSE_SCHEMA);
assert.equal(wire.type,"object");
assert.equal(wire.properties.proposal.properties.changes.type,"object");
assert.ok(wire.properties.proposal.properties.changes.required.length>0);
assert.equal("minimum" in toCohereSchema(INITIATIVE_DRAFT_SCHEMA),false);
assert.equal("maximum" in toCohereSchema(INITIATIVE_DRAFT_SCHEMA),false);
assert.equal("minimum" in toCohereSchema(INITIATIVE_DRAFT_SCHEMA).properties.estimated_minutes,false);
assert.equal("maximum" in toCohereSchema(INITIATIVE_DRAFT_SCHEMA).properties.estimated_minutes,false);

const normalized=normalizeAssistantProposal({action:"NONE",target_id:"",reason:"",changes:{title:"",priority:""},draft:{title:"",description:""}});
assert.equal(normalized.target_id,null);
assert.equal(normalized.reason,null);
assert.equal(normalized.changes,null);
assert.equal(normalized.draft,null);
const normalizedUpdate=normalizeAssistantProposal({action:"UPDATE_INITIATIVE",target_id:"R1",reason:"",changes:{title:"Nuevo",priority:""},draft:{title:""}});
assert.deepEqual(normalizedUpdate.changes,{title:"Nuevo"});
assert.equal(normalizedUpdate.draft,null);

const shell=fs.readFileSync(new URL("../js/ui/shell.js",import.meta.url),"utf8");
assert.match(shell,/accordionState/);
assert.match(shell,/g\.modules\[0\]\?\.view/);
for(const g of GROUPS.filter(x=>x.modules.length)){
  const first=g.modules[0].view;
  const route=resolveHash(buildRoute(first));
  assert.equal(route.group.id,g.id);
}
console.log("COHERE + NAVIGATION BUG TESTS: PASS");

// Regression: top-level destinations must close every expandable menu.
assert.match(shell,/if \(!g \|\| !g\.modules\.length\)/);
assert.match(shell,/accordionState\(nav\.collapsed, null\)/);
assert.equal(resolveHash(buildRoute("dashboard")).group.id,"command-center");
assert.equal(resolveHash(buildRoute("assistant")).group,null);
