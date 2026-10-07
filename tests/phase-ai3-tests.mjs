import assert from "node:assert/strict";
import {INITIATIVE_DRAFT_SCHEMA,buildInitiativeCopilotPrompt,validateInitiativeDraft} from "../js/ai/initiativeCopilot.js";

assert.equal(INITIATIVE_DRAFT_SCHEMA.type,"object");
assert.ok(INITIATIVE_DRAFT_SCHEMA.required.includes("pillar"));
assert.ok(INITIATIVE_DRAFT_SCHEMA.required.includes("estimated_minutes"));
const p=buildInitiativeCopilotPrompt("Revisar checkout por errores de pago",{initiatives:[],sprints:[],checklist:[],evidence:[],reviews:[],deep_work:[],activity:[]});
assert.match(p,/no inventes/i);assert.match(p,/Pacing/i);assert.match(p,/borrador/i);
const valid={title:"Revisar checkout",pillar:"RUN",description:"Investigar errores",objective:"Identificar causa",success_criteria:"Causa documentada",owner:"",dependencies:"Ninguna",priority:"Alta",estimated_minutes:120,effort:"M",confidence:.8,clarifying_questions:[]};
assert.equal(validateInitiativeDraft(valid).valid,true);
assert.equal(validateInitiativeDraft({...valid,pillar:"SALES"}).valid,false);
assert.equal(validateInitiativeDraft({...valid,estimated_minutes:1}).valid,false);
assert.equal(validateInitiativeDraft({...valid,confidence:2}).valid,false);
assert.equal(validateInitiativeDraft({...valid,clarifying_questions:"none"}).valid,false);
console.log("PHASE AI-3 TESTS: PASS");
