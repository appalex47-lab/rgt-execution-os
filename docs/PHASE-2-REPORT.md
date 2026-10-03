# Fase 2 — RGT Board + Status + WIP

## Implementado
- RGT Board funcional con tres pilares: RUN, GROW, TRANSFORM.
- RGT tratado como dimensión/pilar; status tratado como ciclo independiente.
- Estados: BACKLOG, READY, IN_PROGRESS, BLOCKED, DONE, CANCELLED.
- Cambio de estado desde la tarjeta.
- Drag & drop entre pilares.
- WIP Transform calculado como IN_PROGRESS + BLOCKED.
- Límite rígido de 2 unidades WIP Transform.
- BLOCKED no libera WIP.
- Mensajes explicativos cuando una transición está permitida o bloqueada.
- Activity Journal registra cambios de pilar y estado.
- Persistencia de cambios en IndexedDB.
- Responsive y compatible con GitHub Pages.

## Deliberadamente NO implementado
- Definition of Ready / Done completo.
- Gatekeeper y evidencia obligatoria.
- Creación/edición completa de iniciativas.
- Must-Win engine completo.
- Reglas de carry-over.
- Timer real de Deep Work.

Estas capacidades corresponden a fases posteriores.

## Validación
- Sintaxis de módulos JS validada con Node.
- Integridad de archivos validada.
- Smoke tests ampliados para WIP.
