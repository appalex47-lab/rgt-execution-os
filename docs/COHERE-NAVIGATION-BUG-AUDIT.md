# COHERE + NAVEGACIÓN — BUG AUDIT / CORRECCIÓN

Fecha: 2026-10-04

## 1. Auditoría

Se revisaron:
- `js/ai/cohereGateway.js`
- `js/ai/rgtAssistant.js`
- `js/ai/initiativeCopilot.js`
- `js/ai/aiContract.js`
- `js/ai/actionEngine.js`
- `js/ai/homeBrief.js`
- `js/ai/performanceNarrative.js`
- `js/core/nav.js`
- `js/core/router.js`
- `js/ui/shell.js`
- `js/learning/progressStore.js`
- Guided Tour / Context System (`js/learning/*`)

Configuración detectada: Cohere Chat API V2 (`https://api.cohere.com/v2/chat`) con modelo por defecto `command-a-plus-05-2026`, configurable desde IA/Cohere.

## 2. Causa raíz — RGT Assistant

`ASSISTANT_RESPONSE_SCHEMA` enviaba `changes` como `type: ["object", "null"]`. Cohere Structured Outputs rechaza esa forma de `type` para este caso. Además, los objetos anidados deben declarar al menos un `required`.

### Corrección
Se mantiene el contrato funcional de RGT, pero se define un contrato de transporte Cohere compatible:
- `changes` y `draft` se representan como objetos con campos string requeridos.
- valores vacíos representan ausencia y se normalizan de nuevo a `null`/objeto funcional después de recibir la respuesta.
- RGT continúa ejecutando `validateActionProposal` antes de cualquier acción.

## 3. Causa raíz — Initiative Copilot

`estimated_minutes` enviaba `minimum` y `maximum`; `confidence` también enviaba rangos numéricos.

### Corrección
Los rangos se eliminaron del schema enviado a Cohere. Se conservan íntegramente en `validateInitiativeDraft()` como reglas de negocio RGT.

Flujo:

`Cohere → respuesta estructurada → RGT validator → validación de rango → aceptar/rechazar`

## 4. Compatibility Layer

Se creó `js/ai/cohereSchema.js`.

Responsabilidades:
- eliminar constraints no soportados por Structured Outputs;
- convertir `type: [...]` a `anyOf` cuando corresponde;
- verificar top-level `object`;
- verificar `required` en objetos;
- detectar estructuras inválidas antes del request;
- no modificar reglas funcionales de RGT.

El gateway (`cohereGateway.js`) aplica esta capa a todo `responseFormat.schema`.

## 5. Navegación

### Causa raíz
`ui/shell.js` mantenía un mapa `collapsed` por grupo y permitía que más de un grupo quedara abierto. Además, el enlace del grupo navegaba al landing del grupo en lugar de seleccionar automáticamente su primera opción.

### Corrección
- un solo grupo expandido a la vez;
- seleccionar un grupo navega a su primera opción;
- la ruta determina `activeGroup` y `activeItem`;
- una ruta directa conserva la ruta y abre el grupo correspondiente;
- el estado persistido `collapsed` se conserva por compatibilidad, pero se normaliza como accordion;
- desktop, tablet y mobile reutilizan el mismo estado de navegación.

No se creó un segundo sistema de estado.

## 6. Guided Tour / Context System

Se mantuvieron `data-rgt-target`, breadcrumbs, `guidedRoutes`, Context System y Tour Engine. La corrección se limita al shell/estado de navegación y no cambia las rutas canónicas.

## 7. Riesgos de regresión

- cambios de navegación pueden afectar foco y drawer móvil;
- propuestas IA con campos vacíos requieren normalización correcta;
- los validators deben seguir rechazando rangos inválidos aunque Cohere ya no los reciba en schema;
- cualquier nueva integración Cohere debe pasar por `cohereGateway.js`.

## 8. Verificación

Resultado final: **24/24 suites PASS**.

Se añadió `tests/cohere-navigation-bug-tests.mjs` para verificar:
- compatibilidad de schemas;
- eliminación de rangos del wire schema;
- normalización del contrato de RGT Assistant;
- schema realmente construido por el gateway;
- accordion y primera opción de cada grupo.

La prueba E2E con Playwright no pudo ejecutarse en este entorno porque el paquete Playwright no está instalado. Esto queda como validación pendiente de entorno, no como PASS inventado.
