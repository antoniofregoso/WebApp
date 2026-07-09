# Tarea para Claude Code 

la consulta `system.model.view`

debe generar lo siguiente


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

del objeto `system.model` obtiene `name`, `label`, `groupBy` field cambia segun el campo con el que se va a agrupar si "groupBy"="status" entonces
```json
"groupBy":"status",
"status":[]
```

`tags` tambien esta definida en `system.model`

`schema` esta definido en `system.model.schema` y se adjunta tal cual esta en el campo `schema`

finalmente `records` son los valores con los campos que estan descritos en schema

[error](./test.json)
[ejemplo](./demo.json)