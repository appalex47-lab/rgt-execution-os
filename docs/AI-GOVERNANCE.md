# RGT AI Governance — AI-1

## 1. Qué hace Cohere
- Interpretar solicitudes.
- Resumir información existente.
- Explicar conceptos y estados.
- Proponer borradores.
- Sugerir descomposición de trabajo.
- Redactar narrativas sobre métricas ya calculadas.

## 2. Qué NO hace Cohere
- No calcula Pacing, Forecast, Reforecast o Recovery.
- No cambia el límite WIP.
- No salta Definition of Ready.
- No salta Definition of Done.
- No marca una iniciativa DONE por su cuenta.
- No inventa fechas, estados, métricas o evidencia.
- No convierte una sugerencia en una mutación sin confirmación cuando la acción tenga impacto operativo.

## 3. Modelo de permisos
| Nivel | Descripción |
|---|---|
| READ | Consulta datos existentes. |
| DRAFT | Genera una propuesta no persistida. |
| CONFIRM_REQUIRED | La IA puede preparar una acción; el usuario debe aprobarla. |
| WRITE | Solo para operaciones explícitamente autorizadas y después de pasar validaciones determinísticas. |

En las primeras fases, WRITE queda deshabilitado.

## 4. Regla de evidencia
Toda afirmación factual del asistente debe poder rastrearse a datos de RGT o a una señal externa identificada.

Si no existe el dato, el asistente debe decir que no dispone de él y pedirlo o indicar dónde obtenerlo.

## 5. Estimaciones
Cohere puede proponer:
- minutos estimados,
- esfuerzo,
- complejidad,
- prioridad sugerida,
- dependencias posibles.

Estas son **sugerencias**, no hechos. Deben conservarse con una marca de procedencia `ai_suggested` y una confianza si el modelo la entrega.

## 6. Comercial
RevNavigator es la fuente de verdad comercial. RGT solo recibe el contexto mediante el contrato de integración existente. Cohere puede explicar ese contexto, pero no recalcularlo ni sustituirlo.

## 7. Seguridad de credenciales
Una API key de Cohere no debe incrustarse en un frontend público de GitHub Pages. Para producción, la llamada a Cohere debe pasar por un gateway/backend o mecanismo seguro equivalente. La arquitectura estática actual se mantiene hasta que esa capa sea definida.

## 8. Modelo recomendado
Para Structured Outputs y Tool Use se utilizará la Chat API V2. Cohere documenta Structured Outputs para respuestas JSON y `strict_tools` para que las llamadas a herramientas respeten nombre, parámetros y tipos definidos. La disponibilidad exacta de modelos debe verificarse al implementar AI-2. 
