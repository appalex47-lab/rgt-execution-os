# RGT Execution OS — Plan maestro de pruebas

La aplicación debe validarse por fase y además con una regresión acumulada antes de pasar a la siguiente fase.

## Fase 1 — Foundation
### Pruebas técnicas
- Abrir `index.html` mediante HTTP local.
- Verificar carga de ES Modules sin errores en consola.
- Verificar creación de IndexedDB y stores.
- Recargar y confirmar que los datos seed persisten.
- Verificar navegación entre las vistas base.
- Verificar responsive en desktop/tablet/móvil.

### Pruebas funcionales
- Dashboard muestra sprint y KPIs.
- RGT Board muestra RUN/GROW/TRANSFORM.
- Planning, Deep Work, Weekly Review e Historial cargan sin error.
- Smoke tests pasan.

## Fase 2 — RGT Board + WIP
### Pruebas funcionales
1. Mover una iniciativa RUN → GROW.
2. Mover GROW → TRANSFORM.
3. Cambiar BACKLOG → READY → IN_PROGRESS.
4. Con 2 TRANSFORM ocupados, intentar iniciar una tercera: debe bloquearse.
5. Poner un TRANSFORM en BLOCKED: WIP debe seguir siendo 2/2.
6. Pasar un TRANSFORM a DONE/CANCELLED: WIP debe liberarse.
7. Recargar la página: cambios deben permanecer.
8. Revisar Historial: cada cambio debe quedar registrado.
9. Verificar que RUN/GROW no reciben artificialmente el límite 2.
10. Probar drag & drop y cambio de estado en móvil/desktop según el mecanismo soportado.

## Fase 3 — Initiative + Ready/DoD/Evidence
### Definition of Ready
1. Crear iniciativa en BACKLOG.
2. Intentar iniciarla sin objetivo: debe bloquearse.
3. Completar nombre, descripción, pilar, objetivo, éxito, responsable, dependencias y DoD: debe permitir iniciar.
4. Intentar iniciar TRANSFORM con WIP lleno: debe bloquearse.

### Definition of Done
5. Intentar DONE sin checklist DoD: bloquear.
6. Tener DoD incompleto: bloquear.
7. Completar todos los requisitos DoD: permitir continuar si no se requiere evidencia.
8. Para iniciativa con evidencia obligatoria, intentar DONE sin evidencia: bloquear.
9. Agregar evidencia y volver a DONE: permitir.
10. Al completar, `completed_at` debe registrarse y WIP debe liberarse automáticamente.

### Cancelación
11. Intentar cancelar sin motivo: bloquear.
12. Cancelar con motivo: estado CANCELLED, motivo persistido y WIP liberado.

### Persistencia / trazabilidad
13. Recargar y confirmar iniciativa, checklist y evidencia.
14. Confirmar eventos en Execution Journal.

## Fases 4–10
Cada fase deberá agregar aquí sus pruebas específicas al momento de implementarse. No se considerará una fase terminada hasta que:
- implementación completada;
- pruebas técnicas pasen;
- pruebas funcionales de la fase pasen;
- pruebas de persistencia pasen cuando aplique;
- regresión de todas las fases anteriores pase;
- validación visual/responsive pase;
- compatibilidad con GitHub Pages sea comprobada.

## Prueba de regresión acumulada
Antes de cada release:
- navegación completa;
- IndexedDB/persistencia;
- WIP;
- Ready;
- DoD;
- evidencia;
- estados;
- historial;
- responsive;
- consola sin errores críticos;
- carga mediante HTTPS/GitHub Pages.

## Prueba final de release
La Fase 10 deberá entregar un checklist ejecutable completo, con pasos numerados y resultado esperado para cada prueba de Fases 1–10.
