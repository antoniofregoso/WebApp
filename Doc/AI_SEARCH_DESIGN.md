# Diseño: buscador declarativo con lenguaje natural

Fecha: 2026-07-12  
Estado: APROBADO  
Modo: Builder  
Decisión aprobada: compilador de búsqueda declarativo

## Estado de implementación

Implementado el 2026-07-12:

- Metadatos persistentes `SystemModel.search` y `SystemModelField.search_config`.
- Migración y carga inicial desde `system_models.json`.
- Búsqueda textual global con permisos reutilizados de las vistas.
- Query GraphQL `systemSearch`.
- Panel de resultados y navegación desde el buscador del topbar.
- Tareas y mensajes como modelos iniciales habilitados.

Pendiente:

- `SearchPlanV1`, filtros estructurados e interpretación con IA.
- Aclaraciones, adaptador de proveedor y evaluaciones bilingües.
- PostgreSQL Full Text Search, condicionado a métricas.

## Problema

WebApp es una plantilla para generar aplicaciones con modelos y vistas definidos
mediante schemas. El buscador debe funcionar automáticamente con cualquier modelo
que declare `search: true`, sin agregar lógica específica por cada aplicación.

El usuario podrá escribir preguntas como:

> Muéstrame las tareas urgentes de Antonio que vencen esta semana.

La IA no responderá usando conocimiento inventado ni generará SQL. Su única función
será convertir la pregunta en un `SearchPlan` estructurado. El backend validará el
plan contra los schemas, aplicará permisos y consultará PostgreSQL.

## Objetivos

- Descubrir automáticamente todos los modelos con `search: true`.
- Permitir búsqueda tradicional y preguntas en lenguaje natural.
- Aplicar los mismos permisos que utilizan las vistas normales.
- Devolver registros reales, identificables y enlazables.
- Mantener el proveedor de IA como dependencia opcional e intercambiable.
- Permitir que una webapp desactive por completo las funciones de IA.

## Fuera del alcance inicial

- Embeddings y almacenamiento vectorial.
- Búsqueda dentro del contenido binario de archivos adjuntos.
- Generación de respuestas sin referencias a registros.
- Ejecución de modificaciones o eliminaciones desde el buscador.
- SQL generado por el modelo de IA.

## Premisas aprobadas

1. Solo participan modelos con `search: true`.
2. Solo se exponen campos expresamente permitidos para búsqueda.
3. La IA produce JSON ajustado a un contrato estricto.
4. El backend valida modelo, campos, operadores, relaciones y permisos.
5. Los resultados incluyen enlaces a registros reales.
6. Las consultas ambiguas solicitan aclaración antes de ejecutarse.
7. La búsqueda tradicional sigue disponible cuando la IA está desactivada.

## Configuración declarativa

### Fuente canónica

La fuente canónica de búsqueda será `system_models.json`, no el schema de vistas.
`system_model_schemas.json` continúa controlando únicamente presentación. El proceso
de seed persiste la configuración en PostgreSQL:

- `SystemModel.search`: booleano, `false` por defecto.
- `SystemModelField.search_config`: JSONB, `{}` por defecto.

Toda modificación requiere migración de Alembic, actualización del seed y prueba de
sincronización. La base persistida es la fuente de ejecución; el JSON es la fuente
versionada para instalaciones nuevas. No se duplicará `search` en los schemas de
vista.

### Modelo habilitado

`search` se agrega a la definición de `system.model` y su valor predeterminado es
`false`.

```json
{
    "name": "system.task",
    "label": {
        "es_MX": "Tareas",
        "en_US": "Tasks"
    },
    "search": true
}
```

### Campos consultables

La propiedad `search` de cada campo controla lo que el buscador puede interpretar,
filtrar y mostrar. Si se omite o es `false`, el campo no sale del backend hacia el
proveedor de IA.

```json
{
    "name": "title",
    "type": "string",
    "search": {
        "enabled": true,
        "text": true,
        "result": "title",
        "weight": "A"
    }
}
```

```json
{
    "name": "date_due",
    "type": "datetime",
    "search": {
        "enabled": true,
        "filter": true,
        "operators": ["eq", "before", "after", "between", "this_week"]
    }
}
```

```json
{
    "name": "user_id",
    "type": "many2one_avatar",
    "model": "user.user",
    "search": {
        "enabled": true,
        "filter": true,
        "relation_fields": ["name", "email"]
    }
}
```

### Configuración mínima recomendada

