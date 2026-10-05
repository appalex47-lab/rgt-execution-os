# Fase 8 — Command Center + Execution Health

## Alcance
Fase 8 consolida el Command Center y agrega una lectura determinística de salud de ejecución.

## Regla de alcance
Esta fase NO agrega, modifica ni recalcula el motor de pacing comercial de RGT. El pacing comercial sigue siendo externo y RevNavigator permanece como fuente de verdad comercial. El puente `RGT_PACING_UPDATE` existente se conserva únicamente como contrato de integración.

## Implementado
- Vista Execution Health.
- Estado global determinístico: STABLE / ATTENTION / AT_RISK.
- Dimensiones: Capacidad RGT, Flujo, Entrega y Foco Must-Win.
- Métricas operativas explicables.
- Navegación desde el shell existente.
- Responsive.
- Sin backend.
- Compatible con GitHub Pages.

## Cálculo
El score es el promedio de las cuatro dimensiones. No usa IA ni datos comerciales de pacing.

## Pruebas
- `node --check` de JS.
- Tests unitarios de Execution Health.
- Regresión de reglas existentes mediante suites de Fases 3–7 en navegador.
- Validación manual GitHub Pages pendiente.
