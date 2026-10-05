# Changelog

## Fase 2 — Nuevo menú y arquitectura de navegación
- Menú agrupado (Command Center · Planificar · Ejecutar · Revisar · Aprender · Configuración) con URLs `#/execution/<grupo>/<módulo>`; las URLs antiguas se normalizan.
- Migas `EXECUTION OS / GRUPO / MÓDULO [/ iniciativa]` con botón Atrás; drawer en móvil/tablet; navegación accesible (`aria-current`, `aria-expanded`, foco, Escape).
- Command Center con «Siguiente paso» determinístico (`nextActionEngine`).
- Nuevos módulos: Iniciativas (alta/administración), Must-Win (extraído de Planning), Mis tareas, Seguimiento (absorbe Alertas), Ruta Guiada, Casos Prácticos (entrada), Preferencias.
- Academy con progreso global y 8 cursos (Próximamente donde no hay lecciones).
- Contextos para los 6 grupos y los módulos nuevos; pregunta universal «¿Cómo sé si lo hice correctamente?»; modo de aprendizaje (guiado/estándar/experto).
- Guía RGT contextual: ubicación, siguiente paso y ruta relacionada.
- Preferencias de navegación y UX en el store `prefs` (sin cambio de versión de IndexedDB).
- Cambios de comportamiento: crear iniciativas ya no está en el Board (está en Iniciativas); `#/alerts` redirige a Seguimiento.

## Fase 1 — Learning & Guidance
Registro común, Context System, Guided Tour Engine, progreso en IndexedDB, botón «Guía RGT». Ver `docs/FASE-1-LEARNING-ARCHITECTURE.md`.

## 2026-10-04 — Corrección Cohere + navegación
- Corregidos schemas Structured Outputs incompatibles con Cohere.
- Añadida capa central `js/ai/cohereSchema.js`.
- Movidas validaciones de rango de Initiative Copilot al validator RGT, manteniendo la regla de negocio.
- Corregida navegación de grupos a primera opción y comportamiento accordion.
- Añadida regresión específica `cohere-navigation-bug-tests.mjs`.
