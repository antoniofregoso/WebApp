#Generar los KPIs y gráficos de usuarios en línea, tiempo promedio de sesión, usuarios activos, usuarios recurrentes, usuarios por hora y usuarios activos mensuales.

necesito consultas graphql para obtener los datos de los KPIs y gráficos mencionados. Aquí tienes algunos ejemplos de consultas que podrías utilizar:
El periodo de tiempo puede ser uno de los siguientes: 'today', 'weekly', 'monthly', 'yearly', 'annual'.
se cargan segun el periodo de tiempo seleccionado por el usuario. El valor default es 'today'.
```javascripy
const PERIOD_OPTIONS = ['today', 'weekly', 'monthly', 'yearly', 'annual'];
```
por convencion , los nombres de los KPIs y gráficos deben seguir el siguiente formato:
- KPI: kpi<NombreDelKPI>
- gAUGE: gauge<NombreDelKPI>
- Gráfico: graphic<NombreDelGrafico>

```json
{
    "id": "kpiUsersOnline",
    "name":{
        "en": "Online Users",
        "es": "Usuarios en línea"
    },
    "value": 25.5,
    "unit": "Users",
    "trend": "up"
}
````


```json
{
    "id": "kpiUsersAverageSessionTime",
    "name":{
        "en": "Average Session Time",
        "es": "Tiempo promedio de sesión"
    },
    "value": 25.5,
    "unit": "Min",
    "trend": "up"
}
````


