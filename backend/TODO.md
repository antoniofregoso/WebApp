# Tareas pendientes

## Renovación de sesión

- [ ] Reducir la duración del access token a 15 minutos.
- [ ] Agregar configuración para la duración del refresh token.
- [ ] Generar access token y refresh token durante el login.
- [ ] Crear una mutación GraphQL para renovar la sesión.
- [ ] Guardar únicamente el hash del refresh token en PostgreSQL.
- [ ] Implementar rotación: invalidar el refresh token usado y emitir uno nuevo.
- [ ] Permitir revocar sesiones al cerrar sesión, cambiar contraseña o deshabilitar un usuario.
- [ ] Detectar la reutilización de refresh tokens y revocar la sesión afectada.
- [ ] Definir una expiración absoluta para la sesión, además del tiempo de inactividad.

## Seguridad web

- [ ] Entregar el refresh token mediante una cookie `HttpOnly`, `Secure` y `SameSite`.
- [ ] Mantener el access token en memoria en el frontend.
- [ ] Configurar correctamente CORS y protección CSRF para el flujo con cookies.
- [ ] Agregar `issuer`, `audience`, `jti` y tipo de token a los JWT.
- [ ] Solicitar contraseña o MFA nuevamente para operaciones críticas.

## Frontend

- [ ] Solicitar automáticamente la renovación antes de expirar el access token o al recibir un `401`.
- [ ] Evitar múltiples solicitudes de refresh simultáneas.
- [ ] Repetir la petición original después de renovar el token.
- [ ] Cerrar la sesión y redirigir al login si la renovación falla.

## Logs de actividad de usuario

- [ ] Crear endpoint o mutación GraphQL de heartbeat/ping para el usuario autenticado.
- [ ] En cada ping, buscar el `UserLog` abierto del usuario (`status = ONLINE`, sin `end_date`) y actualizar `last_seen_at` con la hora del servidor.
- [ ] Hacer que el frontend envíe el ping cada 30-60 segundos mientras la sesión esté activa y la pestaña esté visible.
- [ ] Crear una tarea programada que marque como `OFFLINE` los logs sin ping reciente, usando un timeout definido, por ejemplo 2-5 minutos.
- [ ] Al cerrar automáticamente, usar `last_seen_at` como `end_date` para que `duration` no cuente tiempo inactivo.
- [ ] Probar login, logout explícito, cierre de pestaña/navegador, suspensión de laptop y múltiples pestañas.

## Base de datos y pruebas

- [ ] Crear el modelo y la migración para sesiones o refresh tokens.
- [ ] Probar expiración, rotación, revocación y reutilización de tokens.
- [ ] Probar múltiples dispositivos y sesiones concurrentes.
- [ ] Probar cookies y flujo de renovación en producción bajo HTTPS.
