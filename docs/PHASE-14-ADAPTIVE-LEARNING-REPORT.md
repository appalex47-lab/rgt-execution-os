# FASE 14 — RGT Academy Adaptive Learning + Guided Execution

## Objetivo
Convertir RGT Academy en un sistema de aprendizaje adaptativo conectado con la ejecución real, sin crear un segundo sistema de persistencia.

## Implementado
- Memoria de aprendizaje persistida en el `prefs` store de IndexedDB existente.
- Registro por concepto de intentos, aciertos, total, puntuación, dominio, estado y última revisión.
- Estados conceptuales: `REINFORCE`, `LEARNING`, `MASTERED`.
- Recomendación automática del concepto con menor dominio que aún requiere refuerzo.
- Panel de aprendizaje adaptativo dentro de Academy.
- Botón para abrir directamente la lección recomendada.
- Las ocho lecciones existentes quedaron asociadas a conceptos de RGT.
- El recorrido real `first-initiative-real` quedó asociado a `INITIATIVE`, `READY` y `DOD`.
- Al completar un recorrido real, su ejecución alimenta la memoria de aprendizaje.
- Las evaluaciones de lecciones alimentan la memoria con puntuación real.
- No se creó otro IndexedDB, localStorage paralelo ni otro store de progreso.

## Flujo
`Aprender → evaluar → registrar dominio → detectar debilidad → recomendar refuerzo → practicar nuevamente`.

## Guided Execution
El recorrido real mantiene el bloqueo lineal existente:
- no se puede avanzar sin validar el paso obligatorio;
- las acciones se validan contra la UI/estado real;
- la finalización del recorrido se registra en progreso;
- la finalización alimenta la memoria adaptativa.

## Reglas de arquitectura
- RGT sigue siendo la fuente de verdad.
- Cohere no modifica memoria de aprendizaje directamente.
- La IA no puede declarar por sí sola que un concepto está dominado.
- IndexedDB conserva la continuidad del aprendizaje.

## Pruebas
`tests/phase14-adaptive-learning-tests.mjs`

Resultado de regresión completa:

**28/28 suites PASS**

Incluye Academy, recorrido real lineal, Assistant, Cohere, navegación, Guided Tour, Context System, IndexedDB, seguridad y suites históricas.

## Limitación consciente
La fase implementa adaptación basada en evidencia de evaluación y ejecución. No introduce todavía generación autónoma de nuevos contenidos por Cohere ni certificaciones; esas capacidades deben construirse como una fase posterior y conservar la validación determinística de RGT.
