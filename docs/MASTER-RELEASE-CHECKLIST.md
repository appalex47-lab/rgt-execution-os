# RGT Execution OS — Master Release Checklist v1.0

> Ejecutar después de publicar la aplicación en GitHub Pages/HTTPS. Esta lista es el gate de release de Fases 1–10.

## A. Foundation / navegación
- [ ] Abrir URL HTTPS de GitHub Pages sin errores de carga.
- [ ] Abrir Command Center, RGT Board, Planning, Deep Work, Weekly Review, Historial, Alertas, Execution Health y Backup & Datos.
- [ ] Recargar en cada vista sin perder datos.
- [ ] Probar desktop y móvil.
- [ ] Consola sin errores críticos.

## B. RGT Board / WIP
- [ ] RUN y GROW permiten ejecución sin límite artificial de 2.
- [ ] TRANSFORM permite hasta 2 WIP.
- [ ] Tercer TRANSFORM se bloquea.
- [ ] BLOCKED consume WIP.
- [ ] DONE/CANCELLED libera WIP.
- [ ] Cambios sobreviven recarga.

## C. Ready / DoD / Evidence
- [ ] Iniciativa incompleta no inicia.
- [ ] Iniciativa Ready completa inicia si WIP lo permite.
- [ ] DONE sin DoD completo se bloquea.
- [ ] Evidencia requerida sin evidencia se bloquea.
- [ ] DONE válido registra completed_at.
- [ ] CANCELLED exige motivo.

## D. Sprint / Must-Win
- [ ] Solo existe un Sprint ACTIVE.
- [ ] Cerrar Sprint conserva historia.
- [ ] Crear siguiente Sprint funciona.
- [ ] Must-Win contiene exactamente RUN + GROW + TRANSFORM.
- [ ] DONE/CANCELLED no son elegibles.
- [ ] Selección persiste.

## E. Deep Work
- [ ] TRANSFORM IN_PROGRESS tiene prioridad.
- [ ] RUN/BLOCKED no pueden iniciar Deep Work.
- [ ] Timer inicia en 120:00.
- [ ] Pausa/reanudación funcionan.
- [ ] Recarga conserva sesión activa.
- [ ] Finalización registra sesión e historial.
- [ ] Modo foco entra y sale correctamente.

## F. Weekly Review / Carry-over
- [ ] Las 4 preguntas obligatorias bloquean guardado incompleto.
- [ ] Review queda asociada al Sprint correcto.
- [ ] READY/IN_PROGRESS/BLOCKED pueden continuar.
- [ ] DONE/CANCELLED no se clonan.
- [ ] Carry-over conserva el mismo ID.

## G. Alertas / Execution Health
- [ ] WIP excedido genera alerta.
- [ ] BLOCKED genera alerta.
- [ ] DoD pendiente genera alerta.
- [ ] Sprint vencido genera alerta.
- [ ] Must-Win incompleto genera alerta.
- [ ] Execution Health cambia de forma determinística.

## H. RevNavigator / pacing
- [ ] RevNavigator sigue siendo la fuente de verdad comercial.
- [ ] RGT no calcula Forecast/Reforecast/Recovery propio.
- [ ] `RGT_PACING_UPDATE` válido puede recibirse.
- [ ] Mensajes externos inválidos se ignoran.
- [ ] Los datos comerciales externos no modifican WIP/DoD/estado de iniciativas.
- [ ] No crear una segunda versión de Pacing dentro de RGT.

## I. Backup / restore
- [ ] Exportar JSON válido.
- [ ] JSON inválido se rechaza sin modificar datos.
- [ ] IDs duplicados se rechazan.
- [ ] Referencias huérfanas se rechazan.
- [ ] Más de un Sprint ACTIVE se rechaza.
- [ ] Restauración requiere confirmación.
- [ ] Datos restaurados sobreviven recarga.
- [ ] BACKUP_RESTORED aparece en Historial.

## J. Release / GitHub Pages
- [ ] `.nojekyll` presente.
- [ ] No hay backend requerido.
- [ ] No hay dependencia de localhost en producción.
- [ ] ES Modules cargan por HTTPS.
- [ ] El repo publicado contiene `index.html` en la raíz.
- [ ] Se conserva el ZIP de release y su versión.

## Resultado
- [ ] Todos los puntos A–J ejecutados.
- [ ] Cero bloqueadores abiertos.
- [ ] Regresión completa aprobada.
- [ ] Release candidate aceptado.
