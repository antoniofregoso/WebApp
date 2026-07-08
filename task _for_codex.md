Generar la consulta graphql "SystemModelView"

lleva 3 par'ametros 
1. model (ejem: sale.order)
2. use (ejem: view o insight)
3. name (nombre del esquema)

lo que hace esta consulta es generer

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
esto se hace uniendo la informacion de e fuentes

1. De system.model del model se obtiene label, groupBy, field es group_by_values y tags Se obtiene con el parametro `model`.
2. De system.model.schema se obtiene con los 3 parametros `model`, `mode` y `name` el schema es para generar diferentes vistas
3. Del objeto se obtienen todos los registros con los fields solicitados en el schema.

para ver un ejempo se puede ver en [Demo](./frontend/src/app/data/demo.json)



