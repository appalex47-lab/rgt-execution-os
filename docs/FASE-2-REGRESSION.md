# Fase 2 — Regresión

Antes = cierre de Fase 1 (22 suites unitarias, 21 checks e2e). Después = cierre de Fase 2. Resultados reales de `node tests/run-all.mjs` y `node tests/e2e/rgt-e2e.mjs`.

## Suites unitarias
| Test | Resultado | Antes | Después | Impacto |
|---|---|---|---|---|
| phase3 … phase9, smoke (8 suites legado) | PASS | PASS | PASS | Ninguno |
| integration-contract-tests | PASS | PASS | PASS | Ninguno (contrato RevNavigator intacto) |
| phase-ai1 … phase-ai7, phase-ai9, phase-ai10 | PASS | PASS | PASS | Ninguno (ai10 audita 80 archivos JS en vez de 63/70) |
| phase-ai8-tests | PASS | PASS | PASS | Ajustado en Fase 1 (`toggleGuide`) |
| phase10-tests | PASS | PASS | PASS | Ninguno |
| transition-gates-tests | PASS | PASS | PASS | **Test actualizado**: fijaba la forma de URL `#/board` y `parseRoute → {view, params}`; ahora comprueba `view`, `params` y la URL canónica. No se relajó ninguna regla de negocio |
| phase-learning1-tests | PASS | PASS (30) | PASS (30) | **Test actualizado**: la función RGT de la ruta demo es `initiatives` (antes `board`) y el texto de migas Must-Win |
| phase-nav2-tests (nuevo) | PASS | — | PASS (21) | Cubre navegación, contexto, motores nuevos y reglas de negocio |
| **Total** | **23/23** | 22/22 | **23/23** | |

## E2E en Chromium
| Grupo de checks | Antes | Después | Impacto |
|---|---|---|---|
| 13 vistas existentes renderizan | PASS | PASS (24 rutas canónicas) | Todas con URL canónica estable y contexto |
| Intros, ayuda, botón flotante, accesibilidad por teclado | PASS | PASS | Sin cambios de comportamiento |
| Ruta guiada demo completa, pausa/reanudar, target inexistente | PASS | PASS | La ruta empieza ahora en **Iniciativas** (la creación se centralizó) |
| Academy, migración localStorage, backup/restore | PASS | PASS | Academy ahora por cursos; mismo progreso |
| Board: Gatekeeper (WIP/Ready/DoD) | PASS | PASS | Intacto |
| Planning: guardar Must-Win | PASS | PASS (movido) | Se prueba en **Must-Win**; Planning conserva sprint |
| Deep Work, Weekly Review, IndexedDB v5, móvil | PASS | PASS | Intactos |
| Nuevos: menú de 6 grupos, migas, Atrás, URLs antiguas, persistencia de nav, Command Center, Iniciativas, Mis tareas, Seguimiento, Revisar, Aprender, Configuración, Guía global, responsive (390/768/1024/1440), reglas de negocio en UI, persistencia total | — | PASS | 17 checks nuevos |
| **Total** | 21/21 | **38/38** | |

## Reglas de negocio comprobadas explícitamente
WIP (TRANSFORM ≤ 2; tercer proyecto y BLOCKED bloqueados) · DoD (no se cierra incompleto) · Must-Win (1+1+1; con una vacía no se guarda) · Ready (Ready Engine) · Sprint (un solo ACTIVE, fechas válidas, edición) · Review (`reviewEngine` exige respuestas) · Deep Work (sesión persistida, pausa) · Execution Journal (eventos conservados; sin XSS) — en pruebas unitarias **y** en la UI real.

## Mutación de control
Cambiar `WIP_LIMIT` a 3 o una ruta del menú rompe los tests (se comprobó), es decir, no son vacuos.
