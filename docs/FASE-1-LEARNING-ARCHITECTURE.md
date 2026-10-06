# Fase 1 — RGT Learning & Guidance System

> Actualización Fase 2: los contextos `successCheck`, los módulos de navegación y las preferencias `nav`/`ux` extienden esta arquitectura (ver `docs/ARCHITECTURE.md`). La ruta demo ahora vive en Iniciativas.

```
                    RGT LEARNING & GUIDANCE (js/learning)
   registry  ←  content/*  (sections, demo, legacy Academy)
      │
      ├─ contextEngine  → intros de sección/módulo, ayuda inline/popover/modal/panel, «¿Dónde estoy?»
      ├─ tourEngine     → rutas guiadas (pasos, validación vía engines)
      └─ progressStore  → progreso + preferencias en IndexedDB (stores learning / prefs)
   ui/guide.js (🧭 Guía RGT, intros, ayuda, tarjeta de ruta)      ui/academy.js (lee el mismo registro)
```

## Archivos
| Archivo | Rol |
|---|---|
| `js/learning/model.js` | Tipos de contexto, niveles de divulgación, estados y su mapa por tipo |
| `js/learning/registry.js` | Registro único: `context`, `lesson`, `practice`, `route`, `assessment`; `chain()` y `validateIntegrity()` |
| `js/learning/contextEngine.js` | Render puro (sin DOM) de todos los patrones de ayuda |
| `js/learning/tourEngine.js` | Motor de rutas reutilizable (máquina de estados) |
| `js/learning/validators.js` | Validadores de paso que **delegan** en `readyEngine`, `transitionEngine`, `wipEngine` |
| `js/learning/progressStore.js` | Progreso y preferencias; adaptador intercambiable (IndexedDB / memoria) |
| `js/learning/events.js` | Bus `rgt:learning` para que las vistas informen eventos sin importar la UI de guía |
| `js/learning/html.js` | Helpers para plantillas de vista: `viewIntro`, `moduleIntro`, `help` |
| `js/learning/index.js` | Instancias de la app (`progress`, `tour`, `registry`) |
| `js/learning/content/*` | Contenido: `sections.js` (rico), `demo.js` (técnico, desechable), `legacy.js` (Academy previa) |
| `js/ui/guide.js` | Botón flotante, panel, intros, ayuda, tarjeta de ruta, accesibilidad |

## Modelo de contexto
`{id, type, title, shortDescription, purpose, whatYouCanDo[], recommendedFirstAction, howItWorks, examples[], commonMistakes[], whyItMatters, relatedConcepts[], relatedLessons[], relatedGuides[]}` + opcionales `view` (SECTION) y `defaultMode`.
Tipos: `SECTION · MODULE · COMPONENT · FIELD · CONCEPT · ACTION`. Ningún campo es obligatorio salvo `id`/`type`.

### Divulgación progresiva (mismos datos, 5 capas)
1 Qué es (`shortDescription`) · 2 Para qué sirve (`purpose`, `whatYouCanDo`, `whyItMatters`) · 3 Cómo usarlo (`recommendedFirstAction`, `howItWorks`) · 4 Ejemplo (`examples`, `commonMistakes`) · 5 Aprender más (relaciones resueltas a botones). Un nivel sin contenido no se muestra; «Ver más/Ver menos» respeta el máximo real.

### Patrones de presentación
- **Intro de sección/módulo**: `expanded | minimized | hidden` (+ chip «ⓘ ¿Qué es…?» para reabrir), «Entendido» = ocultar. Mismo componente para SECTION y MODULE.
- **Ayuda de campo/componente**: `inline`, `popover`, `modal`, `panel` (elige el llamador: `help(id, patrón)`).
- **¿Dónde estoy?**: pestaña «Aquí» de la guía (qué es, para qué sirve, qué puedo hacer, qué hacer primero).

