# Phase AI-9 — Preparación de integración RGT → RevNavigator

## Objetivo
Preparar una frontera de integración para que RGT Execution OS pueda convertirse posteriormente en un módulo nativo de RevNavigator sin duplicar motores comerciales.

## Implementado
- `js/integration/revNavigatorContract.js`: versión, namespace, eventos y contratos de contexto.
- `js/integration/revNavigatorAdapter.js`: normalización de contexto comercial y de ejecución.
- `js/integration/revNavigatorBridge.js`: handshake, recepción de contexto comercial, solicitud de contexto y publicación de contexto de ejecución.
- `js/app.js`: inicialización del bridge y solicitud de contexto comercial al arrancar.
- `tests/phase-ai9-tests.mjs`: pruebas de contrato, normalización, integración AI y guardrails.

## Propiedad de datos
- RevNavigator: fuente de verdad comercial.
- RGT: fuente de verdad de ejecución.
- Cohere: interpretación/narrativa; no fuente de datos ni motor de cálculo.

## Eventos
- `READY`
- `COMMERCIAL_CONTEXT_UPDATE`
- `REQUEST_COMMERCIAL_CONTEXT`
- `EXECUTION_CONTEXT_UPDATE`
- `NAVIGATE_TO_COMMERCIAL_VIEW`

## Regla crítica
Esta fase no crea ni replica Pacing, Forecast, Reforecast o Recovery. El contexto comercial se transporta y normaliza; no se recalcula.

## Seguridad/producción
La fase deja preparada la frontera, pero para producción se recomienda validar `event.origin`, usar un allowlist de origen y, al integrar en RevNavigator, reemplazar `postMessage('*')` por el origen exacto. No se incorpora un backend en esta fase.