- `enabled`: permite usar el campo.
- `text`: incluye el campo en búsqueda textual.
- `filter`: permite filtros estructurados.
- `result`: define si será título, subtítulo o fragmento del resultado.
- `weight`: prioridad `A`, `B`, `C` o `D` para relevancia textual.
- `operators`: reduce explícitamente los operadores permitidos.
- `relation_fields`: limita los campos navegables de una relación.

## SearchPlan v1

El proveedor de IA debe producir exclusivamente este contrato. El backend nunca
acepta una expresión SQL dentro del plan.

```json
{
    "version": 1,
    "intent": "search_records",
    "queries": [
        {
            "model": "system.task",
            "text": null,
            "filters": {
                "and": [
                    { "field": "priority", "operator": "eq", "value": "Urgent" },
                    { "field": "user_id.name", "operator": "contains", "value": "Antonio" },
                    { "field": "date_due", "operator": "this_week", "value": null }
                ]
            },
            "order": [
                { "field": "date_due", "direction": "asc" }
            ],
            "limit": 20
        }
    ],
    "needs_clarification": false,
    "clarification_question": null
}
```

### Límites del contrato

- `version` permite evolucionar el contrato sin romper aplicaciones existentes.
- `queries` contiene entre 1 y 5 subplanes; cada subplan pertenece a un modelo.
- Solo se admite un nivel lógico: `{ "and": [...] }` o `{ "or": [...] }`, nunca
  árboles arbitrariamente anidados. El valor predeterminado es `and`.
- Cada subplan admite hasta 10 filtros, 3 órdenes y 20 resultados. El servidor
  impone un máximo global de 50 resultados.
- Un campo de orden debe declarar `search.filter: true` y usar un tipo ordenable.
- Los resultados se agrupan por modelo. No se compara `score` entre modelos.
- No se admiten propiedades para tablas, columnas físicas ni SQL ejecutable. Los
  valores de usuario sí pueden contener palabras como `SELECT` o `DROP`; siempre se
  tratan como datos parametrizados.
- Las fechas relativas se resuelven usando la zona horaria y el idioma del usuario.
- Un plan inválido se rechaza; no se intenta corregir silenciosamente.

### Contrato normativo

`SearchPlanV1`, `ModelSearchQuery`, `FilterGroup`, `SearchFilter` y `SearchOrder`
serán modelos Pydantic con `extra="forbid"`. Sus enums contienen únicamente los
operadores de esta especificación. El JSON Schema se genera desde Pydantic y es el
mismo que recibe el adaptador de IA. Son obligatorios `version`, `intent`, `queries`,
`needs_clarification` y `clarification_question`; los demás defaults los asigna el
backend. Ninguna salida se ejecuta antes de pasar validación Pydantic y validación
contra metadatos persistidos.

Cuando `needs_clarification` es `true`, `queries` debe ser `[]` y
`clarification_question` es obligatorio. Cuando es `false`, `queries` contiene entre
1 y 5 elementos y `clarification_question` debe ser `null`.

Ejemplos rechazados: un modelo sin `search`, un campo inexistente, un operador fuera
del enum, más de 5 subplanes, propiedades desconocidas y una relación no autorizada.

### Forma de los valores

| Operador | Forma de `value` |
|---|---|
| `eq`, `gt`, `gte`, `lt`, `lte`, `before`, `after`, `contains`, `starts_with` | Un escalar compatible con el tipo terminal |
| `in`, `not_in`, `contains_any`, `contains_all` | Arreglo de 1 a 20 escalares, sin duplicados |
| `between` | Arreglo exacto `[inicio, fin]`, donde inicio no supera fin |
| `today`, `this_week`, `this_month` | `null` |

Fechas usan ISO 8601; datetimes deben incluir offset. Decimales viajan como strings
decimales para evitar pérdida de precisión. `eq: null` no está permitido: los filtros
de nulos se agregarían en una versión posterior con operadores explícitos. Strings
tienen un máximo de 500 caracteres.

## Operadores por tipo

| Tipo | Operadores iniciales |
|---|---|
| `string`, `text`, `html` | `eq`, `contains`, `starts_with` |
| `selection`, `status_badge`, `color` | `eq`, `in`, `not_in` |
| `integer`, `decimal`, `monetary`, `percentage` | `eq`, `gt`, `gte`, `lt`, `lte`, `between` |
| `boolean` | `eq` |
| `date`, `datetime` | `eq`, `before`, `after`, `between`, `today`, `this_week`, `this_month` |
| `many2one`, `many2one_avatar` | `eq`, `in` y campos relacionados permitidos |
| `many2many`, `many2many_pills` | `contains_any`, `contains_all` |

