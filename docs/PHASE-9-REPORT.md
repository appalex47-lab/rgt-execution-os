# Fase 9 — Hardening + Backup / Import / Export

## Alcance
Fase 9 protege la continuidad de datos locales y permite exportar/restaurar el estado completo de RGT.

## Implementado
- Motor de backup versionado.
- Validación de formato y versión.
- Validación de IDs duplicados.
- Validación de referencias entre stores.
- Validación de único Sprint ACTIVE.
- Exportación JSON descargable.
- Importación con validación previa.
- Restauración mediante transacción IndexedDB sobre todos los stores.
- Confirmación explícita antes de reemplazar datos.
- Registro de `BACKUP_RESTORED` en Execution Journal.
- Vista `Backup & Datos`.
- Compatibilidad con GitHub Pages y sin backend.

## Regla comercial
No se agregó ningún motor de pacing. RevNavigator continúa siendo la fuente de verdad comercial; el puente `RGT_PACING_UPDATE` permanece intacto.

## Pruebas
- Tests unitarios de backup: PASS.
- `node --check` de JS: PASS.
- Validación HTTP estática: PASS.
- Prueba visual completa en navegador/GitHub Pages: pendiente de ejecución manual.
