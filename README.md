# RGT Execution OS v0.1
Prompt 0 + Fase 1.

## Prompt 0 — contrato
E-commerce Operations & Growth Execution OS; no es task manager genérico.
RGT = RUN/GROW/TRANSFORM. Status = BACKLOG/READY/IN_PROGRESS/BLOCKED/DONE/CANCELLED.
Reglas base: TRANSFORM IN_PROGRESS máximo 2; BLOCKED no libera WIP; DONE requiere DoD; máximo 1 Must-Win por pilar; Must-Win debe apuntar a una iniciativa real; carry-over conserva identidad/historial.

## Fase 1
HTML5/CSS3/ES Modules, IndexedDB, state, router, design system, seed data, vistas base y smoke tests.

## Ejecutar
Con un servidor local: `python -m http.server 8000`
Abrir `http://localhost:8000`
Tests: `http://localhost:8000/tests/`

GitHub Pages compatible. No requiere backend en esta fase.

## Deliberadamente NO implementado
Drag & drop completo, Gatekeeper completo, creación/edición persistente, Must-Win engine completo, timer real, carry-over engine, alertas completas, export/import, auth/backend. Corresponden a fases posteriores.

## Fase 2 — RGT Board
El Board ya permite cambiar pilar por drag & drop y cambiar status desde cada tarjeta.
La regla WIP Transform se valida en el engine y no solo en la interfaz. BLOCKED consume WIP.

Para GitHub Pages, consulta `docs/GITHUB-PAGES.md`.
