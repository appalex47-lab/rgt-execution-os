# Fase AI-6 — Home Inteligente

## Objetivo
Convertir el Command Center en una superficie de lectura operativa: RGT determina los hechos y Cohere redacta un briefing ejecutivo breve.

## Implementación
- `js/ai/homeBrief.js`: contexto determinístico y narrativa estructurada.
- `js/ui/homeBrief.js`: componente del Command Center con generación bajo demanda.
- `js/ui/dashboard.js`: integración del briefing en Home.
- `js/app.js`: binding del componente.
- `css/app.css`: estilos responsive del briefing.
- `tests/phase-ai6-tests.mjs`: pruebas de contrato, contexto y guardrails.

## Principios
- RGT es la fuente de verdad.
- Cohere interpreta y narra.
- El briefing no ejecuta acciones.
- No se agregan motores de Pacing, Forecast, Reforecast o Recovery.
- No se inventan estados, prioridades, métricas o riesgos.
- Los siguientes pasos son sugerencias, no mutaciones.

## Secciones del briefing
1. Atención
2. Must-Win
3. Siguientes pasos
4. Nota / limitaciones

## Validación
La prueba de fase valida el contexto determinístico y el prompt de gobernanza. La llamada real a Cohere requiere configuración de API por parte del usuario.
