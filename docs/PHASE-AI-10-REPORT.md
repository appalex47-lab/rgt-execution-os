# Fase AI-10 — QA, seguridad, integración y release final

## Objetivo
Cerrar la capa AI de RGT Execution OS con regresión, controles de seguridad, validación de permisos y hardening de la frontera RGT ↔ RevNavigator.

## Implementado
- Hardening de `revNavigatorBridge.js`:
  - no se acepta `postMessage` desde orígenes arbitrarios;
  - no se usa `*` como destino de producción;
  - se valida `event.origin` mediante allowlist explícita;
  - se valida `event.source` contra la ventana esperada;
  - la conexión permanece desconectada hasta contar con un origen permitido.
- `app.js` permite configurar el origen mediante `RGT_REVNAVIGATOR_ORIGIN` o `RGT_REVNAVIGATOR_ORIGINS` sin incrustar URLs de producción en el código.
- Suite `tests/phase-ai10-tests.mjs` para contrato AI, permisos, anti-wildcard, secretos y no duplicación de motores comerciales.
- Regresión de las fases AI-1 a AI-9 y release suite técnica.
- Documentación final de arquitectura, seguridad y operación.

## Seguridad de IA
1. Cohere no escribe directamente en IndexedDB.
2. Las acciones requieren confirmación humana.
3. RGT vuelve a validar Ready, WIP y DoD antes de persistir.
4. La API key de Cohere sigue siendo una credencial de cliente en GitHub Pages; no se considera secreta.
5. No se incluyen API keys en el repositorio.
6. La integración RevNavigator no transporta la API key.
7. La frontera `postMessage` requiere allowlist de origen.
8. RevNavigator sigue siendo la fuente de verdad comercial.

## Validación
- AI-1 → AI-9: PASS.
- AI-10 security/release tests: PASS.
- Release audit: PASS.
- `node --check`: PASS para todos los módulos JS.
- Búsqueda estática de secretos conocidos: PASS.
- Auditoría de ausencia de nuevos motores Pacing/Forecast/Reforecast/Recovery en la capa AI/integración: PASS.
- El motor de pacing histórico de RGT permanece únicamente por compatibilidad de la aplicación existente; RevNavigator sigue siendo la fuente comercial cuando entrega contexto externo. Su retiro puede hacerse durante la integración nativa futura.
- Llamada real a Cohere: no ejecutada en este entorno porque requiere una API key configurada por el usuario.
- Prueba real RGT ↔ RevNavigator: queda para el entorno donde ambas aplicaciones compartan el origen/configuración de integración.
- Prueba visual interactiva en navegador: no ejecutada en este entorno; debe completarse en GitHub Pages como parte de aceptación manual.

## Resultado
La capa AI queda cerrada desde el punto de vista de arquitectura y QA técnico. La integración con RevNavigator está preparada como contrato, no como duplicación de la plataforma comercial.
