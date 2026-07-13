# Data Format


## Views

### Business objects


```json
{
    "model":{
        "name":"",
        "label":{
            "es":"",
            "en":""
        },
        "groupBy":"field",
        "field":[],
        "tags": [],
        "schema":[]
    },
    "records":[]
}
```
## Model

### Declarative search

Set `search` to `true` on a model to include it in the global search. Fields are
included only when they declare an enabled `search` object.

```json
{
    "name": "system.task",
    "search": true,
    "fields": [
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
    ]
}
```

- `enabled`: permits the field to participate in search.
- `text`: includes the field in textual matching.
- `result`: accepts `title` or `subtitle` for result rendering.
- `weight`: accepts `A`, `B`, `C`, or `D` to describe relevance priority.

Models and fields without this configuration remain private from global search.
The complete natural-language search design is documented in
[AI_SEARCH_DESIGN.md](./AI_SEARCH_DESIGN.md).

### Name

### Label

### groupBy

### fierld


### tags

### schema

## Records

## Insights

```json
{
    "period":"",
    "kpis":[],
    "gauges":[ ],
    "graphics":[]
}
```
### period


### kpis

### gauges

### graphics

