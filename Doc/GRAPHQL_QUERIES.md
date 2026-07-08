# GraphQL queries

Todas las queries protegidas requieren enviar el token JWT en el header:

```http
Authorization: Bearer <token>
```

Endpoint:

```text
/graphql
```

## Usuario actual

Retorna el usuario autenticado a partir del token.

```graphql
query Me {
  me {
    id
    uuid
    name
    email
    avatarUrl
    theme
    lang
    active
  }
}
```

## Logs de actividad

Retorna los logs de actividad del usuario autenticado. Es de solo lectura para el frontend: no hay mutaciones publicas para crear o modificar logs.

```graphql
query UserLogs($limit: Int = 20) {
  userLogs(limit: $limit) {
    uuid
    status
    startDate
    lastSeenAt
    endDate
    duration
    createdAt
  }
}
```

Obtiene un log por UUID, solo si pertenece al usuario autenticado.

```graphql
query UserLog($logUuid: UUID!) {
  userLog(logUuid: $logUuid) {
    uuid
    status
    startDate
    lastSeenAt
    endDate
    duration
    createdAt
  }
}
```

Estados de log:

```text
Online
Offline
```

Campos principales:

- `startDate`: inicio de la sesion/log.
- `lastSeenAt`: ultimo ping recibido por backend.
- `endDate`: cierre real o automatico del log.
- `duration`: duracion calculada en milisegundos.

## Contadores pendientes

Retorna el numero de mensajes y alertas pendientes de leer para el usuario autenticado.

```graphql
query SystemPendingCounts {
  systemPendingCounts {
    messages
    notifications
  }
}
```

Criterio del backend:

- `messages`: mensajes donde el usuario autenticado esta en `toUsers` y `status != Read`.
- `notifications`: alertas directas o grupales del usuario autenticado y `status != read`.

## Modelos system

Lista los modelos declarativos disponibles.

```graphql
query SystemModels {
  systemModels {
    uuid
    name
    createdAt
    fields {
      uuid
      name
      sequence
      type
      required
      readonly
      placeholder
      help
    }
    schemas {
      uuid
      name
      use
      view
    }
  }
}
```

Obtiene un modelo por UUID.

```graphql
query SystemModel($modelUuid: UUID!) {
  systemModel(modelUuid: $modelUuid) {
    uuid
    name
    createdAt
    fields {
      uuid
      name
      type
      required
      readonly
    }
    schemas {
      uuid
      name
      use
      view
    }
  }
}
```

Obtiene un modelo por nombre.

```graphql
query SystemModelByName($name: String!) {
  systemModelByName(name: $name) {
    uuid
    name
    fields {
      uuid
      name
      type
    }
    schemas {
      uuid
      name
      use
      view
    }
  }
}
```

Obtiene la definición completa de vista de un modelo y los registros necesarios
para renderizarla. Une `system.model`, `system.model.schema` y los registros del
objeto solicitado.

```graphql
query SystemModelView($model: String!, $use: SystemModelSchemaUse!, $name: String!) {
  systemModelView(model: $model, use: $use, name: $name) {
    model
    records
  }
}
```

Ejemplo de variables:

```json
{
  "model": "user.user",
  "use": "view",
  "name": "default"
}
```

La respuesta tiene esta forma:

```json
{
  "model": {
    "name": "user.user",
    "label": {
      "es": "Usuarios",
      "en": "Users"
    },
    "groupBy": "user_type",
    "user_type": [],
    "tags": [],
    "schema": []
  },
  "records": []
}
```

## Mensajes

Lista mensajes ordenados por `date` descendente.

```graphql
query SystemMessages {
  systemMessages {
    uuid
    status
    date
    subject
    message
    createdAt
    fromUser {
      uuid
      name
      email
    }
    toUsers {
      uuid
      name
      email
    }
  }
}
```

Obtiene un mensaje por UUID.

```graphql
query SystemMessage($messageUuid: UUID!) {
  systemMessage(messageUuid: $messageUuid) {
    uuid
    status
    date
    subject
    message
    createdAt
    fromUser {
      uuid
      name
      email
    }
    toUsers {
      uuid
      name
      email
    }
  }
}
```

Estados de mensaje:

```text
Sent
Delivered
Received
Read
Replied
Forwarded
Archived
Deleted
Failed
Draft
```

## Alertas

Lista alertas ordenadas por `date` descendente.

```graphql
query SystemNotifications {
  systemNotifications {
    uuid
    date
    status
    title
    message
    read
    active
    sequence
    color
    createdAt
    user {
      uuid
      name
      email
    }
    users {
      uuid
      name
      email
    }
  }
}
```

Obtiene una alerta por UUID.

```graphql
query SystemNotification($notificationUuid: UUID!) {
  systemNotification(notificationUuid: $notificationUuid) {
    uuid
    date
    status
    title
    message
    read
    active
    sequence
    color
    createdAt
    user {
      uuid
      name
      email
    }
    users {
      uuid
      name
      email
    }
  }
}
```

Estados de alerta:

```text
sent
delivered
read
```

## Tareas

Lista las tareas ordenadas primero por `sequence` ascendente y despues por
`createdAt` descendente.

```graphql
query SystemTasks {
  systemTasks {
    uuid
    status
    color
    sequence
    title
    description
    priority
    dateAssign
    dateDue
    createdAt
    user {
      uuid
      name
      email
    }
  }
}
```

Obtiene una tarea por UUID.

```graphql
query SystemTask($taskUuid: UUID!) {
  systemTask(taskUuid: $taskUuid) {
    uuid
    status
    color
    sequence
    title
    description
    priority
    dateAssign
    dateDue
    createdAt
    user {
      uuid
      name
      email
    }
  }
}
```

Variables:

```json
{
  "taskUuid": "00000000-0000-0000-0000-000000000000"
}
```

Estados de tarea:

```text
pending
in_progress
completed
failed
```

Prioridades:

```text
low
medium
high
urgent
```

Colores disponibles para tareas y alertas:

```text
zinc
red
blue
purple
green
orange
```

`title` y `description` son objetos JSON traducibles, por ejemplo:

```json
{
  "es_MX": "Revisar reporte",
  "en_US": "Review report"
}
```
