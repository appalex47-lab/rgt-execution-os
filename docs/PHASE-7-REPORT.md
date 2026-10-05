# Fase 7 — Alertas Operativas + Puente de Pacing

## Objetivo
Convertir señales operativas relevantes en alertas determinísticas y preparar un contrato de integración para que RevNavigator pueda aportar el pacing comercial sin duplicar su motor.

## Implementado
- Vista Alertas.
- Alertas de WIP TRANSFORM excedido.
- Alertas de trabajo bloqueado.
- Alertas de DoD pendiente.
- Alerta de pacing por debajo del umbral operativo.
- Alerta de Sprint vencido.
- Alerta de Must-Win incompleto.
- Contrato `RGT_PACING_UPDATE` mediante `postMessage`.
- RGT puede recibir target, actual, CR, AOV, días restantes, fecha de corte y fuente.
- RevNavigator sigue siendo fuente comercial; RGT sigue siendo sistema de ejecución.

## Integración recomendada
La integración inmediata puede ser por `postMessage` si RGT se embebe en RevNavigator mediante iframe. Alternativas futuras: adaptador/API o export/import JSON. No se duplica el motor de pacing.

## Pruebas
- `node --check` de archivos JS nuevos/modificados.
- Tests de alertas y contrato de pacing: PASS.
- Validación manual en navegador/GitHub Pages: pendiente de ejecución real.
- Regresión acumulada de Fases 1–6: debe ejecutarse desde `/tests/` en navegador; los tests de UI dependen de `document` y no deben etiquetarse como tests Node.
