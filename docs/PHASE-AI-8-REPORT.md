# Fase AI-8 — UX de aprendizaje + RGT Academy

## Objetivo
Convertir RGT en una herramienta que permita aprender el método mientras se utiliza, sin crear un segundo sistema de ayuda desconectado.

## Implementado
- RGT Academy con ruta autodidacta: Fundamentos, Operación semanal y Avanzado.
- 8 lecciones cortas con objetivo, explicación y comprobación de comprensión.
- Persistencia local del progreso de aprendizaje.
- Guía contextual única accesible desde el header de cualquier vista.
- Cada guía responde: qué es, qué hacer aquí y cómo saber si se hizo correctamente.
- Enlace directo desde la guía contextual a RGT Academy.
- Diseño responsive integrado con el lenguaje visual existente.

## Gobernanza
- La Academy no modifica iniciativas ni datos operativos.
- La guía contextual es una capa de orientación, no un segundo motor de ayuda.
- No se agregan motores de Pacing, Forecast, Reforecast o Recovery.
- RevNavigator continúa siendo la fuente comercial de verdad.

## Validación
- AI-1 a AI-8: PASS.
- Release tests: PASS (42 archivos JS auditados).
- `node --check`: PASS para módulos nuevos/modificados.
- Prueba visual/interactiva en navegador: pendiente.