El validador calcula esta lista a partir del tipo y después la restringe con
`search.operators` cuando el schema lo declare.

Para `user_id.name`, los operadores derivan del tipo terminal `name`, pero la ruta
solo es válida si `user_id.search.relation_fields` contiene `name` y el campo
`user.user.name` también está habilitado. `relation_fields` nunca amplía permisos.
Además, el compilador aplica la política de autorización del modelo relacionado
dentro del `EXISTS`. Un campo sensible no puede habilitarse aunque pertenezca a una
relación autorizada. Si el modelo relacionado no tiene política registrada, se
rechaza la ruta completa.

## Resolución temporal y localización

- `today`, `this_week` y `this_month` se calculan en la zona horaria del usuario y
  después se convierten a límites UTC para PostgreSQL.
- `this_week` usa semana ISO, lunes 00:00 incluido a lunes siguiente excluido.
- Las etiquetas localizadas de selections se resuelven al valor técnico antes de
  compilar. “Urgente” se convierte en `Urgent`.
- Primero se intenta coincidencia exacta con el valor técnico y después con la
  etiqueta localizada en el idioma del usuario.
- Si dos valores localizados coinciden, el plan requiere aclaración.
- La zona debe ser un identificador IANA válido. Si falta, se usa la zona configurada
  por la aplicación; si también falta, se usa `UTC`, nunca la zona del servidor.

## Catálogo para el intérprete

`SearchableSchemaV1` contiene versión, idioma, zona horaria y hasta 20 modelos. Por
modelo incluye nombre técnico, label localizado y hasta 50 campos con nombre, tipo,
label, ayuda resumida, operadores, valores de selection y relaciones permitidas.
No incluye registros ni valores reales. Si la instalación supera 20 modelos, el
backend primero busca coincidencia exacta normalizada entre palabras de la consulta y
nombre técnico, label o alias declarados. Solo reduce el catálogo cuando existe una
coincidencia exacta única. Si no existe, o varias coinciden, devuelve
`NEEDS_CLARIFICATION` con hasta 10 opciones de modelo; nunca excluye silenciosamente
modelos por similitud difusa. El catálogo completo también se valida con Pydantic
antes de enviarse.

## Arquitectura recomendada

```text
TopbarSearch
    │
    ├── búsqueda tradicional ───────────────┐
    │                                       │
    └── pregunta natural                    │
            │                               │
            ▼                               │
      SearchInterpreter                    │
      (adaptador de IA)                     │
            │ SearchPlan                    │
            ▼                               │
      SearchPlanValidator ◄── schemas + permisos
            │ plan validado                 │
            ▼                               │
      SearchQueryCompiler ◄─────────────────┘
            │ consulta parametrizada
            ▼
        PostgreSQL
            │
            ▼
      SearchResult[] + enlaces
```

### Backend

- `SearchSchemaService`: descubre modelos y campos habilitados.
- `SearchInterpreter`: interfaz independiente del proveedor de IA.
- `SearchPlanValidator`: valida el plan y devuelve errores tipados.
- `SearchQueryCompiler`: transforma únicamente planes validados en consultas
  SQLAlchemy parametrizadas.
- `SearchService`: orquesta interpretación, validación, ejecución y auditoría.
- `SearchRepository`: ejecuta consultas sin conocer prompts ni proveedores.

Solo participan modelos presentes en `MODEL_CLASS_BY_NAME`. Un registro paralelo
`SEARCH_MODEL_REGISTRY` declara clase ORM, función de autorización y constructor de URL,
sin cambiar consumidores existentes de `MODEL_CLASS_BY_NAME`. Un
modelo con `search: true` pero sin esas tres capacidades falla durante el arranque,
no durante una consulta de usuario.

Las relaciones many-to-many se compilan con `EXISTS`, no con joins que multipliquen
filas. La paginación usa orden estable con `uuid` como último criterio.

### API GraphQL propuesta

```graphql
query Search($input: SearchInput!) {
  search(input: $input) {
    requestId
    status
    interpretedQuery
    needsClarification
    clarificationQuestion
    results {
      model
      modelLabel
      uuid
      title
      subtitle
      snippet
      url
      score
    }
    errors {
      code
      message
      model
      field
    }
  }
}
```

