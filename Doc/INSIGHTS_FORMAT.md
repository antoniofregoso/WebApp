## Insights

Each KPI, gauge, and chart must have a unique and stable `id` within the dashboard. The `id` allows updating an element without re-rendering the others; it should not change when the language, period, value, or visual position changes.

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

Insights data resides in `appSignal.value.insights` and is modified via `dashboardActions`. Actions accept either a partial object or a function that receives the current value.

The initial load uses `setInsights` with the full configuration sent by the backend. Subsequent refreshes use `refreshInsights`: the payload contains only data by `id` and retains the dashboard configuration (layout, names, types, units, maximums, and thresholds).

```js
dashboardActions.setInsights(initialDashboardConfig);

dashboardActions.refreshInsights({
    period: 'monthly',
    kpis: [{ id: 'profit_margin', value: 28.4, trend: 'up' }],
    gauges: [{ id: 'operational_efficiency', value: 81 }],
    graphics: [{ id: 'monthly_sales', data: [12, 18, 25] }],
});
```

You can also refresh a single indicator:

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

The patch is superficial: nested properties like `title`, `categories`,
`thresholds`, and `data` must be sent in full when modified. If the IDs
and their order are maintained, only the modified items are updated. Adding,
removing, or reordering items triggers a full Insights render.

#### Update Financial Statements (Sankey)

To update a financial statement, the entire `data` property is replaced,

including `nodes`, `edges`, and `options`:

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

When only the amounts in the relationships change, an update function can be used to preserve existing nodes and options and replace only the `edges`.

```js
dashboardActions.updateGraphic('income_statement_sankey', (graphic) => ({
    data: {
        ...graphic.data,
        edges: updatedEdges,
    },
}));
```

Each element of `updatedEdges` must retain the Sankey format:

```js
const updatedEdges = [
    {
        source: 'ingresos_ventas',
        target: 'total_ingresos',
        value: 925000,
    },
];
```
The update recreates only the chart whose `id` was specified; all other KPIs, gauges, and charts remain unchanged.
