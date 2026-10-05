import assert from "node:assert/strict";
import {AI_CONTRACT_VERSION, AI_GUARDRAILS, AI_TOOLS, buildAIContext, isAIWriteAllowed, validateAIResponseEnvelope} from "../js/ai/aiContract.js";

assert.equal(AI_CONTRACT_VERSION, "1.0.0");
assert.equal(AI_GUARDRAILS.NEVER_CALCULATE_COMMERCIAL_PACING, true);
assert.equal(AI_GUARDRAILS.NEVER_INVENT_MISSING_FACTS, true);
assert.equal(AI_GUARDRAILS.SOURCE_OF_TRUTH, "RGT_DETERMINISTIC_ENGINES");
assert.equal(AI_TOOLS.getWeekTasks.permission, "READ");
assert.equal(AI_TOOLS.draftInitiative.permission, "DRAFT");
assert.equal(isAIWriteAllowed("draftInitiative"), true);
assert.equal(isAIWriteAllowed("getWeekTasks"), false);

const ctx = buildAIContext({sprints:[{id:"S1"}],initiatives:[{id:"I1"}],externalPacing:{source:"RevNavigator"}});
assert.equal(ctx.contract_version, "1.0.0");
assert.equal(ctx.data.initiatives.length, 1);
assert.equal(ctx.external_commercial_context.source, "RevNavigator");

assert.equal(validateAIResponseEnvelope({type:"ANSWER",message:"ok",data:{}}), true);
assert.equal(validateAIResponseEnvelope({type:"ANSWER"}), false);
assert.equal(validateAIResponseEnvelope(null), false);

console.log("PHASE AI-1 TESTS: PASS");
