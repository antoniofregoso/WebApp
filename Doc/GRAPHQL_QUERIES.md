# GraphQL Reference

Every protected operation requires a JWT in the request header:

```http
Authorization: Bearer <token>
```

Endpoint:

```text
/graphql
```

## Queries

### 1. KPIs

The named `userLogs` insight calculates user activity indicators from persisted
`user_logs`. It does not use seed values or static JSON. The query is restricted
to administrators and scopes human users to the administrator's company.

```graphql
query UserLogsInsight($period: String = "today") {
  systemModelView(
    model: "system.insight"
    use: insight
    name: "userLogs"
    period: $period
  ) {
    model
    records
  }
}
```

The hydrated insight is returned in `model.schema`. Its `kpis`, `gauges`, and
`graphics` arrays contain complete output objects in the order declared by
`system_model_schemas.json`; `records` is empty for insight schemas.

Allowed periods:

```text
today
weekly
monthly
yearly
annual
```

The JSON response contains these items under `kpis`:

| ID                               | Value                                              |
| -------------------------------- | -------------------------------------------------- |
| `kpiUsersOnline`                 | Users with a current, non-stale online session     |
| `kpiUsersAverageSessionTime`     | Average session duration in minutes                |
| `kpiUsersActiveUsers`            | Distinct users active during the selected period   |
| `kpiRecurringUsers`              | Users with at least two sessions during the period |

Each KPI follows this shape:

```json
{
  "id": "kpiUsersOnline",
  "name": { "en": "Online Users", "es": "Usuarios en línea" },
  "value": 0,
  "unit": "Users",
  "trend": "up"
}
```

`value` and `trend` are calculated at request time. The numeric value above only
documents the response type.

### 2. Gauges

The user activity query does not currently generate gauges. When gauges are
added, they must be returned under `gauges` and use IDs beginning with `gauge`.

```json
{
  "id": "gaugeName",
  "name": { "en": "Gauge name", "es": "Nombre del indicador" },
  "value": 0,
  "unit": "%",
  "max": 100,
  "thresholds": { "green": 80, "yellow": 60, "red": 0 }
}
```

### 3. Graphics

The same `systemModelView` query returns these items under
`model.schema.graphics`:

| ID                      | Type      | Value                                              |
| ----------------------- | --------- | -------------------------------------------------- |
| `graphicUsersPerHour`   | `heatmap` | Distinct active users grouped by weekday and hour  |
| `graphicUsersMAU`       | `bar`     | Monthly active users within the selected period    |

The heat map contains seven localized weekday rows and 24 localized hour
points per row. The MAU chart contains calculated values and matching localized
month categories. Both structures conform to
[Insights format](./INSIGHTS_FORMAT.md).

### Other platform queries

#### Current user

Returns the user associated with the access token.

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

#### Activity logs

Returns activity logs for the authenticated user. Activity logs are read-only;
the public API does not expose mutations to create or modify them.

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

Returns one log by UUID when it belongs to the authenticated user.

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

Log statuses:

```text
Online
Offline
```

Main fields:

- `startDate`: session start time.
- `lastSeenAt`: most recent heartbeat received by the backend.
- `endDate`: explicit or automatic session end time.
- `duration`: calculated duration in milliseconds.

#### Pending counters

Returns unread message and notification counts for the authenticated user.

```graphql
query SystemPendingCounts {
  systemPendingCounts {
    messages
    notifications
  }
}
```

Backend criteria:

- `messages`: the user appears in `toUsers` and `status != Read`.
- `notifications`: direct or group notifications for the user with `status != read`.

#### System models

Lists the available declarative models.

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

Returns a model by UUID.

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

Returns a model by name.

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

Returns a complete model view definition and the records required to render it.
The response combines the system model, its schema, and the requested business
records.

```graphql
query SystemModelView(
  $model: String!
  $use: SystemModelSchemaUse!
  $name: String!
) {
  systemModelView(model: $model, use: $use, name: $name) {
    model
    records
  }
}
```

Example variables:

```json
{
  "model": "user.user",
  "use": "view",
  "name": "default"
}
```

Response shape:

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

#### Messages

Lists messages ordered by `date` descending.

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

Returns a message by UUID.

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

Message statuses:

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

#### Notifications

Lists notifications ordered by `date` descending.

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

Returns a notification by UUID.

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

Notification statuses:

```text
sent
delivered
read
```

#### Tasks

Lists tasks ordered by `sequence` ascending and then by `createdAt` descending.

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

Returns a task by UUID.

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

Task statuses:

```text
pending
in_progress
completed
failed
```

Priorities:

```text
low
medium
high
urgent
```

Colors available for tasks and notifications:

```text
zinc
red
blue
purple
green
orange
```

`title` and `description` are localizable JSON objects:

```json
{
  "es_MX": "Revisar reporte",
  "en_US": "Review report"
}
```
