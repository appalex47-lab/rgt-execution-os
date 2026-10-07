/** RGT Assistant — Phase AI-5. Proposals require explicit confirmation and deterministic gates. */
import {buildAIContext, validateAIResponseEnvelope} from "./aiContract.js";
import {chat} from "./cohereGateway.js";
import {resolveAssistantContext} from "./assistantTools.js";
import {ACTION_TYPES, validateActionProposal} from "./actionEngine.js";

export const ASSISTANT_RESPONSE_SCHEMA={
  type:"object",
  properties:{
    message:{type:"string"},
    facts:{type:"array",items:{type:"string"}},
    actions:{type:"array",items:{type:"string"}},
    source_tool:{type:"string"},
    proposal:{
      type:"object",
      properties:{
        action:{type:"string",enum:Object.values(ACTION_TYPES)},
        target_id:{type:"string"},
        reason:{type:"string"},
        changes:{
          type:"object",
          properties:Object.fromEntries(["title","description","pillar","owner","objective","success_criteria","dependencies","priority"].map(k=>[k,{type:"string"}])),
          required:["title","description","pillar","owner","objective","success_criteria","dependencies","priority"]
        },
        draft:{
          type:"object",
          properties:Object.fromEntries(["title","description","pillar","owner","objective","success_criteria","dependencies","priority","dod"].map(k=>[k,{type:"string"}])),
          required:["title","description","pillar","owner","objective","success_criteria","dependencies","priority","dod"]
        }
      },
      required:["action","target_id","reason","changes","draft"]
    }
  },
  required:["message","facts","actions","source_tool","proposal"]
};

function emptyToNull(value){ return typeof value === "string" && value.trim() === "" ? null : value; }
function normalizeObject(value){
  if(!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out=Object.fromEntries(Object.entries(value).filter(([,v])=>!(typeof v === "string" && v.trim() === "")));
  return Object.keys(out).length ? out : null;
}
export function normalizeAssistantProposal(proposal={}){
  return {
    ...proposal,
    target_id:emptyToNull(proposal.target_id),
    reason:emptyToNull(proposal.reason),
    changes:normalizeObject(proposal.changes),
    draft:normalizeObject(proposal.draft)
  };
}

export function buildAssistantPrompt(question, tool, data, snapshot){
  const context=buildAIContext(snapshot);
  return `Eres RGT Assistant para RGT Execution OS. Responde en español.
MODO AI-5: puedes CONSULTAR y PROPONER acciones, pero NUNCA ejecutarlas automáticamente. Para consultas sin escritura, el modo es SOLO CONSULTA: No puedes crear, editar, mover ni completar datos..
REGLAS OBLIGATORIAS:
- RGT calcula y valida; Cohere interpreta y propone.
- Usa únicamente los datos RGT incluidos. No inventes IDs, nombres, fechas, responsables, métricas, estados o dependencias.
- No calcules Pacing, Forecast, Reforecast ni Recovery; RevNavigator es la fuente comercial.
- Nunca cambies WIP=2, nunca bypass de Ready/DoD.
- proposal debe usar action NONE si la pregunta no pide una escritura.
- Si la pregunta pide una acción, proposal debe describir SOLO la acción solicitada y usar target_id existente cuando aplique.
- Para CREATE_INITIATIVE, draft debe contener únicamente datos explícitos o claramente derivados de la solicitud; si faltan datos esenciales, usa action NONE y formula una pregunta aclaratoria en actions.
- Para UPDATE_INITIATIVE solo usa estos campos: title, description, pillar, owner, objective, success_criteria, dependencies, priority.
- COMPLETE_INITIATIVE solo puede proponerse; RGT verificará DoD/evidencia después.
- CANCEL_INITIATIVE requiere reason explícito.
- START_DEEP_WORK requiere target_id de una iniciativa TRANSFORM o GROW en IN_PROGRESS.
- Nunca marques una acción como ejecutada: la interfaz pedirá confirmación explícita y RGT ejecutará los gates.
PREGUNTA: ${question}
HERRAMIENTA DETERMINÍSTICA: ${tool}
DATOS DE LA HERRAMIENTA:
${JSON.stringify(data)}
CONTEXTO RGT:
${JSON.stringify(context)}
Devuelve SOLO JSON conforme al esquema. message responde directamente. facts son hechos verificables. actions son pasos sugeridos, no ejecutados. proposal describe la propuesta pendiente de confirmación.`;
}

export async function askRGT(question,{snapshot,config}={}){
  const resolved=resolveAssistantContext(snapshot,question);
  const result=await chat({config,temperature:0,messages:[
    {role:"system",content:"RGT Assistant puede proponer acciones, pero no tiene permiso de ejecutarlas sin confirmación explícita. RGT valida toda mutación."},
    {role:"user",content:buildAssistantPrompt(question,resolved.tool,resolved.data,snapshot)}
  ],responseFormat:{type:"json_object",schema:ASSISTANT_RESPONSE_SCHEMA}});
  const json=result.json;
  if(!json||!validateAIResponseEnvelope({type:"ASSIST",message:json.message,data:json}))throw new Error("La respuesta del asistente no cumplió el contrato esperado.");
  const proposal=normalizeAssistantProposal(json.proposal||{action:ACTION_TYPES.NONE,target_id:null,reason:null,changes:null,draft:null});
  const checked=validateActionProposal(proposal,snapshot);
  if(!checked.allowed)throw new Error(`Propuesta inválida: ${checked.errors.join(" ")}`);
  return {...json,proposal,source_tool:resolved.tool};
}
