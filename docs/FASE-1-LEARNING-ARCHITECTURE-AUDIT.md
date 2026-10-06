# Fase 1 — Auditoría previa de la arquitectura de aprendizaje y guía

Auditoría realizada **antes** de escribir código de la Fase 1, sobre la línea base ya corregida (22 suites PASS).

## 1. Navegación y vistas
- Router por hash `#/vista?param=valor` (`js/core/router.js`: `parseRoute`, `buildRoute`, `router.go`).
- Tabla única `ROUTES` en `js/app.js` (13 vistas: dashboard, board, planning, deep-work, review, history, alerts, execution-health, performance, assistant, ai-settings, academy, backup). Cada entrada: `label`, `render(d)`, `bind(params)`.
- Menú lateral plano en `index.html` (`nav button[data-view]`), migas en `#crumb`. **No hay agrupación de menú** (eso es alcance de Fase 11).
- Un único canal de render: `requestRender()` / evento `rgt:render` (`js/core/events.js`).

## 2. Persistencia y estado
- IndexedDB `rgt-execution-os` **v5**, 9 stores: sprints, initiatives, checklist, evidence, deepWork, reviews, activity, **learning**, **prefs**. Los dos últimos ya existían vacíos y sin uso (se crearon en la ronda de auditoría previa): infraestructura adecuada → **no se crea otra base de datos**.
- Estado global en memoria: `js/core/state.js` (`state.get()` devuelve copia profunda; `learning`/`prefs` ya forman parte del snapshot).
- Backups (`backupEngine`, schema_version 4): `learning`/`prefs` son stores opcionales → el progreso viaja en el backup y una restauración antigua no falla.
- Envoltorio `db` mínimo: `all`, `put`, `snapshot`, `replaceSnapshot` (sin `delete`; el borrado lógico se hace escribiendo `NOT_STARTED`).

## 3. Componentes reutilizables
- Patrones de modal (`.modal-backdrop`, `.modal`), `toast`, `.callout`, `.badge`, `.link-btn`, `.icon-btn`.
- Helpers de seguridad HTML: `esc`, `safeHref`, `cssToken` (`js/core/html.js`). Todo el contenido nuevo pasa por `esc`.
- Reglas de negocio centralizadas: `transitionEngine`, `readyEngine`, `dodEngine`, `wipEngine`. La guía las **reutiliza**, no las copia.

## 4. Sistemas de ayuda / Academy / onboarding existentes (no se asumió que no existieran)
| Existente | Dónde | Problema | Decisión |
|---|---|---|---|
| `LESSONS` (8 lecciones) | `js/academy.js` | Contenido y progreso propios | **Se adopta**: se registra en el registro común (`content/legacy.js`) |
| `CONTEXT` (13 guías de vista) | `js/academy.js` | Textos paralelos a cualquier otra ayuda | **Se adopta** como contextos `SECTION` (minimizados por defecto) |
| Progreso Academy | `localStorage` `rgt.academy.progress.v1` | Fuera de IndexedDB, fuera del backup, no tipado | **Migrado** una sola vez a store `learning` y la clave se elimina |
| Botón `?` de cabecera + `openContextGuide` | `js/ui/academy.js` | Modal estático de 3 campos | **Reemplazado**: abre «Guía RGT» (¿Dónde estoy?) |
| UI Academy | `js/ui/academy.js` | Leía listas y `localStorage` directamente | **Refactorizada** para leer el registro y el store |
| Tour / onboarding / tooltips | — | **No existían** | Se construyen (motor de rutas, ayuda contextual) |
| Duplicación de WIP | Lección `foundations-wip`, texto del Board, mensajes de `wipEngine` | Explicaciones paralelas | Concepto único `concept:wip` enlazado desde sección, lección y ruta |

## 5. Hallazgos que condicionan el diseño
1. Sin atributos estables para localizar elementos: se introduce `data-rgt-target`.
2. Las vistas se re-renderizan por completo (`innerHTML`): el estado de las introducciones y de la guía debe vivir **fuera** del DOM (store de preferencias) y la guía debe re-aplicar el resaltado tras cada render.
3. Las acciones relevantes (crear iniciativa) son asíncronas sobre IndexedDB: la validación de pasos se hace contra el **snapshot persistido** y no contra el DOM.
4. `db` no tiene `delete` → los estados se modelan con `NOT_STARTED` como reinicio.
5. No existe agrupación de menú, evaluaciones, casos prácticos ni Preferencias: fuera del alcance de Fase 1 (se documenta, no se simula).

## 6. Conclusión
Se puede construir la capa común **sobre** el router, IndexedDB (`learning`/`prefs`), `state`, los engines y los helpers existentes, absorbiendo la Academy actual en lugar de duplicarla.
