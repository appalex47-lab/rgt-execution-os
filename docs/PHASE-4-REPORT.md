# RGT Execution OS — Fase 4 Report

## Objetivo
Implementar el control semanal comercial: Sprint, pacing, Must-Win Battles y su integración con Command Center.

## Implementado

### 1. Sprint
- Campos de semana, año, inicio, fin y estado `ACTIVE/CLOSED`.
- Solo puede existir un Sprint `ACTIVE`.
- Cierre con `closed_at`.
- Creación de nuevo Sprint solo después de cerrar el activo.
- Persistencia en IndexedDB.

### 2. Pacing
Se separan explícitamente:
- Meta mensual.
- Venta acumulada.
- Pacing mensual.
- Meta del Sprint.
- Pacing del Sprint.
- CR actual/target.
- AOV actual/target.
- Días transcurridos y restantes.
- Venta diaria requerida.

Fórmula principal:
`Pacing = Venta acumulada / Meta mensual`

`Venta diaria requerida = max(Meta mensual - Venta acumulada, 0) / días restantes`

### 3. Must-Win Battles
- Exactamente 3.
- 1 RUN + 1 GROW + 1 TRANSFORM.
- Solo iniciativas en `READY`, `IN_PROGRESS` o `BLOCKED`.
- Cada selección debe apuntar a una iniciativa existente.
- La selección queda almacenada en `sprint.must_win_ids`.
- Las iniciativas seleccionadas conservan su estado normal; Must-Win es una dimensión de prioridad, no un nuevo status.

### 4. Dashboard
- Pacing mensual visible en la parte superior.
- Venta diaria requerida.
- Días restantes.
- 3 Must-Win Battles.
- Estado ACTIVE/CLOSED del Sprint.
- Meta y pacing del Sprint.

### 5. Migración
IndexedDB sube a versión 2 y normaliza datos de una instalación previa de Fase 3:
- Sprint recibe estado/fechas/campos comerciales faltantes.
- Se recuperan Must-Win existentes a partir de `is_must_win`.
- No se eliminan iniciativas, checklist, evidencia ni actividad.

## Pruebas ejecutadas

- `node --check` sobre JavaScript de aplicación y pruebas: PASS.
- Tests puros de `sprintEngine` + `mustWinEngine`: PASS.
- Validación de regla de un único Sprint ACTIVE: PASS.
- Validación de Must-Win 1 por pilar: PASS.
- Validación de estados elegibles: PASS.
- Validación de cálculo de pacing: PASS.

## Limitación del entorno
La prueba de servidor HTTP local no pudo establecer conexión desde el entorno de ejecución, aunque los archivos y módulos pasaron validación sintáctica. La validación final de navegador debe ejecutarse manualmente con `python -m http.server 8000` y en GitHub Pages.

## Estado
Fase 4 implementada y documentada. La validación manual de navegador/GitHub Pages queda como prueba de aceptación antes de declarar el release final.
