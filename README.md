# RGT Execution OS — AI-10 / Release Final

Sistema operativo de ejecución para E-commerce: RUN / GROW / TRANSFORM, WIP, Ready, DoD, Evidence, Must-Win, Deep Work, Weekly Review, Carry-over, Alertas, Execution Health y Backup/Restore.

## Arquitectura comercial
**RevNavigator es la fuente de verdad comercial.** Pacing, Forecast, Reforecast y Recovery viven allí. RGT no duplica esos motores; solo puede recibir un `RGT_PACING_UPDATE` mediante el puente de integración.

## Release
Fase 10 es hardening + QA + release. No introduce un nuevo motor de pacing.

- `docs/MASTER-RELEASE-CHECKLIST.md` — protocolo final de aceptación.
- `docs/PHASE-10-REPORT.md` — reporte de la fase.
- `tests/phase10-tests.mjs` — suite técnica de release.
- `tests/index.html` — suite de navegador para Fases 1–9.

## GitHub Pages
Aplicación estática HTML/CSS/ES Modules. No requiere Node, build ni backend.

Publicar el contenido del repositorio en GitHub Pages y ejecutar el checklist maestro sobre la URL HTTPS publicada.

## AI Layer — nueva etapa

La IA de RGT se implementará por fases bajo un contrato estricto. Cohere será una capa de interpretación, propuesta y asistencia; los motores determinísticos de RGT siguen siendo la autoridad. RevNavigator continúa siendo la fuente de verdad comercial.

- `docs/AI-ROADMAP.md` — roadmap AI-1 a AI-10.
- `docs/AI-GOVERNANCE.md` — permisos, guardrails y reglas anti-alucinación.
- `js/ai/aiContract.js` — contrato técnico inicial, sin llamadas de red.
- `tests/phase-ai1-tests.mjs` — pruebas de contrato.

## Fase AI-2 — Cohere

La aplicación incluye **IA / Cohere** en la navegación. La configuración se guarda localmente en el navegador y permite probar la conexión mediante Chat API V2 + Structured Outputs. En GitHub Pages la API key es una credencial de cliente, no un secreto de servidor; la capa `cohereGateway.js` queda desacoplada para una futura migración a un gateway/backend seguro.

## AI-3 — Initiative Copilot

RGT incorpora un Copilot para convertir solicitudes en borradores estructurados de iniciativas. El Copilot usa Cohere mediante el gateway existente, pero no persiste cambios. El usuario debe revisar el borrador y confirmar la creación; los gates DoR/DoD continúan siendo determinísticos.


## AI-5 — Acciones controladas
RGT Assistant puede proponer acciones estructuradas, pero toda mutación requiere confirmación explícita y una segunda validación determinística de Ready, DoD, WIP y reglas de negocio. Cohere no escribe directamente en IndexedDB.


## AI-9 — Integración RevNavigator

AI-9 prepara el contrato RGT ↔ RevNavigator: RevNavigator conserva la verdad comercial y RGT conserva la verdad de ejecución. No se duplican motores comerciales.

## AI-10 — Release final de la capa AI

- `docs/PHASE-AI-10-REPORT.md` — QA, seguridad e integración.
- `docs/AI-OPERATIONS.md` — manual operativo de IA.
- `docs/MASTER-AI-RELEASE.md` — resumen maestro de la capa AI.
- `tests/phase-ai10-tests.mjs` — suite final de seguridad y release.

La integración RevNavigator requiere configurar explícitamente `window.RGT_REVNAVIGATOR_ORIGIN` o `window.RGT_REVNAVIGATOR_ORIGINS` en el entorno de integración. No usar `*` en producción.

## Fase 1 — Learning & Guidance (infraestructura)
Registro común de contenido (contexto, lecciones, prácticas, rutas), motor de contexto con divulgación progresiva, motor de rutas guiadas con validación vía engines, progreso y preferencias en IndexedDB y botón «🧭 Guía RGT». Ver `docs/FASE-1-LEARNING-ARCHITECTURE.md` y `docs/FASE-1-LEARNING-ARCHITECTURE-AUDIT.md`. Tests: `node tests/run-all.mjs` y `node tests/e2e/rgt-e2e.mjs` (Chromium/Playwright).
