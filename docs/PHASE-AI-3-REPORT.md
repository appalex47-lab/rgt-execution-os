# Fase AI-3 — Initiative Copilot

## Objetivo
Convertir una solicitud en lenguaje natural en un borrador estructurado de iniciativa sin persistirlo automáticamente.

## Implementación
- `js/ai/initiativeCopilot.js`: prompt, schema Structured Output y validación determinística.
- `js/ui/initiativeCopilot.js`: modal y revisión del borrador.
- `js/ui/board.js`: acceso `Crear con IA`.
- `js/ui/initiativeDetail.js`: creación manual admite prefills del borrador, sin persistencia automática.
- CSS específico del Copilot.

## Gobernanza
Cohere propone; RGT valida. El borrador no modifica IndexedDB. El usuario debe usar el borrador y completar/revisar el DoD antes de crear la iniciativa.

## Pruebas
- AI-3 unit tests.
- AI-2/AI-1 regression.
- `node --check` de todos los JS.
- No se realizó una llamada real a Cohere sin API key del usuario.
- Validación visual en navegador queda pendiente.

## Fuera de alcance
No se añadió lógica de Pacing, Forecast, Reforecast o Recovery.