```graphql
input SearchInput {
  query: String!
  mode: SearchMode! = AUTO
  model: String
  limit: Int = 20
  originalQuery: String
  clarificationAnswer: String
}

enum SearchMode {
  AUTO
  TEXT
  AI
}
```

`status` acepta `OK`, `PARTIAL`, `NEEDS_CLARIFICATION` y `FAILED`. Los errores
tipados iniciales son `INVALID_PLAN`, `MODEL_NOT_ALLOWED`, `FIELD_NOT_ALLOWED`,
`OPERATOR_NOT_ALLOWED`, `AI_UNAVAILABLE`, `TIMEOUT` y `INTERNAL_ERROR`. Un fallo en
un modelo produce `PARTIAL` y no oculta resultados válidos de otros modelos.

La primera versión no pagina dentro de un grupo: aplica el límite por subplan. Una
versión posterior podrá agregar cursores por modelo sin cambiar `SearchResult`.

En una solicitud normal, `query` es obligatorio y los campos de aclaración son
`null`. En una aclaración, `query` conserva la nueva entrada completa,
`originalQuery` y `clarificationAnswer` son obligatorios, y el servidor limita cada
uno a 2 000 caracteres. El cliente nunca envía un plan previo.

`interpretedQuery` es un resumen localizado generado determinísticamente desde el
plan validado, por ejemplo “Tareas con prioridad Urgente asignadas a Antonio”. No es
texto libre del proveedor ni el plan serializado.

### Adaptador del proveedor

```python
class SearchInterpreter(Protocol):
    async def interpret(
        self,
        query: str,
        searchable_schema: dict,
        context: SearchContext,
    ) -> SearchPlan: ...
```

La configuración decide qué adaptador usar. Ningún dominio importa directamente
un SDK de IA.

Todo adaptador debe soportar JSON Schema o devolver texto que pase el mismo validador
local. Si no puede producir un `SearchPlanV1` válido en un intento, se devuelve
`INVALID_PLAN`; no existe un bucle autónomo de reintentos. Timeout: 10 segundos. En
`AUTO`, `AI_UNAVAILABLE`, `TIMEOUT` o `INVALID_PLAN` ejecutan TEXT con la consulta
original y devuelven `PARTIAL` con una advertencia. En modo `AI` explícito se devuelve
`FAILED` y no hay fallback silencioso.

## Búsqueda tradicional

La búsqueda sin IA utiliza el mismo catálogo de campos y devuelve el mismo tipo de
resultado. En la primera fase puede usar coincidencias parametrizadas. Cuando el
volumen lo justifique, se agrega PostgreSQL Full Text Search con `tsvector`,
`tsquery`, ranking e índices GIN.

Esto mantiene un solo contrato para frontend, permisos y navegación.

### Algoritmo TEXT de Fase 1

1. Normalizar espacios y limitar la consulta a 500 caracteres.
2. Dividir en términos y escapar comodines de `ILIKE`.
3. Por cada modelo habilitado, aplicar cada término con `AND`; dentro de un término,
   buscar con `OR` en todos los campos `search.text: true`.
4. En Fase 1, los campos `html` no pueden declarar `search.text: true`. Sí pueden
   aportar snippets después de que otro campo encuentre el registro. Para buscar su
   contenido se requiere una columna normalizada actualizada al escribir e indexada;
   nunca se limpia HTML durante cada consulta.
5. Asignar score dentro de cada modelo: coincidencia exacta en título `100`, prefijo
   `70`, contiene en título `50`, contiene en otro campo según peso A/B/C/D
   `40/30/20/10`. Sumar y ordenar por score descendente, después título y UUID.
6. Agrupar resultados por modelo. El score nunca se compara entre modelos.

Para varios modelos, el límite efectivo es
`min(SearchInput.limit, ModelSearchQuery.limit, 20)`. El máximo global de 50 se
reparte en el orden de `queries`; cada subplan consume hasta su límite y el último se
trunca si se agota el presupuesto. El orden de subplanes forma parte del plan.

La implementación inicial usa expresiones parametrizadas. El benchmark registrará
PostgreSQL, CPU, RAM, concurrencia, cantidad y tamaño de campos. Si no cumple el SLO,
la Fase 1 puede usar índices `pg_trgm`; FTS sigue siendo la evolución para ranking
lingüístico.

## Seguridad

