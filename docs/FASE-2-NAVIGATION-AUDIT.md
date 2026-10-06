# Fase 2 — Auditoría de navegación (antes de modificar) y mapa de migración

Auditoría sobre el código real de la Fase 1 (22 suites + 21 checks e2e en PASS). No se inventaron pantallas.

## 1. Estado encontrado
| Área | Hallazgo |
|---|---|
| Sidebar | 13 botones planos `nav button[data-view]` en `index.html`; sin grupos; sin enlaces reales (no se podía abrir en pestaña nueva). |
| Header | `#crumb` era un `<span>` con el nombre de la vista (sin jerarquía ni «volver»). Botón `?` abría «Guía RGT» (Fase 1). |
| Routing | Hash `#/vista?param` con `parseRoute`/`buildRoute` en `core/router.js`; tabla `ROUTES` en `app.js` (render + bind). Compatible con GitHub Pages. |
| Estado / stores | `state` en memoria; IndexedDB v5 con 9 stores; `prefs` ya existe y la Fase 1 lo usa (`context`, `guide`). **No hace falta un store nuevo.** |
| localStorage | Solo la clave de API Cohere (`aiConfig`) y, ya migrada en Fase 1, el progreso de Academy. |
| Modales | `.modal-backdrop` (detalle/alta de iniciativa, copilot, lecciones); `#initiative-modal`. |
| Fase 7 (navegación previa) | Deep link `#/board?initiative=ID` abre el detalle: se conserva (ahora `#/execution/planificar/board?initiative=ID`). |
| Context System / Tour (Fase 1) | Registro único, intros, ayuda, `tourEngine`, botón «🧭 Guía RGT». **Se consumen, no se reconstruyen.** |

## 2. Matriz: vista actual → función → nuevo grupo → nuevo módulo → acción
| Vista actual | Función | Nuevo grupo | Nuevo módulo | Ruta nueva | Acción |
|---|---|---|---|---|---|
| `dashboard` | Estado general | Command Center | Command Center | `/execution` | **Adaptar**: «Siguiente paso» + 6 señales; briefing IA plegado; el panel comercial sale (vive en Planning, solo lectura) |
| `planning` (sprint) | Planificación semanal | Planificar | Planning Semanal | `/execution/planificar/planning` | **Mover**; conserva sprint, fechas, cierre y contexto comercial de RevNavigator (solo lectura) |
| `planning` (panel Must-Win) | Selección de Must-Win | Planificar | Must-Win | `/execution/planificar/must-win` | **Extraer** a módulo propio (mismo `mustWinEngine`, misma regla 1+1+1) |
| `board` | Flujo RUN/GROW/TRANSFORM | Planificar | RGT Board | `/execution/planificar/board` | **Mover**; se quitan «Nueva iniciativa»/«Crear con IA» (pasan a Iniciativas) y se añade enlace |
| *(botones del Board + `openCreateInitiative` + `initiativeCopilot` + detalle)* | Alta y administración de iniciativas | Planificar | Iniciativas | `/execution/planificar/iniciativas` | **Centralizar** (vista nueva sobre los mismos modales y engines: Ready, DoD, transiciones, evidencia) |
| *(derivado de iniciativas + DoD)* | ¿Qué tengo que hacer? | Ejecutar | Mis tareas | `/execution/ejecutar/tareas` | **Nueva** (`tasksEngine`, solo composición) |
| `deep-work` | Concentración 120 min | Ejecutar | Deep Work | `/execution/ejecutar/deep-work` | **Mover** sin cambios de lógica |
| `alerts` + señales de flujo | ¿Qué pasa con mi ejecución? | Ejecutar | Seguimiento | `/execution/ejecutar/seguimiento` | **Absorber** Alertas (la vista «Alertas» deja de ser pantalla; `#/alerts` redirige) + listas nuevas (`followUpEngine`) |
| `review` | Cierre semanal | Revisar | Weekly Review | `/execution/revisar/weekly-review` | **Mover**; mismo `reviewEngine`; se añade «Resumen por pilar» (solo lectura) |
| `execution-health` | Salud operativa | Revisar | Execution Health | `/execution/revisar/execution-health` | **Mover**; se añaden «Señales complementarias» (no tocan el score) |
| `performance` | Rendimiento de ejecución | Revisar | Performance | `/execution/revisar/performance` | **Mover** sin cambios |
| `history` | Execution Journal | Revisar | Historial | `/execution/revisar/historial` | **Mover** sin cambios (no hay segundo journal) |
| `academy` | Lecciones | Aprender | RGT Academy | `/execution/aprender/academy` | **Adaptar**: progreso global + 8 cursos (Próximamente donde no hay lecciones) |
| *(rutas del Guided Tour, Fase 1)* | Rutas guiadas | Aprender | Ruta Guiada | `/execution/aprender/rutas` | **Nueva vista** sobre `registry` + `tourEngine`; 6 rutas pedidas como «Próximamente» |
| — | Casos prácticos | Aprender | Casos Prácticos | `/execution/aprender/casos` | **Nueva** entrada (solo arquitectura) |
| `ai-settings` | IA / Cohere | Configuración | IA / Cohere | `/execution/configuracion/ia` | **Mover**; configuración única (ya existente) |
| `backup` | Backup y datos | Configuración | Datos y Backup | `/execution/configuracion/datos` | **Mover** + panel «Versión de datos» |
| *(prefs de Fase 1 dispersas)* | Ayuda y arranque | Configuración | Preferencias | `/execution/configuracion/preferencias` | **Nueva** pantalla sobre el store `prefs` existente |
| `assistant` | Consulta IA | *(utilidad)* | RGT Assistant | `/execution/asistente` | **Conservar** fuera de los seis grupos (ver decisión D2) |

