# Fase AI-4 — RGT Assistant: modo consulta

## Objetivo
Agregar un asistente conversacional de consulta sobre RGT Execution OS sin permitir mutaciones.

## Implementado
- Nueva vista **RGT Assistant**.
- Preguntas rápidas para hoy, Must-Win, bloqueos y Deep Work.
- Capa determinística `js/ai/assistantTools.js` para obtener datos de sprint, tareas, Must-Win, bloqueos, Execution Health, iniciativa y candidatos de Deep Work.
- `js/ai/rgtAssistant.js` usa Cohere únicamente para interpretar y explicar datos RGT.
- Respuesta estructurada con hechos, siguientes pasos sugeridos y herramienta fuente.
- Sin escritura: no crea, edita, mueve, completa, cancela ni persiste entidades.
- Sin lógica nueva de Pacing, Forecast, Reforecast o Recovery.
- Corrección de etiquetas de navegación en `app.js`.

## Gobernanza
RGT calcula y valida. Cohere interpreta y explica.
La consulta usa datos determinísticos de RGT; si faltan datos, el asistente debe indicarlo y no inventarlos.

## Pruebas
- `node tests/phase-ai4-tests.mjs` → PASS.
- `node --check` sobre JS nuevo/modificado → PASS esperado.
- Suite de release AI-1/AI-2/AI-3 debe conservarse como regresión.
- No se ejecutó una llamada real a Cohere porque requiere la API key configurada por el usuario.
- La validación visual/interactiva en navegador queda pendiente si no se ejecuta un navegador real en este entorno.

## Pendiente para AI-5
Acciones controladas con confirmación explícita y gatekeepers determinísticos; nunca escritura directa desde Cohere.
