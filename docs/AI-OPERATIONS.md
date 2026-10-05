# Manual operativo de IA — RGT Execution OS

## Principio
**RGT calcula y valida. Cohere interpreta, propone y explica. El usuario confirma.**

## Antes de usar IA
1. Abrir `IA / Cohere`.
2. Configurar la API key localmente.
3. Seleccionar el modelo disponible.
4. Ejecutar la prueba de conexión.
5. Confirmar que el indicador de conexión sea correcto.

## Initiative Copilot
- Usar lenguaje natural para describir una iniciativa.
- Revisar título, pilar, objetivo, criterios, responsable y dependencias.
- Completar/revisar DoD.
- Crear únicamente después de la revisión humana.

## RGT Assistant
- Puede consultar el estado de ejecución.
- Puede proponer acciones.
- Una propuesta nunca equivale a una acción ejecutada.
- Confirmar únicamente después de revisar el objetivo y el alcance.

## Home y Performance
Los briefings son interpretaciones de datos determinísticos. Una narrativa no sustituye el dato fuente.

## RevNavigator
- RevNavigator: Pacing, Forecast, Reforecast y Recovery.
- RGT: iniciativas, WIP, Must-Win, Deep Work, Review y Execution Health.
- Si un dato comercial no llega desde RevNavigator, RGT debe mostrarlo como ausente; no debe reconstruirlo.

## Seguridad
En GitHub Pages la API key se encuentra en el cliente. Para producción se recomienda:
`RGT/RevNavigator → backend AI Gateway → Cohere`.

La integración `postMessage` debe configurarse con un origen explícito y allowlist. No usar `*` en producción.
