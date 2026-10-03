# Fase AI-5 — Acciones controladas

## Objetivo
Convertir RGT Assistant de consulta read-only a un asistente que puede **proponer** acciones, pero nunca ejecutarlas sin confirmación explícita del usuario ni sin pasar nuevamente por los gates determinísticos de RGT.

## Implementación
- `js/ai/actionEngine.js`: contrato, validación, preparación y ejecución determinística.
- `js/ai/rgtAssistant.js`: propuesta estructurada de acciones con Cohere.
- `js/ui/assistant.js`: UI de propuesta, confirmación y cancelación.
- `js/ai/aiContract.js`: registra `proposeControlledAction` y `executeControlledAction` con permisos `CONFIRM_REQUIRED` y `WRITE`.
- CSS: bloque visual de acción propuesta.

## Acciones soportadas
- Crear iniciativa en BACKLOG.
- Actualizar campos permitidos de una iniciativa.
- Pasar iniciativa a `IN_PROGRESS`.
- Completar iniciativa.
- Cancelar iniciativa con motivo obligatorio.
- Iniciar Deep Work sobre una iniciativa `TRANSFORM` o `GROW` en `IN_PROGRESS`.

## Reglas de seguridad
1. Cohere nunca escribe directamente en IndexedDB.
2. Toda mutación requiere confirmación explícita.
3. RGT vuelve a validar el estado actual inmediatamente antes de persistir.
4. Definition of Ready y WIP siguen siendo determinísticos.
5. Definition of Done/evidencia siguen siendo determinísticos.
6. Toda mutación genera Activity Log.
7. No se añade lógica de Pacing, Forecast, Reforecast o Recovery.
8. El límite TRANSFORM WIP permanece en 2.
9. Los campos editables están en whitelist.
10. Una propuesta inválida se rechaza antes de mostrar ejecución.

## Validación
- AI-5 unit tests: PASS.
- `node --check`: PASS para módulos nuevos/modificados.
- AI-1–AI-4: regresión ejecutada.
- Release audit: PASS.
- Prueba real con Cohere: no ejecutada sin API key del usuario.
- Prueba visual/interactiva en navegador: pendiente de ejecución manual.

## Nota de arquitectura
La IA propone; RGT decide. La confirmación del usuario es necesaria y los gates se recalculan con el snapshot vigente, evitando ejecutar una propuesta obsoleta.
