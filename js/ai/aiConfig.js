/**
 * RGT AI Configuration — Phase AI-2
 * Local browser configuration for the Cohere provider.
 * IMPORTANT: an API key entered in a GitHub Pages app is not a server secret.
 */
export const AI_CONFIG_VERSION = "1.0.0";
export const AI_CONFIG_STORAGE_KEY = "rgt.ai.config.v1";
export const COHERE_ENDPOINT = "https://api.cohere.com/v2/chat";
export const DEFAULT_COHERE_MODEL = "command-a-plus-05-2026";

export function getDefaultAIConfig() {
  return {
    version: AI_CONFIG_VERSION,
    provider: "cohere",
    enabled: false,
    apiKey: "",
    model: DEFAULT_COHERE_MODEL,
    connectionStatus: "NOT_TESTED",
    lastTestedAt: null,
    lastError: null
  };
}

export function loadAIConfig(storage = globalThis.localStorage) {
  const defaults = getDefaultAIConfig();
  try {
    const raw = storage?.getItem(AI_CONFIG_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed, provider: "cohere", version: AI_CONFIG_VERSION };
  } catch {
    return defaults;
  }
}

export function saveAIConfig(config, storage = globalThis.localStorage) {
  const next = {
    ...getDefaultAIConfig(),
    ...config,
    provider: "cohere",
    version: AI_CONFIG_VERSION,
    apiKey: String(config?.apiKey ?? "").trim(),
    model: String(config?.model || DEFAULT_COHERE_MODEL).trim()
  };
  storage?.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearAIConfig(storage = globalThis.localStorage) {
  storage?.removeItem(AI_CONFIG_STORAGE_KEY);
  return getDefaultAIConfig();
}

export function maskAPIKey(apiKey = "") {
  const key = String(apiKey);
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export function isAIConfigured(config = loadAIConfig()) {
  return Boolean(config?.provider === "cohere" && config?.apiKey && config?.model);
}