```json
{
    "id": "kpiUsersActiveUsers",
    "name":{
        "en": "Active Users",
        "es": "Usuarios activos"
    },
    "value": 25.5,
    "unit": "Users",
    "trend": "up"
}
````

```json
{
    "id": "kpiRecurringUsers",
    "name":{
        "en": "Recurring Users",
        "es": "Usuarios recurrentes"
    },
    "value": 25.5,
    "unit": "Users",
    "trend": "up"
}
````
```json

{
    "id": "graphicUsersPerHour",
    "type": "heatmap",
    "title": {
        "en": "Users per Hour",
        "es": "Usuarios por Hora"
    },
    "data":[
    {
        "name": {"en":"Mon","es":"Lun"},
        "data": [
        { "x": {"en":"12 AM","es":"12 AM"}, "y": 12 }, { "x": {"en":"1 AM","es":"1 AM"}, "y": 8 }, { "x": {"en":"2 AM","es":"2 AM"}, "y": 5 }, { "x": {"en":"3 AM","es":"3 AM"}, "y": 3 },
        { "x": {"en":"4 AM","es":"4 AM"}, "y": 4 }, { "x": {"en":"5 AM","es":"5 AM"}, "y": 9 }, { "x": {"en":"6 AM","es":"6 AM"}, "y": 22 }, { "x": {"en":"7 AM","es":"7 AM"}, "y": 45 },
        { "x": {"en":"8 AM","es":"8 AM"}, "y": 78 }, { "x": {"en":"9 AM","es":"9 AM"}, "y": 92 }, { "x": {"en":"10 AM","es":"10 AM"}, "y": 110 }, { "x": {"en":"11 AM","es":"11 AM"}, "y": 115 },
        { "x": {"en":"12 PM","es":"12 PM"}, "y": 95 }, { "x": {"en":"1 PM","es":"1 PM"}, "y": 88 }, { "x": {"en":"2 PM","es":"2 PM"}, "y": 90 }, { "x": {"en":"3 PM","es":"3 PM"}, "y": 105 },
        { "x": {"en":"4 PM","es":"4 PM"}, "y": 112 }, { "x": {"en":"5 PM","es":"5 PM"}, "y": 98 }, { "x": {"en":"6 PM","es":"6 PM"}, "y": 75 }, { "x": {"en":"7 PM","es":"7 PM"}, "y": 62 },
        { "x": {"en":"8 PM","es":"8 PM"}, "y": 55 }, { "x": {"en":"9 PM","es":"9 PM"}, "y": 41 }, { "x": {"en":"10 PM","es":"10 PM"}, "y": 28 }, { "x": {"en":"11 PM","es":"11 PM"}, "y": 18 }
        ]
    },
    {
        "name": {"en":"Tue","es":"Mar"},
        "data": [
        { "x": {"en":"12 AM","es":"12 AM"}, "y": 10 }, { "x": {"en":"1 AM","es":"1 AM"}, "y": 6 }, { "x": {"en":"2 AM","es":"2 AM"}, "y": 4 }, { "x": {"en":"3 AM","es":"3 AM"}, "y": 2 },
        { "x": {"en":"4 AM","es":"4 AM"}, "y": 5 }, { "x": {"en":"5 AM","es":"5 AM"}, "y": 11 }, { "x": {"en":"6 AM","es":"6 AM"}, "y": 25 }, { "x": {"en":"7 AM","es":"7 AM"}, "y": 48 },
        { "x": {"en":"8 AM","es":"8 AM"}, "y": 85 }, { "x": {"en":"9 AM","es":"9 AM"}, "y": 99 }, { "x": {"en":"10 AM","es":"10 AM"}, "y": 118 }, { "x": {"en":"11 AM","es":"11 AM"}, "y": 120 },
        { "x": {"en":"12 PM","es":"12 PM"}, "y": 102 }, { "x": {"en":"1 PM","es":"1 PM"}, "y": 94 }, { "x": {"en":"2 PM","es":"2 PM"}, "y": 92 }, { "x": {"en":"3 PM","es":"3 PM"}, "y": 108 },
        { "x": {"en":"4 PM","es":"4 PM"}, "y": 115 }, { "x": {"en":"5 PM","es":"5 PM"}, "y": 101 }, { "x": {"en":"6 PM","es":"6 PM"}, "y": 80 }, { "x": {"en":"7 PM","es":"7 PM"}, "y": 68 },
        { "x": {"en":"8 PM","es":"8 PM"}, "y": 59 }, { "x": {"en":"9 PM","es":"9 PM"}, "y": 44 }, { "x": {"en":"10 PM","es":"10 PM"}, "y": 30 }, { "x": {"en":"11 PM","es":"11 PM"}, "y": 15 }
        ]
    },
    {
        "name": {"en":"Wed","es":"Mié"},
        "data": [
        { "x": {"en":"12 AM","es":"12 AM"}, "y": 14 }, { "x": {"en":"1 AM","es":"1 AM"}, "y": 9 }, { "x": {"en":"2 AM","es":"2 AM"}, "y": 5 }, { "x": {"en":"3 AM","es":"3 AM"}, "y": 3 },
        { "x": {"en":"4 AM","es":"4 AM"}, "y": 4 }, { "x": {"en":"5 AM","es":"5 AM"}, "y": 10 }, { "x": {"en":"6 AM","es":"6 AM"}, "y": 24 }, { "x": {"en":"7 AM","es":"7 AM"}, "y": 50 },
        { "x": {"en":"8 AM","es":"8 AM"}, "y": 88 }, { "x": {"en":"9 AM","es":"9 AM"}, "y": 105 }, { "x": {"en":"10 AM","es":"10 AM"}, "y": 122 }, { "x": {"en":"11 AM","es":"11 AM"}, "y": 125 },
        { "x": {"en":"12 PM","es":"12 PM"}, "y": 105 }, { "x": {"en":"1 PM","es":"1 PM"}, "y": 97 }, { "x": {"en":"2 PM","es":"2 PM"}, "y": 96 }, { "x": {"en":"3 PM","es":"3 PM"}, "y": 114 },
        { "x": {"en":"4 PM","es":"4 PM"}, "y": 119 }, { "x": {"en":"5 PM","es":"5 PM"}, "y": 105 }, { "x": {"en":"6 PM","es":"6 PM"}, "y": 84 }, { "x": {"en":"7 PM","es":"7 PM"}, "y": 72 },
        { "x": {"en":"8 PM","es":"8 PM"}, "y": 61 }, { "x": {"en":"9 PM","es":"9 PM"}, "y": 48 }, { "x": {"en":"10 PM","es":"10 PM"}, "y": 33 }, { "x": {"en":"11 PM","es":"11 PM"}, "y": 21 }
        ]
    },
    {
        "name": {"en":"Thu","es":"Jue"},
        "data": [
        { "x": {"en":"12 AM","es":"12 AM"}, "y": 11 }, { "x": {"en":"1 AM","es":"1 AM"}, "y": 7 }, { "x": {"en":"2 AM","es":"2 AM"}, "y": 4 }, { "x": {"en":"3 AM","es":"3 AM"}, "y": 3 },
        { "x": {"en":"4 AM","es":"4 AM"}, "y": 6 }, { "x": {"en":"5 AM","es":"5 AM"}, "y": 12 }, { "x": {"en":"6 AM","es":"6 AM"}, "y": 22 }, { "x": {"en":"7 AM","es":"7 AM"}, "y": 46 },
        { "x": {"en":"8 AM","es":"8 AM"}, "y": 80 }, { "x": {"en":"9 AM","es":"9 AM"}, "y": 96 }, { "x": {"en":"10 AM","es":"10 AM"}, "y": 114 }, { "x": {"en":"11 AM","es":"11 AM"}, "y": 118 },
        { "x": {"en":"12 PM","es":"12 PM"}, "y": 99 }, { "x": {"en":"1 PM","es":"1 PM"}, "y": 91 }, { "x": {"en":"2 PM","es":"2 PM"}, "y": 89 }, { "x": {"en":"3 PM","es":"3 PM"}, "y": 106 },
        { "x": {"en":"4 PM","es":"4 PM"}, "y": 110 }, { "x": {"en":"5 PM","es":"5 PM"}, "y": 96 }, { "x": {"en":"6 PM","es":"6 PM"}, "y": 78 }, { "x": {"en":"7 PM","es":"7 PM"}, "y": 64 },
        { "x": {"en":"8 PM","es":"8 PM"}, "y": 53 }, { "x": {"en":"9 PM","es":"9 PM"}, "y": 39 }, { "x": {"en":"10 PM","es":"10 PM"}, "y": 27 }, { "x": {"en":"11 PM","es":"11 PM"}, "y": 16 }
        ]
    },
    {
        "name": {"en":"Fri","es":"Vie"},
        "data": [
        { "x": {"en":"12 AM","es":"12 AM"}, "y": 15 }, { "x": {"en":"1 AM","es":"1 AM"}, "y": 10 }, { "x": {"en":"2 AM","es":"2 AM"}, "y": 6 }, { "x": {"en":"3 AM","es":"3 AM"}, "y": 4 },
        { "x": {"en":"4 AM","es":"4 AM"}, "y": 5 }, { "x": {"en":"5 AM","es":"5 AM"}, "y": 9 }, { "x": {"en":"6 AM","es":"6 AM"}, "y": 18 }, { "x": {"en":"7 AM","es":"7 AM"}, "y": 38 },
        { "x": {"en":"8 AM","es":"8 AM"}, "y": 70 }, { "x": {"en":"9 AM","es":"9 AM"}, "y": 85 }, { "x": {"en":"10 AM","es":"10 AM"}, "y": 98 }, { "x": {"en":"11 AM","es":"11 AM"}, "y": 102 },
        { "x": {"en":"12 PM","es":"12 PM"}, "y": 88 }, { "x": {"en":"1 PM","es":"1 PM"}, "y": 75 }, { "x": {"en":"2 PM","es":"2 PM"}, "y": 70 }, { "x": {"en":"3 PM","es":"3 PM"}, "y": 74 },
        { "x": {"en":"4 PM","es":"4 PM"}, "y": 81 }, { "x": {"en":"5 PM","es":"5 PM"}, "y": 72 }, { "x": {"en":"6 PM","es":"6 PM"}, "y": 58 }, { "x": {"en":"7 PM","es":"7 PM"}, "y": 48 },
        { "x": {"en":"8 PM","es":"8 PM"}, "y": 40 }, { "x": {"en":"9 PM","es":"9 PM"}, "y": 35 }, { "x": {"en":"10 PM","es":"10 PM"}, "y": 29 }, { "x": {"en":"11 PM","es":"11 PM"}, "y": 22 }
        ]
    },
    {
        "name": {"en":"Sat","es":"Sab"},
        "data": [
        { "x": {"en":"12 AM","es":"12 AM"}, "y": 18 }, { "x": {"en":"1 AM","es":"1 AM"}, "y": 12 }, { "x": {"en":"2 AM","es":"2 AM"}, "y": 8 }, { "x": {"en":"3 AM","es":"3 AM"}, "y": 5 },
        { "x": {"en":"4 AM","es":"4 AM"}, "y": 3 }, { "x": {"en":"5 AM","es":"5 AM"}, "y": 6 }, { "x": {"en":"6 AM","es":"6 AM"}, "y": 10 }, { "x": {"en":"7 AM","es":"7 AM"}, "y": 15 },
        { "x": {"en":"8 AM","es":"8 AM"}, "y": 25 }, { "x": {"en":"9 AM","es":"9 AM"}, "y": 38 }, { "x": {"en":"10 AM","es":"10 AM"}, "y": 45 }, { "x": {"en":"11 AM","es":"11 AM"}, "y": 52 },
        { "x": {"en":"12 PM","es":"12 PM"}, "y": 58 }, { "x": {"en":"1 PM","es":"1 PM"}, "y": 55 }, { "x": {"en":"2 PM","es":"2 PM"}, "y": 51 }, { "x": {"en":"3 PM","es":"3 PM"}, "y": 53 },
        { "x": {"en":"4 PM","es":"4 PM"}, "y": 56 }, { "x": {"en":"5 PM","es":"5 PM"}, "y": 60 }, { "x": {"en":"6 PM","es":"6 PM"}, "y": 64 }, { "x": {"en":"7 PM","es":"7 PM"}, "y": 68 },
        { "x": {"en":"8 PM","es":"8 PM"}, "y": 65 }, { "x": {"en":"9 PM","es":"9 PM"}, "y": 58 }, { "x": {"en":"10 PM","es":"10 PM"}, "y": 44 }, { "x": {"en":"11 PM","es":"11 PM"}, "y": 30 }
        ]
    },
    {
        "name": {"en":"Sun","es":"Dom"},
        "data": [
        { "x": {"en":"12 AM","es":"12 AM"}, "y": 22 }, { "x": {"en":"1 AM","es":"1 AM"}, "y": 15 }, { "x": {"en":"2 AM","es":"2 AM"}, "y": 9 }, { "x": {"en":"3 AM","es":"3 AM"}, "y": 5 },
        { "x": {"en":"4 AM","es":"4 AM"}, "y": 2 }, { "x": {"en":"5 AM","es":"5 AM"}, "y": 4 }, { "x": {"en":"6 AM","es":"6 AM"}, "y": 8 }, { "x": {"en":"7 AM","es":"7 AM"}, "y": 12 },
        { "x": {"en":"8 AM","es":"8 AM"}, "y": 20 }, { "x": {"en":"9 AM","es":"9 AM"}, "y": 32 }, { "x": {"en":"10 AM","es":"10 AM"}, "y": 40 }, { "x": {"en":"11 AM","es":"11 AM"}, "y": 48 },
        { "x": {"en":"12 PM","es":"12 PM"}, "y": 55 }, { "x": {"en":"1 PM","es":"1 PM"}, "y": 52 }, { "x": {"en":"2 PM","es":"2 PM"}, "y": 50 }, { "x": {"en":"3 PM","es":"3 PM"}, "y": 55 },
        { "x": {"en":"4 PM","es":"4 PM"}, "y": 62 }, { "x": {"en":"5 PM","es":"5 PM"}, "y": 66 }, { "x": {"en":"6 PM","es":"6 PM"}, "y": 70 }, { "x": {"en":"7 PM","es":"7 PM"}, "y": 74 },
        { "x": {"en":"8 PM","es":"8 PM"}, "y": 71 }, { "x": {"en":"9 PM","es":"9 PM"}, "y": 63 }, { "x": {"en":"10 PM","es":"10 PM"}, "y": 48 }, { "x": {"en":"11 PM","es":"11 PM"}, "y": 32 }
        ]
    }
    ]
}
```

```json
{
    "id": "graphicUsersMAU",
    "type": "bar",
    "mode":"vertical",
    "title": {
        "en": "Monthly Active Users",
        "es": "Usuarios activos mensuales"
    },
    "data": [2.3, 3.1, 4.0, 10.1, 4.0, 3.6, 3.2, 2.3, 1.4, 0.8, 0.5, 0.2],
    "categories": {
                    "en":["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
                    "es":["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
                }
    
    }
```