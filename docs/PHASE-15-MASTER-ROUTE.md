# FASE 15 — Ruta Maestra RGT

## Objetivo

Convertir la guía de rutas en un único recorrido natural por RGT:

**Command Center → Planificar → Ejecutar → Revisar → Aprender → RGT Assistant**

La ruta reutiliza el Guided Tour Engine existente y navega a las vistas reales de la aplicación.
No se crea un segundo motor de navegación.

## Recorrido implementado

1. Command Center
2. Planificar
3. Planning Semanal
4. RGT Board
5. Iniciativas
6. Must-Win
7. Ejecutar
8. Mis tareas
9. Deep Work
10. Seguimiento
11. Revisar
12. Weekly Review
13. Execution Health
14. Performance
15. Historial
16. Aprender
17. RGT Academy
18. RGT Assistant

## Decisión sobre Aprender

Aprender participa porque RGT Academy ya contiene un proceso real de aprendizaje/práctica y persistencia del dominio.

No se agregan:

- **Casos Prácticos**: actualmente es un placeholder marcado como «Próximamente» y no ejecuta un proceso real.
- **Ruta Guiada** como paso de la ruta: es el lanzador de la propia Ruta Maestra; incluirla sería circular.

Los recorridos registrados anteriores permanecen disponibles para compatibilidad del sistema de contenido, pero la pantalla principal de Ruta Guiada presenta una sola Ruta Maestra.

## Arquitectura

- `js/learning/content/masterRoute.js`: definición única de la Ruta Maestra.
- `js/learning/content/index.js`: registro de la ruta.
- `js/ui/guidedRoutes.js`: launcher único.
- `js/learning/tourEngine.js`: motor existente, sin duplicación.
- `js/ui/guide.js`: ya sincroniza automáticamente `step.view` con el router; la Ruta Maestra reutiliza ese comportamiento.
- `IndexedDB`: mantiene el progreso mediante el `progressStore` existente.

## Regla de navegación

Al avanzar o retroceder, si el paso siguiente/anterior tiene otra vista, la Guía RGT navega automáticamente a esa vista. El usuario no necesita abandonar la ruta para encontrar manualmente el siguiente módulo.

## Criterios de aceptación

- Existe exactamente una ruta presentada como recorrido general.
- El orden de grupos es Command Center → Planificar → Ejecutar → Revisar → Aprender → RGT Assistant.
- Cada sección operativa de Planificar, Ejecutar y Revisar está incluida.
- Aprender solo incluye una capacidad actualmente real: RGT Academy.
- Casos Prácticos no se presenta como paso real mientras siga siendo placeholder.
- Ruta Guiada no se incluye como paso porque es el lanzador de la Ruta Maestra.
- El último paso es RGT Assistant.
- Se conserva el Guided Tour Engine existente.
- El progreso continúa usando IndexedDB/progressStore.
- Las rutas existentes y sus contratos no se eliminan.
