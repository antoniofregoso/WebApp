# Backend API

Este proyecto es un backend moderno construido con **FastAPI**, **Strawberry GraphQL**, **SQLModel** y **PostgreSQL**.

## 🚀 Inicio Rápido con Docker (Recomendado)

Esta es la forma más fácil de ejecutar el proyecto, ya que configura la base de datos y la aplicación automáticamente.

1.  **Construir y levantar contenedores:**
    ```bash
    docker-compose up --build
    ```
    La API estará disponible en: [http://localhost:8000/graphql](http://localhost:8000/graphql)

2.  **Detener contenedores:**
    ```bash
    docker-compose down
    ```

---

## 🗄️ Gestión de Base de Datos (Migraciones)

Este proyecto utiliza **Alembic** para gestionar los cambios en la estructura de la base de datos. Como la creación automática de tablas está desactivada, **debes ejecutar las migraciones** para crear las tablas inicialmente o actualizarlas.

> [!IMPORTANT]
> La base de datos (el nombre del esquema) debe existir previamente en PostgreSQL. Alembic crea las tablas, pero no la base de datos en sí. Puedes crearla con:
> ```bash
> psql -h localhost -U odoo -d postgres -c "CREATE DATABASE app_db;"
> ```

### 🐳 Usando Docker

Ejecuta estos comandos en otra terminal mientras los contenedores están corriendo (`docker-compose up -d`):

1.  **Crear una migración nueva** (después de modificar modelos en `app/domains/`):
    ```bash
    docker-compose exec web alembic revision --autogenerate -m "descripcion_del_cambio"
    ```

2.  **Aplicar cambios a la Base de Datos** (Crear/Actualizar tablas):
    ```bash
    docker-compose exec web alembic upgrade head
    ```

### 💻 Ejecución Local (Sin Docker)

Si prefieres ejecutarlo en tu máquina (requiere Python 3.10+ y una base de datos PostgreSQL/SQLite corriendo):

1.  **Instalar dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configurar entorno:**
    Crea un archivo `.env` basado en las variables requeridas en
    `app/core/config/settings.py` (DB_CONFIG, SECRET_KEY, etc).

3.  **Comandos de Migración:**
    *   **Crear migración:** `alembic revision --autogenerate -m "mensaje"`
    *   **Aplicar cambios:** `alembic upgrade head`
    *   **Revertir último cambio:** `alembic downgrade -1`

4.  **Ejecutar Servidor:**
    ```bash
    uvicorn main:app --reload
    ```

## 🛠️ Stack Tecnológico
*   **Framework**: FastAPI
*   **GraphQL**: Strawberry
*   **ORM**: SQLModel (SQLAlchemy + Pydantic)
*   **DB Migrations**: Alembic (Async)
*   **Auth**: JWT + Argon2
*   **Settings**: Pydantic Settings

## 📝 Logging y Observabilidad

El backend cuenta con un sistema de logging estructurado. Puedes controlar el nivel de detalle mediante la variable de entorno `LOG_LEVEL`.

**Niveles Disponibles:**
*   `DEBUG`: Máximo detalle (para desarrollo local).
*   `INFO`: Información general del funcionamiento (Recomendado por defecto).
*   `WARNING`: Solo advertencias (ej. intentos de login fallidos).
*   `ERROR`: Solo errores críticos.

**Cómo cambiarlo:**
*   **Docker**: Edita `docker-compose.yml` y cambia `LOG_LEVEL=INFO`.
*   **Local**: Añade `LOG_LEVEL=DEBUG` a tu archivo `.env`.
