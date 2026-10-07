# Changelog

## 2026-10-07 — Ruta Maestra con ejercicios (Fase 16)
- Cada uno de los 18 pasos es ahora un ejercicio: 5 acciones reales (abrir módulos desde su grupo, abrir «Nueva iniciativa») y 13 preguntas calculadas con los datos reales del usuario (`js/learning/exercises.js`, con los mismos engines de las pantallas).
- Un error no avanza: pista sin revelar la respuesta; el acierto explica el porqué. Los intentos fallidos se guardan por paso y el puntaje de aprendizaje de la ruta refleja los aciertos a la primera.
- Nuevo validador `exercise_answer`; la tarjeta de la guía muestra la pregunta y las opciones.
- Pruebas: `phase16-master-exercises-tests.mjs` y un e2e que completa la ruta en el navegador (39/39); unitarias 30/30.

## 2026-10-06 — Simplificación de uso (Fase 16)
- Menú: el enlace del grupo ya no duplica `aria-current` con su primera opción (el clic en un grupo sigue abriendo su primera opción).
- Command Center: intro de una línea por defecto y sin subtítulo repetido; «Siguiente paso» sube.
- Academy: bloque «Continuar donde lo dejaste» arriba; progreso, dominio conceptual y «Cómo aprender» unidos en un panel.
- Fix: las lecciones sin preguntas (p. ej. «Introducción a WIP») ahora se pueden marcar como entendidas.
- e2e actualizado al acordeón, a las lecciones con preguntas y a la ruta maestra única: 38/38. Unitarias: 29/29.

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
