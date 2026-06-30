# CJ Web App Template

## Project objective

Create lightweight and fast web apps made with modern vanilla JavaScript using cj-router, components and utilities

## General Concepts

## Technologies

### Frontend
- HTML5
- Tailwind CSS
- Vanilla JavaScript (ES6+)
- Vite
- Signals
- apexcharts
- fontawesome
- CJ Router
- GraphQL 

### Backend
- FastAPI (Python)
- Pydantic
- GraphQL
- PostgreSQL 

## Project Structure

### Frontend

```
├── 📁 public
│   ├── 🖼️ favicon.svg
│   └── 🖼️ icons.svg
├── 📁 src
│   ├── 📁 app
│   │   └── 📁 pages
│   │       ├── 📄 dashboard.js
│   │       ├── 📄 home.js
│   │       ├── 📄 index.js
│   │       └── 📄 login.js
│   ├── 📁 assets
│   │   ├── 🖼️ hero.png
│   │   ├── 🖼️ javascript.svg
│   │   └── 🖼️ vite.svg
│   ├── 📄 App.js
│   ├── 📄 main.js
│   ├── 🎨 style.css
│   └── 📄 utils.js
├── 📁 tests
│   ├── 📄 api.test.js
│   ├── 📄 basic.test.js
│   └── 📄 utils.test.js
├── ⚙️ .gitignore
├── ⚙️ .prettierrc
├── 📝 TESTING_GUIDE.md
├── 📝 VITEST_SETUP.md
├── 📄 eslint.config.js
├── 🌐 index.html
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── 📄 postcss.config.js
├── 📄 tailwind.config.js
├── 📄 vite.config.js
└── 📄 vitest.config.js
```

### Backend

```
├── 📁 Graphql
│   ├── 🐍 __init__.py
│   ├── 🐍 mutation.py
│   └── 🐍 query.py
├── 📁 Middleware
│   ├── 🐍 JWTBearer.py
│   ├── 🐍 JWTManager.py
│   └── 🐍 __init__.py
├── 📁 Models
│   ├── 🐍 __init__.py
│   ├── 🐍 note.py
│   └── 🐍 user.py
├── 📁 Repository
│   ├── 🐍 __init__.py
│   ├── 🐍 note.py
│   └── 🐍 user.py
├── 📁 Service
│   ├── 🐍 __init__.py
│   ├── 🐍 authentication.py
│   └── 🐍 note.py
├── 📁 migrations
│   ├── 📁 versions
│   │   └── 🐍 20260219_2132_f76e43409907_initial_migration.py
│   ├── 🐍 env.py
│   └── 📄 script.py.mako
├── 📁 tests
│   ├── 🐍 __init__.py
│   ├── 🐍 conftest.py
│   ├── 🐍 test_api.py
│   └── 🐍 test_exceptions.py
├── ⚙️ .env.example
├── ⚙️ .flake8
├── 🐳 Dockerfile
├── 📝 ERROR_HANDLING_GUIDE.md
├── 📝 IMPROVEMENTS_SUMMARY.md
├── 📄 LICENSE
├── 📝 QUALITY_AND_TESTING_GUIDE.md
├── 📝 QUICK_START.md
├── 📝 README.md
├── 📝 SETUP_SUMMARY.md
├── ⚙️ alembic.ini
├── 🐍 config.py
├── ⚙️ docker-compose.yml
├── 🐍 exceptions.py
├── 🐍 logging_config.py
├── 🐍 main.py
├── ⚙️ pyproject.toml
├── 📄 requirements.txt
├── 🐍 schema.py
└── 🐍 settings.py
```

