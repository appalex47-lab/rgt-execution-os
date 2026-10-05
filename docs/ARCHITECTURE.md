# RGT Execution OS — Arquitectura (resumen vigente, Fase 2)

```
index.html ─ config.js ─ js/app.js (ROUTES, render, init)
 core/      nav.js (grupos/URLs/migas, puro) · router.js · state.js · events.js · html.js · ids.js
 engines/   transition · wip · ready · dod · sprint · mustWin · review · executionHealth · performance · alert · backup   (reglas de negocio)
            nextAction · followUp · tasks                                                                                (composición de lectura, sin escritura)
 db/        indexedDB.js (rgt-execution-os v5, 9 stores)
 learning/  registry · contextEngine · tourEngine · validators · progressStore · content/*                              (Fase 1)
 ui/        shell (menú, migas, drawer) · commandCenter · groupLanding · initiatives · mustWin · tasks · followUp
            planning · board · deepWork · review · executionHealth · performance · history · academy · guidedRoutes · cases
            aiSettings · backup · preferences · assistant · guide (Guía RGT) · extras
 integration/ RevNavigator (contrato v1.0.0; sin implementar la integración definitiva)
```

## Capas
1. **Navegación** (`core/nav.js` + `ui/shell.js`): grupos → módulos → URL canónica `#/execution/<grupo>/<módulo>`; migas; drawer móvil. No contiene reglas de negocio.
2. **Contexto** (Fase 1): cada vista/grupo/módulo tiene un contexto (`section.*`, `module.*`, `section:*` histórico) con las preguntas universales (qué es, para qué sirve, qué puedo hacer, qué hacer primero, cómo sé si lo hice bien).
3. **Guía** (Fase 1): `tourEngine`; el botón global lee el contexto de la ruta actual y el siguiente paso de `nextActionEngine`.
4. **Aprendizaje** (Fase 1): `registry` + `progressStore` (stores `learning`/`prefs`).
5. **Negocio**: engines puros; la UI nunca duplica una regla.

## Persistencia
IndexedDB `rgt-execution-os` v5. Stores: sprints, initiatives, checklist, evidence, deepWork, reviews, activity, learning, prefs. En `prefs`: `context` (intros), `guide` (botón), `nav` (grupos colapsados, última ruta), `ux` (modo de aprendizaje, página inicial). Los backups incluyen `learning`/`prefs` como stores opcionales.

## Fuente de verdad comercial
RevNavigator. RGT solo muestra el contexto comercial recibido (solo lectura, en Planning) y publica su contexto de ejecución; no calcula forecast, pacing ni recovery.

## Mapa de módulos (único lugar principal por función)
Ver `docs/FASE-2-NAVIGATION-AUDIT.md`.
