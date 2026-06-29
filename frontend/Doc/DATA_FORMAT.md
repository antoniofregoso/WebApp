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
        "schema":[]
    },
    "records":[]
}
```


## Insights

Cada KPI, gauge y gráfica debe tener un `id` único y estable dentro del
dashboard. El `id` permite actualizar un elemento sin volver a renderizar los
demás; no debe cambiar cuando cambien el idioma, el periodo, el valor o la
posición visual.

```json
{
    "period":"today|weekly|monthly|yearly|annual",
    "kpis":[
        {
            "id":"profit_margin",
            "name":{"en":"Profit margin", "es":"Margen de beneficio"},
            "value":25.5,
            "unit":"%",
            "trend":"up"
        }
    ],
    "gauges":[
        {
            "id":"operational_efficiency",
            "name":{"en":"Operational Efficiency", "es":"Eficiencia Operativa"},
            "value":78,
            "unit":"%",
            "max":100,
            "thresholds":{"green":80, "yellow":60, "red":0}
        }
    ],
    "graphics":[
        {
            "id":"monthly_sales",
            "type":"line",
            "title":{"en":"Monthly sales", "es":"Ventas mensuales"},
            "data":[10, 15, 21],
            "categories":{"en":["Jan", "Feb", "Mar"], "es":["Ene", "Feb", "Mar"]}
        }
    ]
}
```

### Actualizaciones reactivas

Los datos de insights viven en `appSignal.value.insights` y se modifican por
medio de `dashboardActions`. Las acciones aceptan un objeto parcial o una
función que recibe el valor actual:

```js
import { dashboardActions } from '../store/actions';

dashboardActions.updateKpi('profit_margin', {
    value: 28.4,
    trend: 'up',
});

dashboardActions.updateGauge('operational_efficiency', (gauge) => ({
    value: gauge.value + 1,
}));

dashboardActions.updateGraphic('monthly_sales', {
    data: [12, 18, 25],
});

dashboardActions.setInsightPeriod('monthly');
```

También está disponible la forma genérica:

```js
dashboardActions.updateInsight('graphics', 'monthly_sales', {
    data: [12, 18, 25],
});
```

El parche es superficial: propiedades anidadas como `title`, `categories`,
`thresholds` y `data` deben enviarse completas cuando se modifican. Si los IDs
y su orden se mantienen, solo se actualizan los elementos modificados. Agregar,
eliminar o reordenar elementos dispara un render completo de Insights.

#### Actualizar estados financieros (Sankey)

Para actualizar un estado financiero se reemplaza la propiedad `data` completa,
incluyendo `nodes`, `edges` y `options`:

```js
dashboardActions.updateGraphic('income_statement_sankey', {
    data: {
        nodes: updatedNodes,
        edges: updatedEdges,
        options: {
            order: updatedOrder,
        },
    },
});
```

Cuando solamente cambian los importes de las relaciones, se puede usar una
función de actualización para conservar los nodos y opciones existentes y
reemplazar únicamente `edges`:

```js
dashboardActions.updateGraphic('income_statement_sankey', (graphic) => ({
    data: {
        ...graphic.data,
        edges: updatedEdges,
    },
}));
```

Cada elemento de `updatedEdges` debe conservar el formato del Sankey:

```js
const updatedEdges = [
    {
        source: 'ingresos_ventas',
        target: 'total_ingresos',
        value: 925000,
    },
];
```

La actualización vuelve a crear únicamente la gráfica cuyo `id` fue indicado;
los demás KPIs, gauges y gráficas permanecen intactos.
