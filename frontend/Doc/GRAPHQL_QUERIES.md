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
