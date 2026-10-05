import {chat} from "./cohereGateway.js";
import {buildAIContext} from "./aiContract.js";

export const INITIATIVE_DRAFT_SCHEMA = {
  type: "object",
  properties: {
    title: {type:"string"},
    pillar: {type:"string", enum:["RUN","GROW","TRANSFORM"]},
    description: {type:"string"},
    objective: {type:"string"},
    success_criteria: {type:"string"},
    owner: {type:"string"},
    dependencies: {type:"string"},
    priority: {type:"string", enum:["Alta","Media","Baja"]},
    estimated_minutes: {type:"integer", minimum:5, maximum:1440},
    effort: {type:"string", enum:["S","M","L"]},
    confidence: {type:"number", minimum:0, maximum:1},
    clarifying_questions: {type:"array", items:{type:"string"}}
  },
  required:["title","pillar","description","objective","success_criteria","owner","dependencies","priority","estimated_minutes","effort","confidence","clarifying_questions"]
};

export function buildInitiativeCopilotPrompt(request, snapshot){
  const context=buildAIContext(snapshot||{});
  return `Eres Initiative Copilot de RGT Execution OS. Convierte la solicitud del usuario en un BORRADOR de iniciativa, no en una iniciativa persistida.\n\nREGLAS: usa únicamente información disponible en la solicitud y el contexto; no inventes nombres, fechas, métricas, responsables o dependencias. Si falta información, deja el campo vacío o agrega una pregunta aclaratoria. El pilar es una sugerencia razonada por el contenido, no un hecho. La prioridad y estimación son sugerencias. Nunca calcules Pacing, Forecast, Reforecast o Recovery. No marques nada como DONE.\n\nContexto RGT:\n${JSON.stringify(context)}\n\nSolicitud del usuario:\n${String(request||"").trim()}\n\nDevuelve exclusivamente JSON que cumpla el schema. Si no puedes determinar owner, usa cadena vacía. Si no puedes determinar dependencias, usa "Ninguna". Las preguntas aclaratorias deben contener solo lo necesario para mejorar el borrador.`;
}

export function validateInitiativeDraft(draft){
  if(!draft||typeof draft!=="object") return {valid:false,errors:["La respuesta no es un objeto."]};
  const errors=[];
  for(const k of ["title","pillar","description","objective","success_criteria","owner","dependencies","priority","estimated_minutes","effort","confidence","clarifying_questions"]){if(!(k in draft))errors.push(`Falta ${k}.`)}
  if(draft.pillar&&!['RUN','GROW','TRANSFORM'].includes(draft.pillar))errors.push("Pilar inválido.");
  if(draft.priority&&!['Alta','Media','Baja'].includes(draft.priority))errors.push("Prioridad inválida.");
  if(!Number.isInteger(draft.estimated_minutes)||draft.estimated_minutes<5||draft.estimated_minutes>1440)errors.push("estimated_minutes inválido.");
  if(!Number.isFinite(draft.confidence)||draft.confidence<0||draft.confidence>1)errors.push("confidence inválido.");
  if(!Array.isArray(draft.clarifying_questions))errors.push("clarifying_questions inválido.");
  return {valid:errors.length===0,errors};
}

export async function draftInitiative(request,snapshot,config){
  if(!String(request||"").trim()) throw new Error("Describe la iniciativa que quieres convertir en borrador.");
  const result=await chat({config,messages:[
    {role:"system",content:"Eres Initiative Copilot de RGT. Tu salida es siempre un borrador estructurado y nunca una mutación."},
    {role:"user",content:buildInitiativeCopilotPrompt(request,snapshot)}
  ],responseFormat:{type:"json_object",schema:INITIATIVE_DRAFT_SCHEMA},temperature:0});
  const draft=result.json;
  const validation=validateInitiativeDraft(draft);
  if(!validation.valid) throw new Error(`Borrador inválido: ${validation.errors.join(" ")}`);
  return draft;
}
