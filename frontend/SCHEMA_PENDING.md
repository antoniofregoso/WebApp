# Pendientes del schema

Ideas para evolucionar el schema declarativo del frontend:

- `required`: marcar campos obligatorios y mostrar validacion visual.
- `readonly`: permitir campos visibles pero no editables.
- `placeholder`: texto de ayuda dentro de inputs.
- `help`: descripcion corta del campo, tooltip o texto auxiliar.
- `widget`: controlar render especializado por campo, por ejemplo `money`, `badge`, `phone`, `email`, `textarea`, `image`, `tags`.
- `default`: valor inicial para crear registros.
- `relation`: metadatos de modelos relacionados para `many2one` y `many2many`.
- `domain`: filtros declarativos para campos relacionales.
- `options`: opciones propias por campo, por ejemplo precision, moneda, formato, min, max, step.
- `validation`: reglas declarativas como longitud minima, maxima, regex o rangos numericos.
- `visibility`: reglas para ocultar/mostrar campos segun valores de otros campos.
- `editable`: controlar si un campo puede editarse solo en create, solo en update o ambos.
- `list.width`: ancho preferido de columna en vista lista.
- `list.align`: alineacion de columna cuando el tipo no sea suficiente.
- `form.colspan`: permitir que un campo ocupe varias columnas.
- `form.section`: agrupar campos del formulario por secciones.
- `calendar.start` y `calendar.end`: definir que campos alimentan el calendario por modelo.
- `calendar.color`: definir de donde sale el color del evento, por ejemplo `status`.
- `kanban.group_by`: definir el campo por el que se agrupa kanban.
- `kanban.card`: definir que campos aparecen dentro de la tarjeta.
- `permissions`: permisos por accion (`create`, `read`, `update`, `delete`) para ocultar botones o bloquear campos.
- `actions`: acciones declarativas por vista o registro.
- `i18n`: completar etiquetas, placeholders y ayudas por idioma.
