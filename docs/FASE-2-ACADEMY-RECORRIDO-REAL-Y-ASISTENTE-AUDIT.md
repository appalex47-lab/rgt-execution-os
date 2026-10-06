# Fase 2 — Academy: recorrido real lineal + auditoría RGT Assistant

## Objetivo

Convertir RGT Academy en una experiencia de aprendizaje real, no demostrativa, y mejorar la resolución determinística del RGT Assistant.

## Academy

Se añadió el recorrido real `first-initiative-real`.

Características:
- `real: true` y no `demo`.
- Recorrido lineal.
- Ningún paso es opcional.
- Las explicaciones requieren confirmación explícita mediante `He entendido`.
- Los pasos operativos requieren interacción real con la interfaz.
- Los campos del formulario real están conectados al motor de guía mediante `data-rgt-target`.
- La creación final se valida mediante el evento real `initiative_created` y el estado persistido.
- El recorrido crea una iniciativa real en BACKLOG; no crea datos de demostración.
- El progreso continúa utilizando el store `learning` existente de IndexedDB.

### Secuencia

1. Comprender el concepto de resultado.
2. Abrir Nueva iniciativa.
3. Definir nombre.
4. Elegir pilar.
5. Describir problema.
6. Definir objetivo.
7. Definir criterio de éxito.
8. Asignar responsable.
9. Definir DoD.
10. Comprender el gate Ready.
11. Crear la iniciativa real.
12. Confirmar el cierre del recorrido.

## Regla de linealidad

`tourEngine` no permite `next()` mientras un paso requerido no esté validado.

Para pasos explicativos se añadió `ACKNOWLEDGE` + validador `acknowledge`.

Para entradas se añadió `input_nonempty`.

Los pasos de acción siguen utilizando los validadores existentes y los eventos reales de RGT.

## RGT Assistant — auditoría

### Hallazgo

Cohere y el contrato principal funcionaban, pero `resolveAssistantContext()` tenía un conjunto reducido de expresiones y utilizaba `getWeekTasks` como fallback para muchas preguntas.

Esto podía hacer que una pregunta válida recibiera contexto semanal cuando el usuario realmente pedía:
- una iniciativa concreta;
- el sprint actual;
- Deep Work;
- Must-Win;
- bloqueos;
- pendientes del día.

### Corrección

Se amplió la resolución determinística para reconocer:
- IDs de iniciativa;
- sprint/ciclo actual;
- Deep Work y concentración;
- Must-Win y priorización;
- pendientes de hoy;
- semana/mes;
- salud/WIP/capacidad.

La IA sigue sin ser fuente de verdad: primero se selecciona el contexto determinístico y después Cohere interpreta esos datos.

Las acciones continúan requiriendo confirmación explícita y vuelven a pasar por los gates RGT antes de persistirse.

## Compatibilidad

No se creó otro store de aprendizaje ni otro sistema de navegación.
Se mantienen:
- IndexedDB `learning`;
- `progressStore`;
- Guided Tour Engine;
- validadores RGT;
- WIP/Ready/DoD;
- confirmación explícita del Assistant.

## Verificación

- Academy learning tests: PASS
- Academy real route tests: PASS
- Cohere + Navigation bug tests: PASS
- AI-5 tests: PASS
- Learning tests: PASS
- Full regression: **26/26 suites PASS**
