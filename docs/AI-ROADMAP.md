# RGT AI Layer — Roadmap

## Objetivo
Agregar Cohere como copiloto de RGT sin convertir a la IA en la fuente de verdad ni en el motor de reglas.

## Principio rector
**RGT calcula y valida. Cohere interpreta, propone y explica.**

RevNavigator sigue siendo la fuente de verdad comercial para Pacing, Forecast, Reforecast y Recovery. RGT no duplicará esos motores.

## Fases

### AI-1 — Arquitectura, contrato y gobernanza
- Definir qué puede y qué no puede hacer Cohere.
- Separar READ / DRAFT / CONFIRM / WRITE.
- Definir herramientas y contexto permitido.
- Definir reglas anti-alucinación.
- Definir contrato para RevNavigator.

### AI-2 — Conexión Cohere
- Gateway de IA.
- Configuración de API key sin incrustarla en el frontend público.
- Chat API V2.
- Structured Outputs.
- Tool Use con esquemas estrictos cuando corresponda.
- Manejo de errores, timeout y fallback.

### AI-3 — Initiative Copilot
- Convertir lenguaje simple en borrador de iniciativa.
- Sugerir pillar, objetivo, criterios, dependencias, esfuerzo y prioridad.
- Preguntar cuando falte información.
- Nunca crear sin confirmación.

### AI-4 — RGT Assistant: modo consulta
- Pendientes de hoy/semana/mes.
- Must-Win.
- Bloqueos.
- Deep Work.
- Execution Health.
- Explicaciones contextuales.
- Respuestas basadas en herramientas, no memoria inventada.

### AI-5 — Assistant con acciones controladas
- Crear borradores.
- Actualizar campos permitidos.
- Iniciar Deep Work.
- Navegar a una iniciativa.
- Confirmación humana antes de mutaciones relevantes.
- Gatekeeper determinístico después de cada acción.

### AI-6 — Home inteligente
- Mensaje diario.
- Prioridades del día.
- Atrasos calculados por RGT.
- Bloqueos.
- Siguiente acción.
- Enlaces directos a las iniciativas.

### AI-7 — Performance + Execution Narrative
- KPIs determinísticos de ejecución.
- Tendencias semanales/mensuales.
- Accuracy de estimaciones.
- Carry-over.
- WIP discipline.
- Cohere redacta la narrativa, no calcula el score.

### AI-8 — UX de aprendizaje
- Onboarding.
- Explicaciones contextuales.
- RGT Academy.
- Learning by doing.
- Simulaciones.

### AI-9 — RevNavigator Intelligence Bridge ✅
- Señales comerciales desde RevNavigator.
- Contexto comercial en RGT.
- Deep links de diagnóstico.
- Cohere puede explicar señales recibidas, pero nunca sustituye RevNavigator como fuente comercial.

### AI-10 — QA, seguridad y release ✅
- Pruebas de tool use.
- Pruebas de permisos.
- Pruebas anti-hallucination.
- Regresión completa Fases 1–10.
- Pruebas de integración RevNavigator.
- Manual de operación de IA.

## Orden de autoridad
1. Reglas determinísticas de RGT.
2. Datos persistidos de RGT.
3. Señales comerciales provenientes de RevNavigator.
4. Cohere como capa de interpretación/propuesta.
5. Usuario como confirmación final de acciones con impacto.
