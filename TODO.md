# Tareas pendientes

## 🔴 Urgente — Migración gradual del frontend a Preact

- [x] Instalar y configurar Preact con Vite y JSX.
- [x] Conservar los schemas GraphQL/JSON como fuente para generar las vistas dinámicas.
- [x] Migrar primero Home y Login sin interrumpir las rutas actuales.
- [x] Migrar Topbar y Sidebar con manejo automático del ciclo de vida.
- [x] Migrar el panel de notas, mensajes y documentos, eliminando inserciones inseguras con `innerHTML`.
- [x] Convertir cada tipo de campo del schema en un componente reutilizable.
- [x] Migrar gradualmente Kanban, Lista, Formulario y Calendario.
- [x] Cargar Quill y las librerías de gráficas mediante `import()` solo cuando se necesiten.
- [x] Mantener pruebas y build funcionales después de cada etapa; evitar una reescritura completa.

## Renovación de sesión

- [x] Reducir la duración del access token a 15 minutos.
- [x] Agregar configuración para la duración del refresh token.
- [x] Generar access token y refresh token durante el login.
- [x] Crear una mutación GraphQL para renovar la sesión.
- [x] Guardar únicamente el hash del refresh token en PostgreSQL.
- [x] Implementar rotación: invalidar el refresh token usado y emitir uno nuevo.
- [x] Permitir revocar sesiones al cerrar sesión, cambiar contraseña o deshabilitar un usuario.
- [x] Detectar la reutilización de refresh tokens y revocar la sesión afectada.
- [x] Definir una expiración absoluta para la sesión, además del tiempo de inactividad.

## Seguridad web

- [x] Entregar el refresh token mediante una cookie `HttpOnly`, `Secure` y `SameSite`.
- [x] Mantener el access token en memoria en el frontend.
- [x] Configurar correctamente CORS y protección CSRF para el flujo con cookies.
- [x] Agregar `issuer`, `audience`, `jti` y tipo de token a los JWT.
- [x] Solicitar contraseña o MFA nuevamente para operaciones críticas.

## Frontend

- [x] Solicitar automáticamente la renovación antes de expirar el access token o al recibir un `401`.
- [x] Evitar múltiples solicitudes de refresh simultáneas.
- [x] Repetir la petición original después de renovar el token.
- [x] Cerrar la sesión y redirigir al login si la renovación falla.

## Logs de actividad de usuario

- [x] Crear endpoint o mutación GraphQL de heartbeat/ping para el usuario autenticado.
- [x] En cada ping, buscar el `UserLog` abierto del usuario (`status = ONLINE`, sin `end_date`) y actualizar `last_seen_at` con la hora del servidor.
- [x] Hacer que el frontend envíe el ping cada 30-60 segundos mientras la sesión esté activa y la pestaña esté visible.
- [x] Crear una tarea programada que marque como `OFFLINE` los logs sin ping reciente, usando un timeout definido, por ejemplo 2-5 minutos.
- [x] Al cerrar automáticamente, usar `last_seen_at` como `end_date` para que `duration` no cuente tiempo inactivo.
- [x] Probar login, logout explícito, cierre de pestaña/navegador, suspensión de laptop y múltiples pestañas.

## Base de datos y pruebas

- [ ] Crear el modelo y la migración para sesiones o refresh tokens.
- [ ] Probar expiración, rotación, revocación y reutilización de tokens.
- [ ] Probar múltiples dispositivos y sesiones concurrentes.
- [ ] Probar cookies y flujo de renovación en producción bajo HTTPS.

## Archivos adjuntos

- [x] Implementar inicialmente un filestore local persistente para documentos e imágenes asociados a los registros.
- [x] Guardar en PostgreSQL únicamente los metadatos y la ruta relativa del archivo, nunca el contenido binario.
- [x] Mantener el acceso al almacenamiento detrás de una interfaz intercambiable para evitar acoplar el dominio al disco local.
- [ ] Antes de producción, migrar el filestore a un bucket privado de Cloudflare R2.
- [ ] En producción, subir y descargar mediante URLs firmadas de corta duración, conservando la validación de permisos en el backend.
- [ ] Preparar y verificar la migración de archivos locales a R2, incluyendo checksums, conteo de objetos y estrategia de respaldo/rollback.