- Autenticación obligatoria para todas las consultas.
- El catálogo enviado a la IA contiene únicamente schemas permitidos.
- Nunca se envían valores de campos `password`, tokens, secretos o campos con
  `search: false`.
- El usuario solo puede consultar registros que podría abrir en una vista normal.
- Antes de habilitar búsqueda se crea `SearchAuthorizationPolicy`. Inicialmente puede
  adaptar las políticas existentes por modelo; pruebas de equivalencia garantizan
  que búsqueda y vista autorizan el mismo conjunto. La migración interna de vistas a
  una política común será incremental. Recibe usuario, empresa y clase ORM, y devuelve
  condiciones SQLAlchemy. Esta es la Fase 0 y bloquea las fases siguientes.
- Todas las condiciones se construyen con SQLAlchemy y parámetros enlazados.
- Se limita cantidad de modelos, filtros, relaciones, profundidad y resultados.
- Se registra `request_id`, usuario, modelos, duración, estado, cantidad de
  resultados y hash de la consulta. El texto y los valores del plan no se guardan
  por defecto. Retención inicial: 30 días.
- La respuesta distingue entre cero resultados, consulta inválida, ambigüedad y
  error del proveedor.
- El buscador será inicialmente de solo lectura.

## Experiencia de usuario

1. El usuario abre el buscador desde el topbar.
2. Escribe palabras o una pregunta completa.
3. En `AUTO`, si existe proveedor configurado se usa interpretación con IA; sin
   proveedor se usa `TEXT`. El usuario puede elegir explícitamente `TEXT` para no
   enviar la consulta a un proveedor.
4. Mientras se procesa, se muestra un estado explícito de carga.
5. Los resultados se agrupan por modelo y muestran título, contexto y enlace.
6. Si falta información, se muestra una pregunta de aclaración dentro del mismo
   panel.
7. El usuario abre el registro sin perder la consulta anterior.

La aclaración es stateless: el cliente reenvía `originalQuery` y
`clarificationAnswer` en una nueva solicitud. El servidor los combina en una entrada
del intérprete. No se guarda una conversación ni se confía en un plan proporcionado
por el cliente.

`title`, `subtitle` y `snippet` se construyen en el servidor desde campos declarados.
Solo puede existir un `result: "title"`; el primero configurado como subtítulo es el
fallback. HTML se convierte a texto, se escapa y se recorta a 240 caracteres. La URL
se construye desde el registro seguro de modelos como
`/dashboard/user/{model}/{uuid}`.

### Estados obligatorios

- Inicial con ejemplos de preguntas.
- Cargando.
- Resultados.
- Sin resultados.
- Aclaración requerida.
- IA deshabilitada o no configurada.
- Proveedor temporalmente no disponible.
- Consulta no permitida.

## Enfoques descartados

### Traductor directo de IA a filtros

Es rápido, pero mezcla interpretación, validación y ejecución. Complica las pruebas,
la seguridad y el cambio de proveedor.

### Búsqueda híbrida con vectores desde el inicio

Agrega indexación, sincronización, costos y reglas de permisos antes de comprobar que
la búsqueda estructurada sea insuficiente. Se conserva como evolución futura.

## Fases de implementación

### Fase 0: autorización y registro seguro

1. Crear una política común de autorización por registro y empresa.
2. Ampliar el registro de modelos con ORM, política y constructor de URL.
3. Probar que vista y búsqueda producen el mismo conjunto autorizado.

### Fase 1: contrato y búsqueda textual

1. Agregar `search` y `search_config` al modelo, migración, seed y documentación.
2. Definir tipos `SearchPlan`, `SearchResult` y errores.
3. Implementar descubrimiento, validación y permisos.
4. Implementar búsqueda textual y API GraphQL.
5. Conectar el panel del topbar.

### Fase 2: interpretación con IA

1. Crear `SearchInterpreter` y un adaptador configurable.
2. Generar el JSON Schema del plan desde los modelos habilitados.
3. Implementar consultas de aclaración.
4. Agregar límites, auditoría, tiempos máximos y manejo de fallos.
5. Crear un conjunto de evaluaciones en español e inglés.

### Fase 3: relevancia y escala

1. Medir latencia, consultas sin resultados y correcciones del usuario.
2. Agregar PostgreSQL Full Text Search cuando la búsqueda textual básica no alcance.
3. Considerar embeddings solo si las métricas muestran consultas conceptuales que
   no pueden resolverse por campos, filtros o texto completo.

## Pruebas requeridas

