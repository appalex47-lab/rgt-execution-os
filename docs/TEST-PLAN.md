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

## Fase 4 — Planning Semanal + Sprint + Pacing + Must-Win
### Sprint
1. Con datos limpios, crear un Sprint ACTIVE con semana, inicio y fin.
2. Intentar crear otro Sprint ACTIVE: debe bloquearse.
3. Cerrar el Sprint: estado CLOSED y fecha de cierre persistidas.
4. Recargar: el Sprint cerrado y su información deben conservarse.
5. Crear un nuevo Sprint después del cierre: debe permitirse.
6. Intentar guardar fechas donde fin < inicio: debe bloquearse.
7. Sobre una instalación de Fase 3 existente, verificar migración a los nuevos campos de Sprint sin perder iniciativas, checklist, evidencia ni historial.

### Pacing comercial
8. Registrar meta mensual y venta acumulada.
9. Verificar `pacing = acumulado / meta mensual`.
10. Verificar días transcurridos y restantes contra el rango mensual configurado.
11. Verificar `venta diaria requerida = max(meta - acumulado, 0) / días restantes`.
12. Verificar CR y AOV se muestran como valores registrados, no como métricas inventadas.
13. Verificar meta Sprint y pacing Sprint se muestran separados del pacing mensual.

### Must-Win Battles
14. Seleccionar exactamente 1 iniciativa RUN, 1 GROW y 1 TRANSFORM.
15. Intentar guardar 2 Must-Win: debe bloquearse.
16. Intentar guardar dos iniciativas del mismo pilar: debe bloquearse.
17. Intentar seleccionar una iniciativa DONE/CANCELLED: debe bloquearse.
18. Guardar selección válida: debe persistir `must_win_ids` en Sprint y marcar las iniciativas seleccionadas.
19. Cambiar la selección y recargar: la nueva selección debe permanecer.
20. Dashboard debe mostrar permanentemente los 3 Battles y su pilar.
21. Verificar que un Must-Win no crea una iniciativa nueva ni altera su estado de ejecución.

### Persistencia / trazabilidad
22. Registrar cambios de Sprint y Must-Win y confirmar eventos en Execution Journal.
23. Recargar después de cada operación crítica y confirmar persistencia en IndexedDB.

### Regresión
24. Repetir WIP Transform 2/2 y comprobar que Fase 4 no lo altera.
25. Repetir Ready, DoD y Evidence de Fase 3.
26. Confirmar navegación, responsive y ausencia de errores críticos de JavaScript.
27. Probar carga mediante servidor HTTP y, antes de release, GitHub Pages/HTTPS.

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

## Fase 5 — Deep Work / Modo Foco
- [ ] Solo TRANSFORM/GROW IN_PROGRESS son elegibles.
- [ ] TRANSFORM tiene prioridad sobre GROW.
- [ ] RUN no puede iniciar Deep Work.
- [ ] BLOCKED no puede iniciar Deep Work.
- [ ] El bloque inicia en 120:00.
- [ ] Pausar conserva el tiempo acumulado.
- [ ] Recargar conserva una sesión IN_PROGRESS y su tiempo.
- [ ] Reanudar continúa desde el tiempo persistido.
- [ ] Finalizar registra ended_at y actual_minutes.
- [ ] Al llegar a 120:00 la sesión se completa.
- [ ] Las notas quedan persistidas.
- [ ] Inicio y finalización generan actividad.
- [ ] Modo foco oculta navegación/header y puede revertirse.
- [ ] Sesiones finalizadas aparecen en Deep Work.
- [ ] Regresión Fases 1–4.
- [ ] GitHub Pages carga módulos sin backend.

## Fase 6 — Weekly Review + Carry-over
- [ ] Weekly Review identifica el Sprint correcto.
- [ ] Las 4 preguntas obligatorias bloquean el guardado si falta alguna.
- [ ] Review queda persistida por `sprint_id`.
- [ ] Guardar de nuevo actualiza la review sin duplicarla.
- [ ] READY/IN_PROGRESS/BLOCKED son elegibles para carry-over.
- [ ] DONE/CANCELLED no son elegibles.
- [ ] Carry-over guarda IDs existentes, no crea copias.
- [ ] Carry-over conserva estado, DoD, evidencia e historial.
- [ ] Carry-over queda persistido en review y Sprint.
- [ ] Execution Journal registra revisión y cambios de carry-over.
- [ ] Recarga conserva revisión y carry-over.
- [ ] Regresión Fases 1–5.
- [ ] GitHub Pages carga sin backend.

## Fase 7 — Alertas Operativas + Puente de Pacing
- [ ] WIP TRANSFORM > 2 genera BLOCKER.
- [ ] Iniciativas BLOCKED generan WARNING.
- [ ] DoD pendiente genera INFO.
- [ ] Pacing < 80% genera WARNING según umbral documentado.
- [ ] Sprint activo vencido genera BLOCKER.
- [ ] Menos de 3 Must-Win genera WARNING.
- [ ] `RGT_PACING_UPDATE` se acepta con payload válido.
- [ ] Mensajes de otros tipos se ignoran.
- [ ] Datos de pacing externos no sustituyen los motores de ejecución.
- [ ] Regresión Fases 1–6.
- [ ] GitHub Pages carga sin backend.
- [ ] Prueba real de iframe/postMessage con RevNavigator cuando se construya el host.

## Fase 8 — Command Center + Execution Health
- [ ] Execution Health carga sin backend.
- [ ] Capacidad RGT refleja WIP TRANSFORM.
- [ ] Flujo refleja bloqueos.
- [ ] Entrega refleja DoD pendiente/completo.
- [ ] Foco refleja Must-Win configurados y completados.
- [ ] Estado STABLE/ATTENTION/AT_RISK es determinístico.
- [ ] Score permanece entre 0 y 100%.
- [ ] Recarga conserva datos de las fases anteriores.
- [ ] No se recalcula ni modifica el pacing comercial de RGT.
- [ ] Contrato externo `RGT_PACING_UPDATE` continúa intacto.
- [ ] Regresión Fases 1–7.
- [ ] GitHub Pages carga módulos sin backend.

## Fase 9 — Hardening + Backup / Import / Export
- [ ] Exportar backup genera JSON válido.
- [ ] Backup contiene metadata de formato, versión, schema y fecha.
- [ ] Backup contiene todos los stores activos de IndexedDB.
- [ ] Importar JSON inválido no modifica datos.
- [ ] Backup con IDs duplicados es rechazado.
- [ ] Backup con referencias huérfanas es rechazado.
- [ ] Backup con más de un Sprint ACTIVE es rechazado.
- [ ] Restauración requiere confirmación explícita.
- [ ] Restauración reemplaza los stores de forma atómica.
- [ ] Restauración conserva iniciativas, DoD, evidencia, Deep Work, Reviews e Historial.
- [ ] Después de restaurar, IndexedDB vuelve a abrir correctamente.
- [ ] La restauración registra BACKUP_RESTORED en Execution Journal.
- [ ] Recarga conserva los datos restaurados.
- [ ] RevNavigator sigue siendo fuente comercial; Fase 9 no crea ni recalcula pacing.
- [ ] Regresión Fases 1–8.
- [ ] GitHub Pages carga sin backend.
