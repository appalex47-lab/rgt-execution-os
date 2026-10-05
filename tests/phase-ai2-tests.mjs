import assert from "node:assert/strict";
import {DEFAULT_COHERE_MODEL, AI_CONFIG_STORAGE_KEY, getDefaultAIConfig, loadAIConfig, saveAIConfig, clearAIConfig, maskAPIKey, isAIConfigured} from "../js/ai/aiConfig.js";
import {CohereGatewayError, testConnection} from "../js/ai/cohereGateway.js";

const store = new Map();
const storage = {getItem:k=>store.get(k) ?? null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
let c = getDefaultAIConfig();
assert.equal(c.provider,"cohere");
assert.equal(c.model,DEFAULT_COHERE_MODEL);
assert.equal(loadAIConfig(storage).apiKey,"");
c = saveAIConfig({apiKey:"sk-test-1234567890",model:DEFAULT_COHERE_MODEL},storage);
assert.equal(store.get(AI_CONFIG_STORAGE_KEY).includes("sk-test-1234567890"),true);
assert.equal(isAIConfigured(c),true);
assert.equal(maskAPIKey(c.apiKey),"sk-t••••••••7890");
clearAIConfig(storage); assert.equal(loadAIConfig(storage).apiKey,"");

let called = null;
const fakeFetch = async (url, options) => {
  called = {url,options};
  return {ok:true,status:200,json:async()=>({message:{content:[{type:"text",text:'{"status":"ok"}'}]}})};
};
const result = await testConnection({apiKey:"secret",model:DEFAULT_COHERE_MODEL},{fetchImpl:fakeFetch});
assert.equal(result.ok,true);
assert.equal(called.url,"https://api.cohere.com/v2/chat");
assert.equal(called.options.headers.Authorization,"Bearer secret");
const body = JSON.parse(called.options.body);
assert.equal(body.model,DEFAULT_COHERE_MODEL);
assert.equal(body.response_format.type,"json_object");
assert.equal(body.response_format.schema.required.includes("status"),true);

const authFetch = async ()=>({ok:false,status:401,json:async()=>({message:"invalid api key"})});
await assert.rejects(() => testConnection({apiKey:"bad",model:DEFAULT_COHERE_MODEL},{fetchImpl:authFetch}), e => e instanceof CohereGatewayError && e.code === "AUTH");

const badFetch = async ()=>({ok:true,status:200,json:async()=>({message:{content:[{type:"text",text:"not json"}]}})});
await assert.rejects(() => testConnection({apiKey:"x",model:DEFAULT_COHERE_MODEL},{fetchImpl:badFetch}), e => e instanceof CohereGatewayError && e.code === "INVALID_RESPONSE");

console.log("PHASE AI-2 TESTS: PASS");