## Persistencia
- `learning` (keyPath `id = "<tipo>:<refId>"`): `{type, refId, status, startedAt, completedAt, updatedAt, attempts, score, currentStep, completedSteps[]}`.
- `prefs`: `{id:"context", intro:{ctxId:modo}, level:{ctxId:1..5}}` y `{id:"guide", open, minimized, hidden}`.
- Lecturas síncronas desde caché hidratada (`progress.load()` al arrancar y tras restaurar backup); escrituras serializadas en cola (`flush()`).
- Viaja en backups como stores opcionales (compatible hacia atrás).

### Estados por tipo
| Tipo | Estados válidos | Cuenta como hecho |
|---|---|---|
| lesson / course | NOT_STARTED, IN_PROGRESS, COMPLETED | COMPLETED |
| route | NOT_STARTED, IN_PROGRESS, PAUSED, COMPLETED | COMPLETED |
| practice | NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED | COMPLETED |
| assessment | NOT_STARTED, IN_PROGRESS, PASSED, FAILED | PASSED |
Un estado inválido para el tipo lanza error. Reiniciar = `NOT_STARTED` (limpia fechas, intentos y cursor).

## Guided Tour Engine
Ruta: `{id,title,feature,steps:[{id,title,description,target,action,validation,expected,feedback,next,previous,optional,view}]}`.
- **Tipos de paso**: INFO (leer y continuar) · ACCIÓN (requerida, no se puede continuar sin validar) · opcional (se puede omitir).
- **Fases**: IDLE → ACTIVE ⇄ PAUSED → COMPLETED. «Cerrar» guarda el avance (PAUSED) y permite reanudar tras recargar.
- **Validación**: `report(evento)`. CLICK sin validador valida por `data-rgt-target`; SELECT/INPUT y eventos de dominio pasan por un validador nombrado. Validadores incluidos: `value_equals/pillar_selected`, `initiative_created` (contra el snapshot persistido), `ready_complete`, `transition_allowed`, `transition_blocked` (para prácticas «detecta la violación»). Las reglas vienen de los engines; nada de WIP/Ready/DoD está duplicado.
- **Target inexistente**: se detecta (`targetMissing`), se avisa en la tarjeta y la guía no se rompe.
- **Ramificación**: `next`/`previous` explícitos por paso.
- **Accesibilidad**: tarjeta `role="dialog" aria-modal="false"` (no atrapa foco), región `aria-live`, barra `progressbar`, Escape cierra (guarda avance), foco devuelto al botón, resaltado por contorno (no bloquea clics), `prefers-reduced-motion`.

## Selectores estables
`data-rgt-target="<clave>"` (p. ej. `board-header`, `wip-chip`, `new-initiative`, `create-pillar`, `create-dod`, `create-task`, `guide-fab`). La ruta usa `[data-rgt-target='clave']`; los textos y clases pueden cambiar sin romper rutas.

## Cómo agregar contenido (fases siguientes)
1. `registerContext/registerLesson/registerPractice/registerRoute` (o un archivo en `content/`), referenciando por id.
2. Poner `data-rgt-target` en los elementos que una ruta necesite y, si hace falta, emitir `emitLearning("evento",{…})` desde la acción real.
3. Si un paso valida una regla nueva: `registerValidator(nombre, fn)` delegando en el engine correspondiente.
4. `registry.validateIntegrity()` (cubierto por tests) detecta referencias rotas.
El contenido demo (`demo.js`) puede borrarse o reemplazarse sin tocar ningún motor.

## Preparado para fases siguientes
Academy (lecciones/cursos), Ruta Guiada (rutas reales), Prácticas y Evaluaciones (`practice`/`assessment` ya tienen registro, estados y `recordAttempt`), Assistant (mismo `registry.get("context", id)` como fuente), mensajes de error (mismos conceptos).

## Límites conocidos de la Fase 1
- Una sola ruta activa a la vez. - La ruta demo navega a la vista del paso, pero no fuerza abrir/cerrar modales ajenos. - El menú no está agrupado y no hay Preferencias/Casos/Evaluaciones: son fases posteriores.
