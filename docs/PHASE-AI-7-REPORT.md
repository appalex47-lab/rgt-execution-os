# Fase AI-7 — Performance + Execution Narrative

## Objetivo
Crear una capa determinística de desempeño de ejecución y una narrativa opcional de Cohere, sin duplicar capacidades comerciales de RevNavigator.

## Implementado
- `js/engines/performanceEngine.js`: métricas de ejecución por periodo.
- `js/ai/performanceNarrative.js`: Structured Output para narrativa.
- `js/ui/performance.js`: vista Performance.
- Nueva entrada de navegación `Performance`.
- `tests/phase-ai7-tests.mjs`.

## Métricas
- Iniciativas completadas/canceladas.
- Tasa de finalización.
- Must-Win completados.
- DoD requerido completado.
- Deep Work: sesiones, minutos y finalización.
- Carry-over.
- Bloqueos y eventos de bloqueo disponibles en Activity.
- Violaciones WIP registradas en Activity.
- WIP TRANSFORM actual.
- Mezcla RUN/GROW/TRANSFORM de iniciativas completadas.

## Gobernanza
RGT calcula. Cohere narra.
La narrativa no genera scores globales, rankings ni diagnósticos causales no demostrados.
No se implementa Pacing, Forecast, Reforecast ni Recovery.

## Validación
- AI-7 unit tests: PASS.
- Sintaxis JS: validada con `node --check`.
- Cohere real: no ejecutada sin API configurada.
- Validación visual/interactiva en navegador: pendiente.
