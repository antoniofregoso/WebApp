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

## Buscador global declarativo

Diseño aprobado: [Doc/AI_SEARCH_DESIGN.md](./Doc/AI_SEARCH_DESIGN.md).

### Primera fase implementada

- [x] Agregar `SystemModel.search` y `SystemModelField.search_config` como metadatos persistentes.
- [x] Cargar la configuración declarativa desde `system_models.json`.
- [x] Crear y aplicar la migración Alembic del buscador.
- [x] Implementar la búsqueda textual global solo sobre modelos y campos habilitados.
- [x] Reutilizar el alcance de registros por usuario de las vistas actuales.
- [x] Exponer la consulta GraphQL `systemSearch`.
- [x] Conectar el buscador del topbar con estados de carga, error, vacío y resultados.
- [x] Agregar enlaces directos desde los resultados hacia cada registro.
- [x] Habilitar inicialmente tareas y mensajes.
- [x] Documentar el formato declarativo en `Doc/DATA_FORMAT.md`.

### Contrato y seguridad pendientes

- [ ] Crear los modelos Pydantic `SearchPlanV1`, `ModelSearchQuery`, `FilterGroup`, `SearchFilter` y `SearchOrder` con campos extra prohibidos.
- [ ] Implementar el registro seguro `SEARCH_MODEL_REGISTRY` con clase ORM, política de autorización y constructor de URL.
- [ ] Crear `SearchAuthorizationPolicy` y pruebas de equivalencia entre resultados visibles en vistas y búsqueda.
- [ ] Aplicar autorización también a modelos relacionados usados en filtros.
- [ ] Validar modelos, campos, operadores, relaciones, límites y orden antes de ejecutar cualquier plan.
- [ ] Implementar filtros parametrizados por tipo, incluyendo selections localizadas, fechas relativas y relaciones.
- [ ] Resolver fechas con zona horaria IANA y convertir límites a UTC.
- [ ] Agregar respuestas y errores GraphQL tipados: `OK`, `PARTIAL`, `NEEDS_CLARIFICATION` y `FAILED`.
- [ ] Agregar límites de modelos, filtros, profundidad de relaciones, tiempo y cantidad de resultados.
- [ ] Registrar auditoría de búsquedas sin conservar texto sensible por defecto.

### Interpretación con IA pendiente

- [ ] Definir la interfaz `SearchInterpreter` independiente del proveedor.
- [ ] Generar `SearchableSchemaV1` únicamente con modelos y campos autorizados.
- [ ] Implementar un adaptador de referencia configurable mediante secretos del backend.
- [ ] Convertir preguntas naturales en `SearchPlanV1`; la IA nunca debe generar ni ejecutar SQL.
- [ ] Validar localmente toda salida del proveedor antes de consultar PostgreSQL.
- [ ] Implementar los modos `AUTO`, `TEXT` y `AI` con fallback explícito de IA a texto.
- [ ] Implementar aclaraciones stateless mediante pregunta original y respuesta del usuario.
- [ ] Agregar timeout, cancelación y manejo de proveedor no configurado o no disponible.
- [ ] Crear evaluaciones en español e inglés para consultas, fechas, relaciones, ambigüedad y permisos.

### Rendimiento y evolución pendientes

- [ ] Crear un benchmark reproducible con 100 000 registros por modelo y 10 clientes concurrentes.
- [ ] Agregar índices `pg_trgm` si la coincidencia textual actual no cumple el objetivo de latencia.
- [ ] Implementar PostgreSQL Full Text Search con `tsvector`, ranking e índices GIN cuando las métricas lo justifiquen.
- [ ] Crear texto normalizado e indexable para campos HTML antes de permitir buscarlos.
- [ ] Decidir si la primera versión incluirá notas y nombres de archivos adjuntos.
- [ ] Evaluar embeddings únicamente si filtros y texto completo no resuelven búsquedas conceptuales reales.

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
