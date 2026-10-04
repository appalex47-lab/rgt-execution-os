/**
 * RGT Cohere Gateway — Phase AI-2
 * All Cohere network calls must pass through this module.
 * This is a browser-side gateway for the current GitHub Pages architecture;
 * it is NOT a secret-preserving backend proxy.
 */
import {COHERE_ENDPOINT, loadAIConfig, isAIConfigured} from "./aiConfig.js";

export class CohereGatewayError extends Error {
  constructor(message, code = "COHERE_ERROR", details = null) {
    super(message);
    this.name = "CohereGatewayError";
    this.code = code;
    this.details = details;
  }
}

function extractText(data) {
  const content = data?.message?.content;
  if (Array.isArray(content)) {
    return content.filter(x => x?.type === "text").map(x => x.text || "").join("\n").trim();
  }
  return typeof content === "string" ? content : "";
}

function parseJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function chat({messages, responseFormat, tools, strictTools = false, temperature = 0, signal, config = loadAIConfig()} = {}) {
  if (!isAIConfigured(config)) {
    throw new CohereGatewayError("Cohere no está configurado. Agrega una API key y un modelo en Configuración → Inteligencia Artificial.", "NOT_CONFIGURED");
  }
  if (!Array.isArray(messages) || !messages.length) {
    throw new CohereGatewayError("La solicitud a Cohere requiere al menos un mensaje.", "INVALID_REQUEST");
  }

  const body = { model: config.model, messages, temperature };
  if (responseFormat) body.response_format = responseFormat;
  if (Array.isArray(tools) && tools.length) {
    body.tools = tools;
    if (strictTools) body.strict_tools = true;
  }

  let response;
  try {
    response = await fetch(COHERE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(body),
      signal
    });
  } catch (error) {
    if (error?.name === "AbortError") throw new CohereGatewayError("La solicitud a Cohere excedió el tiempo de espera.", "TIMEOUT", error);
    throw new CohereGatewayError("No se pudo conectar con Cohere. Revisa tu conexión y la configuración.", "NETWORK", error);
  }

  let data = null;
  try { data = await response.json(); } catch { /* handled below */ }

  if (!response.ok) {
    const apiMessage = data?.message || data?.error?.message || data?.error || `HTTP ${response.status}`;
    const code = response.status === 401 || response.status === 403 ? "AUTH" : `HTTP_${response.status}`;
    throw new CohereGatewayError(String(apiMessage), code, data);
  }

  const text = extractText(data);
  return {
    raw: data,
    text,
    json: parseJSON(text),
    toolCalls: data?.message?.tool_calls || [],
    finishReason: data?.finish_reason || data?.message?.finish_reason || null
  };
}

export async function testConnection(config = loadAIConfig(), {timeoutMs = 15000, fetchImpl = globalThis.fetch} = {}) {
  if (typeof fetchImpl !== "function") throw new CohereGatewayError("Fetch no está disponible en este entorno.", "FETCH_UNAVAILABLE");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body = {
      model: config.model,
      messages: [{role: "user", content: "Generate a JSON object with exactly one field named status whose value is ok."}],
      temperature: 0,
      response_format: {
        type: "json_object",
        schema: {
          type: "object",
          properties: {status: {type: "string"}},
          required: ["status"]
        }
      }
    };
    if (!config?.apiKey || !config?.model) throw new CohereGatewayError("Faltan API key o modelo.", "NOT_CONFIGURED");
    const response = await fetchImpl(COHERE_ENDPOINT, {
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}`},
      body: JSON.stringify(body),
      signal: controller.signal
    });
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) {
      const msg = data?.message || data?.error?.message || `HTTP ${response.status}`;
      const code = response.status === 401 || response.status === 403 ? "AUTH" : `HTTP_${response.status}`;
      throw new CohereGatewayError(String(msg), code, data);
    }
    const text = extractText(data);
    const json = parseJSON(text);
    if (!json || json.status !== "ok") throw new CohereGatewayError("Cohere respondió, pero la respuesta estructurada no fue válida.", "INVALID_RESPONSE", data);
    return {ok: true, model: config.model};
  } catch (error) {
    if (error instanceof CohereGatewayError) throw error;
    if (error?.name === "AbortError") throw new CohereGatewayError("La prueba de conexión excedió 15 segundos.", "TIMEOUT", error);
    throw new CohereGatewayError("No se pudo completar la prueba de conexión.", "NETWORK", error);
  } finally {
    clearTimeout(timer);
  }
}
