# Fase 2 — RGT Academy: aprendizaje interactivo

## Objetivo
Transformar Academy de un catálogo de lectura con botón de completado en un flujo de aprendizaje verificable.

## Flujo
1. Explicación del concepto.
2. Ejemplo aplicado a RGT.
3. Preguntas de recuperación activa.
4. Feedback por respuesta.
5. Puntuación del intento.
6. Umbral de dominio: 80%.
7. Persistencia de estado, intentos, score y pasos completados mediante `progressStore`/IndexedDB.
8. Reintento cuando no se alcanza el umbral.

## Contrato de una lección
Las lecciones conservan `id`, `module`, `title`, `minutes`, `objective`, `body` y `check`, y agregan:
- `example`
- `passScore`
- `questions[]`

Cada pregunta contiene `question`, `options`, `answer` y `explanation`.

## Regla de dominio
La UI no considera dominada una lección solo porque el usuario marque casillas. Debe existir un intento evaluado con score >= `passScore` (80%).

## Persistencia
Se reutiliza el sistema existente de aprendizaje. No se crea un segundo almacenamiento. El registro conserva `attempts`, `score`, `status` y `completedSteps`.

## Regresión
Se ejecutaron todas las suites presentes en `tests/`.
Resultado: PASS.

## Limitación
La batería de Node valida contratos, persistencia y lógica. La interacción visual final debe comprobarse también en navegador real para confirmar layout, foco, radio buttons, feedback y responsive.
