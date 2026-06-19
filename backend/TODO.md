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

## Base de datos y pruebas

- [ ] Crear el modelo y la migración para sesiones o refresh tokens.
- [ ] Probar expiración, rotación, revocación y reutilización de tokens.
- [ ] Probar múltiples dispositivos y sesiones concurrentes.
- [ ] Probar cookies y flujo de renovación en producción bajo HTTPS.
