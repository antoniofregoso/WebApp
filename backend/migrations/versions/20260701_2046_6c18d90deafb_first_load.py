"""First Load

Revision ID: 6c18d90deafb
Revises:
Create Date: 2026-07-01 20:46:01.552730

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6c18d90deafb'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### tables created without cross-table FKs first to avoid ordering/circular
    # dependency issues (system_companies <-> user_user reference each other) ###
    op.create_table('system_companies',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=True),
    sa.Column('color', sa.String(length=32), nullable=False),
    sa.Column('currency_id', sa.Integer(), nullable=True),
    sa.Column('logo_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('street', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('street2', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('zip', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('city', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('state_id', sa.Integer(), nullable=True),
    sa.Column('country_id', sa.Integer(), nullable=True),
    sa.Column('phone', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('email', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('website', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('vat', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('lang_id', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_companies_uuid'), 'system_companies', ['uuid'], unique=True)
    op.create_table('system_countries',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('name', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('phone_code', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('currency_id', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_countries_code'), 'system_countries', ['code'], unique=True)
    op.create_table('system_country_states',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('name', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('country_id', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('country_id', 'code', name='uq_country_state_country_code')
    )
    op.create_index(op.f('ix_system_country_states_code'), 'system_country_states', ['code'], unique=False)
    op.create_table('system_currencies',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('iso_numeric', sa.Integer(), nullable=False),
    sa.Column('symbol', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('currency_unit_label', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('currency_subunit_label', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('rounding', sa.Float(), nullable=False),
    sa.Column('position', sa.Enum('BEFORE', 'AFTER', name='currency_position'), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('system_langs',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('iso_code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('url_code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('date_format', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('time_format', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('week_start', sa.Integer(), nullable=True),
    sa.Column('flag', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_langs_code'), 'system_langs', ['code'], unique=True)
    op.create_index(op.f('ix_system_langs_iso_code'), 'system_langs', ['iso_code'], unique=True)
    op.create_index(op.f('ix_system_langs_url_code'), 'system_langs', ['url_code'], unique=True)
    op.create_table('system_seed_runs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('seed_key', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('executed_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_seed_runs_seed_key'), 'system_seed_runs', ['seed_key'], unique=True)
    op.create_table('user_user',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('email', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('password', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('avatar_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('theme', sa.Enum('light', 'dark', 'system', name='thememode'), nullable=False),
    sa.Column('lang_id', sa.Integer(), nullable=True),
    sa.Column('user_type', sa.Enum('HUMAN', 'SYSTEM', 'AIAGENT', name='usertype'), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('company_id', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_user_email'), 'user_user', ['email'], unique=True)
    op.create_index(op.f('ix_user_user_uuid'), 'user_user', ['uuid'], unique=True)
    op.create_table('system_apps',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('description', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('keys', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('public', sa.Boolean(), nullable=False),
    sa.Column('schema_org', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_system_apps_keys_gin', 'system_apps', ['keys'], unique=False, postgresql_using='gin')
    op.create_table('system_messages',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('status', sa.String(length=32), nullable=False),
    sa.Column('date', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('subject', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('message', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('from_user_id', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_messages_uuid'), 'system_messages', ['uuid'], unique=True)
    op.create_table('system_models',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_models_uuid'), 'system_models', ['uuid'], unique=True)
    op.create_table('system_notifications',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('date', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('status', sa.String(length=32), server_default='sent', nullable=False),
    sa.Column('title', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('message', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('read', sa.Boolean(), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=True),
    sa.Column('color', sa.String(length=32), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_notifications_uuid'), 'system_notifications', ['uuid'], unique=True)
    op.create_table('system_tasks',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('status', sa.String(length=32), server_default='Pending', nullable=False),
    sa.Column('color', sa.String(length=32), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=True),
    sa.Column('title', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('description', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('priority', sa.String(length=32), server_default='Medium', nullable=False),
    sa.Column('date_assign', sa.DateTime(timezone=True), nullable=True),
    sa.Column('date_due', sa.DateTime(timezone=True), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_tasks_uuid'), 'system_tasks', ['uuid'], unique=True)
    op.create_table('system_timezones',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('offset', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_timezones_code'), 'system_timezones', ['code'], unique=True)
    op.create_table('user_logs',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=32), nullable=False),
    sa.Column('start_date', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('duration', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_logs_user_id'), 'user_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_logs_uuid'), 'user_logs', ['uuid'], unique=True)
    op.create_table('system_app_settings',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('app_id', sa.Integer(), nullable=False),
    sa.Column('key', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('value', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('app_id', 'key', name='uq_system_app_settings_app_key')
    )
    op.create_index('ix_system_app_settings_app_id', 'system_app_settings', ['app_id'], unique=False)
    op.create_index('ix_system_app_settings_key', 'system_app_settings', ['key'], unique=False)
    op.create_table('system_attachments',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('model_id', sa.Integer(), nullable=False),
    sa.Column('record_uuid', sa.Uuid(), nullable=False),
    sa.Column('company_id', sa.Integer(), nullable=True),
    sa.Column('original_name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
    sa.Column('content_type', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
    sa.Column('size_bytes', sa.BigInteger(), nullable=False),
    sa.Column('checksum_sha256', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
    sa.Column('storage_provider', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
    sa.Column('storage_key', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_attachments_checksum_sha256'), 'system_attachments', ['checksum_sha256'], unique=False)
    op.create_index('ix_system_attachments_record', 'system_attachments', ['company_id', 'model_id', 'record_uuid'], unique=False)
    op.create_index(op.f('ix_system_attachments_storage_key'), 'system_attachments', ['storage_key'], unique=False)
    op.create_index(op.f('ix_system_attachments_uuid'), 'system_attachments', ['uuid'], unique=True)
    op.create_table('system_country_timezone_rel',
    sa.Column('country_id', sa.Integer(), nullable=False),
    sa.Column('timezone_id', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('country_id', 'timezone_id')
    )
    op.create_table('system_message_user_rel',
    sa.Column('message_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('message_id', 'user_id')
    )
    op.create_table('system_model_fields',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=True),
    sa.Column('type', sa.String(length=32), nullable=False),
    sa.Column('required', sa.Boolean(), nullable=False),
    sa.Column('readonly', sa.Boolean(), nullable=False),
    sa.Column('placeholder', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('help', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('model_id', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_model_fields_uuid'), 'system_model_fields', ['uuid'], unique=True)
    op.create_table('system_model_followers',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('model_id', sa.Integer(), nullable=False),
    sa.Column('record_uuid', sa.Uuid(), nullable=False),
    sa.PrimaryKeyConstraint('user_id', 'model_id', 'record_uuid')
    )
    op.create_index('ix_system_model_followers_record', 'system_model_followers', ['model_id', 'record_uuid'], unique=False)
    op.create_table('system_model_schemas',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('create_by', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uuid', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('use', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('view', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    sa.Column('model_id', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_model_schemas_uuid'), 'system_model_schemas', ['uuid'], unique=True)
    op.create_table('system_notification_user_rel',
    sa.Column('notification_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('notification_id', 'user_id')
    )

    # ### foreign keys added after all tables exist, breaking the
    # system_companies <-> user_user circular dependency ###
    op.create_foreign_key('fk_system_companies_country_id', 'system_companies', 'system_countries', ['country_id'], ['id'])
    op.create_foreign_key('fk_system_companies_create_by', 'system_companies', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_companies_currency_id', 'system_companies', 'system_currencies', ['currency_id'], ['id'])
    op.create_foreign_key('fk_system_companies_lang_id', 'system_companies', 'system_langs', ['lang_id'], ['id'])
    op.create_foreign_key('fk_system_companies_state_id', 'system_companies', 'system_country_states', ['state_id'], ['id'])
    op.create_foreign_key('fk_system_companies_updated_by', 'system_companies', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_countries_create_by', 'system_countries', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_countries_currency_id', 'system_countries', 'system_currencies', ['currency_id'], ['id'])
    op.create_foreign_key('fk_system_countries_updated_by', 'system_countries', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_country_states_country_id', 'system_country_states', 'system_countries', ['country_id'], ['id'])

    op.create_foreign_key('fk_system_currencies_create_by', 'system_currencies', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_currencies_updated_by', 'system_currencies', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_langs_create_by', 'system_langs', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_langs_updated_by', 'system_langs', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_user_user_company_id', 'user_user', 'system_companies', ['company_id'], ['id'])
    op.create_foreign_key('fk_user_user_create_by', 'user_user', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_user_user_lang_id', 'user_user', 'system_langs', ['lang_id'], ['id'])
    op.create_foreign_key('fk_user_user_updated_by', 'user_user', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_apps_create_by', 'system_apps', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_apps_updated_by', 'system_apps', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_messages_create_by', 'system_messages', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_messages_from_user_id', 'system_messages', 'user_user', ['from_user_id'], ['id'])
    op.create_foreign_key('fk_system_messages_updated_by', 'system_messages', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_models_create_by', 'system_models', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_models_updated_by', 'system_models', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_notifications_create_by', 'system_notifications', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_notifications_updated_by', 'system_notifications', 'user_user', ['updated_by'], ['id'])
    op.create_foreign_key('fk_system_notifications_user_id', 'system_notifications', 'user_user', ['user_id'], ['id'])

    op.create_foreign_key('fk_system_tasks_create_by', 'system_tasks', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_tasks_updated_by', 'system_tasks', 'user_user', ['updated_by'], ['id'])
    op.create_foreign_key('fk_system_tasks_user_id', 'system_tasks', 'user_user', ['user_id'], ['id'])

    op.create_foreign_key('fk_system_timezones_create_by', 'system_timezones', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_timezones_updated_by', 'system_timezones', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_user_logs_create_by', 'user_logs', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_user_logs_updated_by', 'user_logs', 'user_user', ['updated_by'], ['id'])
    op.create_foreign_key('fk_user_logs_user_id', 'user_logs', 'user_user', ['user_id'], ['id'])

    op.create_foreign_key('fk_system_app_settings_app_id', 'system_app_settings', 'system_apps', ['app_id'], ['id'])
    op.create_foreign_key('fk_system_app_settings_create_by', 'system_app_settings', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_app_settings_updated_by', 'system_app_settings', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_attachments_company_id', 'system_attachments', 'system_companies', ['company_id'], ['id'])
    op.create_foreign_key('fk_system_attachments_create_by', 'system_attachments', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_attachments_model_id', 'system_attachments', 'system_models', ['model_id'], ['id'])
    op.create_foreign_key('fk_system_attachments_updated_by', 'system_attachments', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_country_timezone_rel_country_id', 'system_country_timezone_rel', 'system_countries', ['country_id'], ['id'])
    op.create_foreign_key('fk_system_country_timezone_rel_timezone_id', 'system_country_timezone_rel', 'system_timezones', ['timezone_id'], ['id'])

    op.create_foreign_key('fk_system_message_user_rel_message_id', 'system_message_user_rel', 'system_messages', ['message_id'], ['id'])
    op.create_foreign_key('fk_system_message_user_rel_user_id', 'system_message_user_rel', 'user_user', ['user_id'], ['id'])

    op.create_foreign_key('fk_system_model_fields_create_by', 'system_model_fields', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_model_fields_model_id', 'system_model_fields', 'system_models', ['model_id'], ['id'])
    op.create_foreign_key('fk_system_model_fields_updated_by', 'system_model_fields', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_model_followers_create_by', 'system_model_followers', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_model_followers_model_id', 'system_model_followers', 'system_models', ['model_id'], ['id'])
    op.create_foreign_key('fk_system_model_followers_updated_by', 'system_model_followers', 'user_user', ['updated_by'], ['id'])
    op.create_foreign_key('fk_system_model_followers_user_id', 'system_model_followers', 'user_user', ['user_id'], ['id'], ondelete='CASCADE')

    op.create_foreign_key('fk_system_model_schemas_create_by', 'system_model_schemas', 'user_user', ['create_by'], ['id'])
    op.create_foreign_key('fk_system_model_schemas_model_id', 'system_model_schemas', 'system_models', ['model_id'], ['id'])
    op.create_foreign_key('fk_system_model_schemas_updated_by', 'system_model_schemas', 'user_user', ['updated_by'], ['id'])

    op.create_foreign_key('fk_system_notification_user_rel_notification_id', 'system_notification_user_rel', 'system_notifications', ['notification_id'], ['id'])
    op.create_foreign_key('fk_system_notification_user_rel_user_id', 'system_notification_user_rel', 'user_user', ['user_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### tables dropped with CASCADE so dependent foreign keys added in
    # upgrade() don't block the drop regardless of table order ###
    for table in (
        'system_notification_user_rel',
        'system_model_schemas',
        'system_model_followers',
        'system_model_fields',
        'system_message_user_rel',
        'system_country_timezone_rel',
        'system_attachments',
        'system_app_settings',
        'user_logs',
        'system_timezones',
        'system_tasks',
        'system_notifications',
        'system_models',
        'system_messages',
        'system_apps',
        'user_user',
        'system_seed_runs',
        'system_langs',
        'system_currencies',
        'system_country_states',
        'system_countries',
        'system_companies',
    ):
        op.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
    # ### end Alembic commands ###
