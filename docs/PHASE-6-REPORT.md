# Fase 6 — Weekly Review + Carry-over

## Objetivo
Cerrar cada Sprint con aprendizaje explícito y trasladar trabajo incompleto al siguiente ciclo sin duplicar iniciativas ni perder trazabilidad.

## Implementado
- Weekly Review persistente por Sprint.
- Cuatro preguntas obligatorias de cierre.
- Carry-over de iniciativas READY, IN_PROGRESS y BLOCKED.
- Identidad de iniciativa conservada: mismo ID, historial, DoD y evidencia.
- Carry-over persistido en review y Sprint.
- Eventos `WEEKLY_REVIEW_SAVED` y `CARRY_OVER_UPDATED` en Execution Journal.
- IndexedDB versión 3 con store `reviews` y migración compatible con instalaciones previas.

## Reglas
- DONE y CANCELLED no son carry-over.
- No se crean copias de iniciativas.
- No se reinicia el estado, DoD ni evidencia.
- La revisión pertenece a un Sprint específico.

## Pruebas
- Engine tests Fase 6: review, estados elegibles, validación, identidad y exclusiones.
- `node --check` de JavaScript.
- Regresión: WIP, Ready, DoD, Evidence, Sprint, Pacing, Must-Win y Deep Work.
- Validación visual/manual en navegador y GitHub Pages pendiente como paso de release.
