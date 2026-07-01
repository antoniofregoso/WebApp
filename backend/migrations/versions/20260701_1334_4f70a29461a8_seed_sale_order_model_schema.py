"""seed sale order model schema

Revision ID: 4f70a29461a8
Revises: 90e99e362555
Create Date: 2026-07-01 13:34:58.367248

Seeds a SystemModel("sale.order") with a single SystemModelSchema(use="default")
whose `view` JSON is the same declarative schema the frontend already renders
from `frontend/src/app/data/demo.json` (see Doc/VIEWS_FORMAT.md). This lets the
frontend fetch the dynamic-view schema over GraphQL instead of a local JSON file,
while keeping the exact same schema shape.
"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '4f70a29461a8'
down_revision: Union[str, None] = '90e99e362555'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MODEL_NAME = "sale.order"

SCHEMA_VIEW = {
    'label': {'es': 'Orden de Venta', 'en': 'Sale Order'},
    'groupBy': 'status',
    'status': [
        {'value': 'draft', 'color': 'zinc', 'es': 'Borrador', 'en': 'Draft'},
        {'value': 'sent', 'color': 'blue', 'es': 'Enviada', 'en': 'Sent'},
        {'value': 'confirmed', 'color': 'green', 'es': 'Confirmada', 'en': 'Confirmed'},
        {'value': 'cancelled', 'color': 'red', 'es': 'Cancelada', 'en': 'Cancelled'},
    ],
    'tags': [
        {'uuid': '33333333-0000-4000-8000-000000000001', 'name': {'en': 'Urgent', 'es': 'Urgente'}, 'color': 'red'},
        {'uuid': '33333333-0000-4000-8000-000000000002', 'name': {'en': 'Wholesale', 'es': 'Mayoreo'}, 'color': 'blue'},
        {'uuid': '33333333-0000-4000-8000-000000000003', 'name': {'en': 'VIP', 'es': 'VIP'}, 'color': 'purple'},
        {'uuid': '33333333-0000-4000-8000-000000000004', 'name': {'en': 'Recurrent', 'es': 'Recurrente'}, 'color': 'green'},
        {'uuid': '33333333-0000-4000-8000-000000000005', 'name': {'en': 'Export', 'es': 'Exportación'}, 'color': 'orange'},
    ],
    'schema': [
        {'name': 'uuid', 'type': 'string', 'label': {'es': 'uuid', 'en': 'uuid'}},
        {
            'name': 'name', 'type': 'string', 'label': {'es': 'Orden', 'en': 'Order'},
            'list': {'column': 1, 'order': True},
            'kanban': {'header': 'Title'},
            'form': {'header': 'Title', 'required': True},
        },
        {
            'name': 'description', 'type': 'html', 'label': {'en': 'Description', 'es': 'Descripción'},
            'form': {
                'tab': 0,
                'placeholder': {
                    'en': '<p>Describe here the recommended process for closing the sale</p>',
                    'es': '<p>Describe aqui el proceso recomendado para cerrar la venta</p>',
                },
            },
        },
        {
            'name': 'customer', 'type': 'many2one', 'label': {'es': 'Cliente', 'en': 'Customer'},
            'list': {'column': 2, 'order': True},
            'kanban': {'header': 'subtitle'},
            'form': {'header': 'subtitle', 'required': True},
            'calendar': {'title': True},
        },
        {
            'name': 'date_order', 'type': 'date', 'label': {'es': 'Fecha de Pedido', 'en': 'Order Date'},
            'list': {'column': 3, 'order': True},
            'kanban': {'leftColumn': 0},
            'form': {'leftColumn': 0, 'readonly': True},
        },
        {
            'name': 'start_date', 'type': 'datetime', 'label': {'es': 'Fecha inicial', 'en': 'Last Updated'},
            'form': {'rightColumn': 0, 'readonly': True},
            'calendar': {'startDate': True},
        },
        {
            'name': 'end_date', 'type': 'datetime', 'label': {'es': 'Fecha Final', 'en': 'Last Updated'},
            'form': {
                'rightColumn': 1,
                'required': True,
                'help': {'en': 'Probable closing date of sale', 'es': 'Fecha probable de cierre de venta'},
            },
            'calendar': {'endDate': True},
        },
        {
            'name': 'product_count', 'type': 'integer', 'label': {'es': 'Número de Productos', 'en': 'Product Count'},
            'list': {'column': 4},
            'form': {'leftColumn': 1},
        },
        {
            'name': 'percentage_delivered', 'type': 'percentage',
            'label': {'es': 'Porcentaje Entregado', 'en': 'Percentage Delivered'},
            'list': {'column': 5},
            'kanban': {'footer': 0},
            'form': {'rightColumn': 2},
        },
        {
            'name': 'decimal_field', 'type': 'decimal', 'label': {'es': 'Numero decimal', 'en': 'Decimal number'},
            'kanban': {'rightColumn': 1},
        },
        {
            'name': 'amount_total', 'type': 'monetary', 'currency': 'MXN', 'label': {'es': 'Total', 'en': 'Total'},
            'list': {'column': 4},
            'kanban': {'rightColumn': 0},
            'form': {'rightColumn': 3},
        },
        {
            'name': 'checked', 'type': 'boolean', 'label': {'es': 'Revisado', 'en': 'Checked'},
            'list': {'column': 6},
            'form': {'leftColumn': 2},
        },
        {
            'name': 'avatar', 'type': 'image', 'label': {'es': 'Avatar', 'en': 'Avatar'},
            'list': {'column': 7},
            'kanban': {'header': 'image'},
            'form': {'header': 'image'},
        },
        {
            'name': 'tags', 'type': 'many2many_pills', 'label': {'es': 'Etiquetas', 'en': 'Tags'},
            'list': False,
            'kanban': {'footer': 1},
            'form': {'leftColumn': 3},
        },
        {
            'name': 'status', 'type': 'selection', 'label': {'es': 'Estado', 'en': 'Status'},
            'list': {'column': 8, 'order': True},
            'form': {'rightColumn': 4},
        },
    ],
}


def upgrade() -> None:
    system_models = sa.table(
        "system_models",
        sa.column("id", sa.Integer),
        sa.column("uuid", sa.Uuid),
        sa.column("name", sa.String),
    )
    system_model_schemas = sa.table(
        "system_model_schemas",
        sa.column("id", sa.Integer),
        sa.column("uuid", sa.Uuid),
        sa.column("name", sa.String),
        sa.column("use", sa.String),
        sa.column("view", postgresql.JSONB),
        sa.column("model_id", sa.Integer),
    )

    bind = op.get_bind()
    model_id = bind.execute(
        system_models.insert()
        .values(uuid=uuid.uuid4(), name=MODEL_NAME)
        .returning(system_models.c.id)
    ).scalar_one()

    bind.execute(
        system_model_schemas.insert().values(
            uuid=uuid.uuid4(),
            name="default",
            use="default",
            view=SCHEMA_VIEW,
            model_id=model_id,
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    model_id = bind.execute(
        sa.text("SELECT id FROM system_models WHERE name = :name"),
        {"name": MODEL_NAME},
    ).scalar_one_or_none()
    if model_id is None:
        return
    bind.execute(
        sa.text("DELETE FROM system_model_schemas WHERE model_id = :model_id"),
        {"model_id": model_id},
    )
    bind.execute(
        sa.text("DELETE FROM system_models WHERE id = :model_id"),
        {"model_id": model_id},
    )
