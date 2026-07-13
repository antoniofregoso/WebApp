# WebApp

WebApp is a schema-driven application template for building internal tools,
operational dashboards, and reporting systems. Models, fields, views, and
insights are declared as data, allowing the same frontend and backend to adapt
to different business domains with minimal custom code.

## Highlights

- Declarative Kanban, list, form, and calendar views
- Reusable field components, relationships, avatars, and localized labels
- FastAPI, GraphQL, SQLModel, PostgreSQL, and Alembic
- Preact, Signals, Tailwind CSS, Vite, and CJ Router
- In-app and browser push notifications
- Session activity tracking and read-only user log reporting
- Natural-language global search with declarative field metadata
- Read-only MCP reports for authorized users
- Attachment storage with authenticated previews

## Architecture

```text
Browser
  └─ Preact dashboard
       ├─ GraphQL API ── FastAPI services ── PostgreSQL
       ├─ Attachment API ── local filestore
       └─ MCP endpoint ── read-only reports
```

The canonical model definitions live in:

- `backend/app/domains/system/data/system_models.json` — models and fields
- `backend/app/domains/system/data/system_model_schemas.json` — view layouts

## Quick start

### Backend

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/setup_database.py
uvicorn main:app --reload
```

The API is available at `http://localhost:8000`, with GraphQL at
`http://localhost:8000/graphql`.

> `scripts/setup_database.py` recreates the configured database. Review
> `DATABASE_URL` before confirming the operation.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

The development server is available at `http://localhost:3000` and proxies API
requests to the backend.

### Docker

```bash
cd backend
docker compose up --build
```

This starts PostgreSQL and the backend. Run the frontend separately with Vite
for the best development experience.

## Development commands

| Task               | Command                                        |
| ------------------ | ---------------------------------------------- |
| Backend tests      | `cd backend && .venv/bin/pytest -q`            |
| Backend migrations | `cd backend && .venv/bin/alembic upgrade head` |
| Frontend tests     | `cd frontend && npm test -- --run`             |
| Frontend lint      | `cd frontend && npm run lint`                  |
| Production build   | `cd frontend && npm run build`                 |

## Documentation

Start with the [documentation index](./Doc/INDEX.md), or jump directly to:

- [Database setup](./Doc/DATABASE_SETUP.md)
- [Declarative views](./Doc/VIEWS_FORMAT.md)
- [Data format](./Doc/DATA_FORMAT.md)
- [Frontend guide](./Doc/FRONTEND.md)
- [Backend guide](./Doc/BACKEND.md)
- [GraphQL reference](./Doc/GRAPHQL_QUERIES.md)
- [Insights format](./Doc/INSIGHTS_FORMAT.md)
- [MCP reports](./Doc/MCP.md)

## Security note

The seed credentials are intended for local development only. Replace default
passwords and secrets before exposing any environment outside your workstation.

## License

See the backend [license file](./backend/LICENSE).
