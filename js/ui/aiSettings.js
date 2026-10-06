import {clearAIConfig, loadAIConfig, maskAPIKey, saveAIConfig} from "../ai/aiConfig.js";
import {testConnection} from "../ai/cohereGateway.js";

function esc(value="") { return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

export function aiSettings() {
  const c = loadAIConfig();
  const status = c.connectionStatus === "CONNECTED" ? "Conectado" : c.connectionStatus === "ERROR" ? "Error" : "No probado";
  const statusClass = c.connectionStatus === "CONNECTED" ? "ok" : c.connectionStatus === "ERROR" ? "danger" : "muted";
  return `<div class="panel ai-settings">
    <div class="section-head"><div><small class="eyebrow">CONFIGURACIÓN</small><h2>Inteligencia Artificial</h2><p class="muted">Configura Cohere para las capacidades de IA de RGT. La IA interpreta, explica y propone; los motores determinísticos de RGT siguen siendo la fuente de verdad.</p></div><span id="ai-status-badge" class="badge ${statusClass}">● ${status}</span></div>
    <div class="ai-grid">
      <div class="card">
        <h3>Cohere</h3>
        <label>API Key</label>
        <div class="input-row"><input id="ai-api-key" type="password" autocomplete="off" placeholder="Pega aquí tu API key" value="${esc(c.apiKey)}"><button id="ai-toggle-key" class="secondary">Mostrar</button></div>
        <small class="muted">Se guarda únicamente en este navegador. En GitHub Pages esta clave no es un secreto de servidor y debe tratarse como credencial expuesta al cliente.</small>
        <label>Modelo</label>
        <select id="ai-model"><option value="command-a-plus-05-2026" ${c.model==="command-a-plus-05-2026"?"selected":""}>Command A+ — command-a-plus-05-2026</option><option value="command-a-03-2025" ${c.model==="command-a-03-2025"?"selected":""}>Command A — command-a-03-2025</option></select>
        <div class="actions"><button id="ai-save" class="primary">Guardar configuración</button><button id="ai-test" class="secondary">Probar conexión</button><button id="ai-clear" class="danger-btn">Eliminar key</button></div>
        <div id="ai-feedback" class="feedback"></div>
      </div>
      <div class="card">
        <h3>Gobernanza</h3>
        <ul class="guard-list"><li>✓ RGT calcula WIP, DoR, DoD, Must-Win y Execution Health.</li><li>✓ Cohere no calcula Pacing, Forecast, Reforecast ni Recovery.</li><li>✓ La IA no puede marcar una iniciativa como DONE sin validación.</li><li>✓ Las acciones de escritura requerirán confirmación explícita.</li><li>✓ AI-2 solo habilita el canal; las acciones se incorporarán en fases posteriores.</li></ul>
        <div class="notice"><strong>Arquitectura futura</strong><br>La configuración actual funciona en navegador para GitHub Pages. La arquitectura queda desacoplada para migrar después a un AI Gateway con la clave fuera del frontend.</div>
      </div>
    </div>
    <div class="card ai-technical"><h3>Estado técnico</h3><div class="tech-row"><span>Proveedor</span><b>Cohere</b></div><div class="tech-row"><span>Endpoint</span><code>Chat API V2</code></div><div class="tech-row"><span>API key</span><code>${esc(maskAPIKey(c.apiKey) || "No configurada")}</code></div><div class="tech-row"><span>Última prueba</span><code>${esc(c.lastTestedAt || "—")}</code></div></div>
  </div>`;
}

export function bindAISettings() {
  const key = document.querySelector("#ai-api-key");
  const model = document.querySelector("#ai-model");
  const feedback = document.querySelector("#ai-feedback");
  const badge = document.querySelector("#ai-status-badge");
  const setFeedback = (message, type="") => { feedback.className = `feedback ${type}`; feedback.textContent = message; };

  document.querySelector("#ai-toggle-key")?.addEventListener("click", () => {
    key.type = key.type === "password" ? "text" : "password";
    document.querySelector("#ai-toggle-key").textContent = key.type === "password" ? "Mostrar" : "Ocultar";
  });
  document.querySelector("#ai-save")?.addEventListener("click", () => {
    const c = saveAIConfig({apiKey:key.value, model:model.value, enabled:Boolean(key.value)});
    badge.className = "badge muted"; badge.textContent = "● No probado";
    setFeedback(`Configuración guardada. Key: ${maskAPIKey(c.apiKey) || "no configurada"}.`, "success");
  });
  document.querySelector("#ai-test")?.addEventListener("click", async () => {
    const c = saveAIConfig({apiKey:key.value, model:model.value, enabled:Boolean(key.value)});
    if (!c.apiKey) { setFeedback("Agrega una API key antes de probar la conexión.", "error"); return; }
    const btn = document.querySelector("#ai-test"); btn.disabled = true; btn.textContent = "Probando…"; setFeedback("Conectando con Cohere…");
    try {
      await testConnection(c);
      saveAIConfig({...c, connectionStatus:"CONNECTED", lastTestedAt:new Date().toISOString(), lastError:null, enabled:true});
      badge.className = "badge ok"; badge.textContent = "● Conectado"; setFeedback(`Conexión correcta con ${c.model}.`, "success");
    } catch (error) {
      saveAIConfig({...c, connectionStatus:"ERROR", lastTestedAt:new Date().toISOString(), lastError:error.message, enabled:false});
      badge.className = "badge danger"; badge.textContent = "● Error"; setFeedback(`${error.code || "ERROR"}: ${error.message}`, "error");
    } finally { btn.disabled = false; btn.textContent = "Probar conexión"; }
  });
  document.querySelector("#ai-clear")?.addEventListener("click", () => {
    clearAIConfig(); key.value = ""; badge.className = "badge muted"; badge.textContent = "● No configurado"; setFeedback("API key eliminada de este navegador.", "success");
  });
}
