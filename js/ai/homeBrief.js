/** AI-6 — Intelligent Home: deterministic execution context + Cohere narrative. */
import { chat } from "./cohereGateway.js";
import { buildAIContext, validateAIResponseEnvelope } from "./aiContract.js";
import { getMustWin, getBlockedInitiatives, getDeepWorkCandidates, getExecutionHealth, getTodayTasks } from "./assistantTools.js";

export const HOME_BRIEF_SCHEMA={type:"object",properties:{headline:{type:"string"},attention:{type:"array",items:{type:"string"}},must_win:{type:"array",items:{type:"string"}},next_actions:{type:"array",items:{type:"string"}},note:{type:"string"}},required:["headline","attention","must_win","next_actions","note"]};

export function buildHomeBriefContext(snapshot,date=new Date().toISOString().slice(0,10)){
  const today=getTodayTasks(snapshot,date), mw=getMustWin(snapshot), blocked=getBlockedInitiatives(snapshot), health=getExecutionHealth(snapshot), deep=getDeepWorkCandidates(snapshot);
  return {date,today,must_win:mw,blocked,execution_health:health,deep_work:deep};
}

export function buildHomeBriefPrompt(snapshot,context){
  return `Eres el narrador operativo de RGT Execution OS. Genera un briefing breve y accionable para el Command Center.\nREGLAS:\n- RGT es la fuente de verdad. Usa exclusivamente los datos incluidos.\n- Cohere interpreta y redacta; no calcula métricas nuevas ni inventa prioridades.\n- No uses ni calcules Pacing, Forecast, Reforecast o Recovery. RevNavigator es la fuente comercial.\n- No declares que alguien está "atrasado", "saturado" o en riesgo salvo que el dato determinístico incluido lo demuestre de forma explícita.\n- No ordenes ni califiques iniciativas con criterios inventados.\n- Si no hay suficiente información, dilo claramente.\n- must_win debe reflejar únicamente los Must-Win existentes.\n- next_actions son sugerencias basadas en hechos; no ejecutan nada.\n- No crear, editar, completar, cancelar ni iniciar nada.\nDATOS DETERMINÍSTICOS:\n${JSON.stringify(context)}\nCONTEXTO RGT:\n${JSON.stringify(buildAIContext(snapshot))}\nDevuelve SOLO JSON conforme al esquema. headline: una frase. attention: máximo 4 hechos que requieren atención. must_win: máximo 3 elementos. next_actions: máximo 4 siguientes pasos sugeridos. note: limitaciones o contexto relevante.`;
}

export async function generateHomeBrief(snapshot,{config,date}={}){
  const context=buildHomeBriefContext(snapshot,date);
  const result=await chat({config,temperature:0,messages:[
    {role:"system",content:"Redactas un briefing operativo basado exclusivamente en datos RGT determinísticos. No ejecutas acciones."},
    {role:"user",content:buildHomeBriefPrompt(snapshot,context)}
  ],responseFormat:{type:"json_object",schema:HOME_BRIEF_SCHEMA}});
  const json=result.json;
  if(!json||!validateAIResponseEnvelope({type:"NARRATE",message:json.headline,data:json})) throw new Error("El briefing IA no cumplió el contrato esperado.");
  return {brief:json,context};
}
