# Fase 15 — Revisión UX de la Ruta Maestra

Fecha: 2026-10-04

## Alcance

Revisión de UX de la Ruta Maestra RGT después de la Fase 15, con foco en:
- claridad del recorrido;
- carga cognitiva;
- continuidad entre pantallas;
- controles de la guía;
- estados de progreso;
- navegación responsive;
- accesibilidad básica;
- coherencia entre guía y rutas reales.

## Hallazgo corregido

Los pasos `ACKNOWLEDGE` de la Ruta Maestra requerían dos interacciones consecutivas:
1. `He entendido`;
2. `Continuar`.

Para un checkpoint puramente informativo esto añadía fricción sin aportar una decisión adicional.

### Corrección

La guía ahora presenta una única acción:
- `Entendido, continuar →`
- `Entendido, terminar` en el último paso.

La acción registra el `acknowledge` y avanza en la misma interacción. No se modifica el contrato de los pasos de acción reales de otras rutas.

## UX verificada

### Ruta

`Command Center → Planificar → Ejecutar → Revisar → Aprender → RGT Assistant`

La Ruta Maestra sigue siendo la única ruta presentada desde el launcher de rutas.

### Aprender

Solo se incluye `RGT Academy`, porque actualmente es el proceso real de aprendizaje/práctica. No se agrega `Casos Prácticos` como relleno ni se introduce `Ruta Guiada` dentro de sí misma.

### Navegación

La guía navega a vistas reales mediante el router existente. No crea un segundo sistema de navegación.

### Progreso

El progreso continúa persistiendo mediante el sistema existente de aprendizaje/IndexedDB.

### Responsive

El panel y la tarjeta de guía usan límites relativos al viewport y media query para pantallas pequeñas. El drawer móvil conserva cierre por backdrop y Escape.

### Accesibilidad

Se mantienen:
- roles de diálogo/tablist/progressbar;
- `aria-label` en controles relevantes;
- `aria-current` en navegación activa;
- focus visible;
- restauración de foco del drawer;
- anuncios de feedback mediante `aria-live`.

## Regresión

Resultado: **29/29 suites PASS**.

La modificación UX no altera los contratos de Academy, Assistant, Cohere, navegación, IndexedDB ni transition gates.

## Limitación

No se ejecutó E2E de navegador real en este entorno porque Playwright no está instalado. La revisión UX realizada aquí es estática/contractual y de código; el comportamiento visual final en navegador debe validarse en un entorno con Playwright o mediante prueba manual en desktop/tablet/mobile.