## 3. Decisiones de diseño
- **D1 · Alertas no desaparecen**: no estaba en el menú pedido; duplicarla en dos sitios violaría «un lugar principal». Se absorbió en Seguimiento («acciones pendientes») y la URL vieja redirige.
- **D2 · Assistant**: no figura en los seis grupos y no debe quedar huérfano. Se deja como utilidad transversal al pie del menú (como la Guía), sin crear navegación paralela. *Riesgo/decisión del producto: confirmar si prefieres otra ubicación.*
- **D3 · Creación de iniciativas en un solo lugar**: Iniciativas. El Board queda para el flujo/estado. La ruta demo de Fase 1 pasó a la vista Iniciativas.
- **D4 · Command Center primero**: es la pantalla inicial; la preferencia «Abrir en la última pantalla» es opcional (default: Command Center).
- **D5 · Sin store nuevo**: navegación (`nav`: grupos colapsados, última ruta) y preferencias UX (`ux`: modo de aprendizaje, página inicial) son registros del store `prefs` existente. DB sigue en v5; no hay migración de esquema. La migración de URLs antiguas es en tiempo de ejecución (redirección canónica).
- **D6 · Honestidad de datos**: las iniciativas no tienen fecha de vencimiento ni hay identidad de usuario → «Vence» = cierre del Sprint y «mis» = filtro por responsable (documentado en la UI).

## 4. Brechas detectadas (no se resolvieron en esta fase)
- Execution Health: el score solo usa capacidad/flujo/entrega/foco. Aging, carry-over y Ready se muestran como señales de apoyo; **no** alteran el score (cambiar el score es lógica de negocio).
- Weekly Review: el motor exige 4 respuestas (Must-Win, bloqueos, próxima semana, aprendizaje). Las preguntas por pilar RUN/GROW/TRANSFORM se cubren con un resumen de hechos, no como campos nuevos.
- Los cursos de Academy sin lecciones son «Próximamente»; no se escribió contenido pedagógico.