- Un modelo sin `search: true` nunca aparece ni puede consultarse.
- Un campo no habilitado nunca sale en el catálogo ni puede filtrarse.
- Se rechazan campos, operadores, relaciones y modelos inventados por la IA.
- Se respetan registros limitados por usuario y empresa.
- Fechas como “esta semana” respetan zona horaria.
- Selecciones localizadas se convierten a sus valores técnicos.
- HTML se convierte a texto seguro para fragmentos.
- Cero resultados no se presenta como error.
- Una caída del proveedor conserva la búsqueda tradicional.
- Los enlaces abren el modelo y UUID correctos.
- El límite máximo se aplica aunque el plan solicite más.
- Las consultas maliciosas no alteran el SQL generado.
- `AUTO` usa IA cuando está configurada y cae a `TEXT` cuando no lo está.
- Cancelar una búsqueda ignora respuestas tardías en el frontend.
- Los resultados siempre tienen orden estable y no se duplican por relaciones.
- Un fallo de un modelo devuelve `PARTIAL` con errores tipados.
- Una aclaración reenvía la pregunta original sin ejecutar planes del cliente.
- Cualquier subplan inválido hace fallar atómicamente todo el plan antes de consultar.
  `PARTIAL` se reserva para fallos de ejecución después de validar el plan completo.

## Criterios de éxito

- El 100% de los resultados pertenece a modelos y campos habilitados.
- Ninguna prueba permite saltarse permisos de usuario o empresa.
- Una aplicación habilita un modelo registrado modificando su definición canónica;
  un modelo ORM nuevo también debe registrar autorización y URL.
- Las diez consultas de referencia iniciales producen un plan válido y resultados
  correctos en español e inglés.
- La búsqueda tradicional funciona cuando no existe una clave de proveedor de IA.
- El percentil 95 de búsqueda textual permanece debajo de 300 ms en el benchmark
  reproducible de 100 000 registros por modelo, 5 campos buscables, 10 clientes
  concurrentes y hardware documentado, excluyendo tiempo de IA.
- El percentil 95 de interpretación con IA se mide por separado y tiene timeout.

## Preguntas abiertas

- ¿Qué proveedor será el adaptador de referencia de la plantilla?
- ¿Qué modelos iniciales se habilitarán en la aplicación de ejemplo?
- ¿Se permitirá buscar en notas y nombres de adjuntos en la primera fase?

## Dependencias

- Modelo de permisos estable para todos los modelos dinámicos.
- Definición persistente de `search` en `SystemModel` y campos.
- Configuración segura de secretos del proveedor.
- Zona horaria e idioma disponibles en el contexto de sesión.

## Distribución

El buscador forma parte de la plantilla WebApp y utiliza su proceso actual de
despliegue. La IA se entrega como módulo opcional: sin proveedor configurado, la
aplicación continúa funcionando con búsqueda textual.

## Próximos pasos

1. Resolver las preguntas abiertas sobre proveedor y modelos de ejemplo.
2. Convertir este diseño en un plan de ingeniería revisado.
3. Implementar primero el contrato y la búsqueda textual, sin SDK de IA.
4. Agregar el adaptador de IA después de aprobar las pruebas de permisos.

## Referencias

- [OpenAI API: Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [PostgreSQL: Full Text Search](https://www.postgresql.org/docs/current/textsearch-intro.html)
- [PostgreSQL: Text Search Functions and Operators](https://www.postgresql.org/docs/current/functions-textsearch.html)

## Lo que observé

- La frase “es una plantilla para generar webapps” cambió correctamente la decisión:
  el buscador debe ser declarativo y opcional, no una función pegada a tareas.
- Elegiste “todos los que tengan `search: true`”, una regla simple que permite que
  cada aplicación controle su alcance sin modificar código del buscador.
- Pediste documentarlo antes de implementarlo. En una plantilla, el contrato es más
  importante que elegir pronto un proveedor de IA.

## Revisión adversarial

El documento pasó por tres rondas independientes. La revisión inicial obtuvo 5/10 y
detectó decisiones abiertas en persistencia, autorización, consultas multi-modelo y
GraphQL. La segunda obtuvo 7/10 y cerró semántica de filtros, TEXT, aclaraciones,
límites y fallback. La tercera obtuvo 8/10; sus tres riesgos finales quedaron
resueltos en esta versión mediante autorización de relaciones, selección exacta de
catálogo y exclusión de HTML no normalizado en Fase 1.
