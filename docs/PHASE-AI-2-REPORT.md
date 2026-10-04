# Fase AI-2 — Cohere Gateway + Configuración de IA

## Objetivo
Crear una única puerta de entrada para Cohere y una sección de configuración visible dentro de RGT Execution OS.

## Implementado
- `js/ai/aiConfig.js`: configuración local de proveedor, modelo y API key.
- `js/ai/cohereGateway.js`: Chat API V2, manejo de errores, timeout y Structured Outputs para prueba de conexión.
- `js/ui/aiSettings.js`: pantalla Configuración → Inteligencia Artificial.
- Nueva navegación `IA / Cohere`.
- Modelo predeterminado: `command-a-plus-05-2026`.
- Prueba de conexión estructurada (`status: ok`).
- API key nunca queda hardcodeada en código fuente.
- Gobernanza visible en UI.
- IndexedDB se eleva a versión 4 sin crear un store de credenciales; la configuración de IA no se mezcla con el backup de datos operativos.

## Seguridad y limitación conocida
La versión actual es GitHub Pages. La API key introducida en el navegador es accesible al cliente; por tanto, no debe considerarse un secreto de servidor. El gateway está desacoplado para que AI-2 pueda migrarse posteriormente a un backend/proxy seguro sin cambiar las capas superiores.

## Contrato con Cohere
Cohere Chat API V2 se utiliza como interfaz. Structured Outputs se usa en la prueba de conexión para validar una respuesta JSON. Tool Use/`strict_tools` queda preparado conceptualmente para fases posteriores; no se habilitan acciones de escritura en AI-2.

## No implementado intencionalmente
- Initiative Copilot.
- RGT Assistant.
- Escrituras automáticas.
- Tool execution.
- Pacing/Forecast/Reforecast/Recovery.
- Integración de RevNavigator.

## Validación
- Tests unitarios de configuración.
- Mock de fetch para conexión exitosa.
- Manejo de 401/403.
- Manejo de JSON inválido.
- Validación del endpoint y esquema Structured Outputs.
- `node --check` de todos los JS.
- Revisión de que la API key no esté en código fuente.
