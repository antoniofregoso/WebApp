# Database Setup

The backend includes a setup script that recreates the PostgreSQL database,
creates all tables from the SQLModel metadata, and loads the initial data from
`backend/app/domains/system/data`.

## Run

From the `backend` directory:

```bash
./.venv/bin/python scripts/setup_database.py
```

You can also use `python scripts/setup_database.py` if your active environment
already points to the project Python.

From the repository root:

```bash
backend/.venv/bin/python backend/scripts/setup_database.py
```

The script reads `DATABASE_URL` from `.env`, for example:

```env
DATABASE_URL=postgresql+asyncpg://odoo:dexter@localhost:5432/backend
```

## Existing Database

If the target database already exists, the script asks for confirmation:

```text
The database 'backend' already exists. Delete it and continue? [y/N]:
```

Accepted affirmative answers are `y`, `yes`, `s`, `si`, and `sí`.

If the answer is not affirmative, the setup stops and the existing database is
not changed.

## What The Script Does

1. Connects to PostgreSQL using the server and credentials from `DATABASE_URL`.
2. Checks whether the target database exists.
3. Drops the target database only after confirmation.
4. Creates the target database.
5. Enables `pgcrypto` for `gen_random_uuid()`.
6. Creates all backend tables from the SQLModel metadata.
7. Loads the initial data from `backend/app/domains/system/data`.

## Load Order

The setup starts with `user.user` by creating the `App Bot` record from
`user_users.json`.

After `App Bot` exists, the script loads:

1. `system_lang.json`
2. the remaining records from `user_users.json`
3. `system_currency.json`
4. `system_country.json`
5. `system_models.json`
6. `system_model_schemas.json`

`system_model_fields.json` is currently empty because fields are embedded in
`system_models.json`.

## Audit Fields

For records that inherit from `SystemAudit`, the setup writes:

- `created_at`: current UTC date and time at setup execution
- `updated_at`: current UTC date and time at setup execution
- `create_by`: the `id` of `App Bot`
- `updated_by`: the `id` of `App Bot`

`App Bot` is created first and then updated to reference itself in its audit
fields.
