# 🚀 Quick Start Guide - Backend

## Instalación rápida

```bash
# 1. Activar entorno virtual
cd backend
source .venv/bin/activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Crear archivo .env
cp .env.example .env

# 4. Ejecutar tests
pytest -v

# 5. Ejecutar aplicación
python main.py
```

---

## Estructura de carpetas recomendada

```
backend/
├── app/
│   ├── core/         # Configuración, BD, seguridad y excepciones
│   └── domains/      # Dominios, servicios, repositorios y GraphQL
├── migrations/       # Migraciones de Alembic
├── tests/            # Tests con pytest
├── main.py           # FastAPI app
└── requirements.txt  # Dependencias
```

---

## Ejemplo: Crear un nuevo servicio

```python
# app/domains/products/service/product_service.py
from app.core.logging import get_logger
from app.core.exceptions import ResourceNotFoundException, DuplicateEntryException
from app.domains.products.repository.product_repository import ProductRepository

logger = get_logger(__name__)

class ProductService:
    @staticmethod
    async def get_product(product_id: int):
        logger.info(f"Fetching product {product_id}")
        product = await ProductRepository.get(product_id)
        
        if not product:
            raise ResourceNotFoundException(
                resource="Product",
                resource_id=product_id
            )
        return product
    
    @staticmethod
    async def create_product(name: str, price: float):
        logger.info(f"Creating product: {name}")
        
        # Validar precio
        if price <= 0:
            from exceptions import ValidationException
            raise ValidationException(
                "Price must be positive",
                details={"field": "price", "value": price}
            )
        
        product = Product(name=name, price=price)
        await ProductRepository.create(product)
        
        logger.info(f"Product created: {product.id}")
        return product
```

---

## Ejemplo: Test para el servicio

```python
# tests/test_product_service.py
import pytest
from Service.product import ProductService
from exceptions import ResourceNotFoundException

@pytest.mark.asyncio
async def test_get_product_not_found():
    """Test que obtener un producto inexistente falla."""
    with pytest.raises(ResourceNotFoundException):
        await ProductService.get_product(999)

@pytest.mark.asyncio
async def test_create_product_with_negative_price():
    """Test que crear producto con precio negativo falla."""
    from exceptions import ValidationException
    
    with pytest.raises(ValidationException):
        await ProductService.create_product("Test", -10)
```

---

## Rate limiting en endpoints

```python
# main.py
from main import limiter

@app.post("/api/products")
@limiter.limit("10/minute")
async def create_product(request: Request, product: ProductInput):
    return await ProductService.create_product(
        product.name,
        product.price
    )
```

---

## Logging en acciones importantes

```python
# Service/authentication.py
logger.info(
    "User login attempt",
    extra={
        "email": email,
        "ip": request.client.host,
        "timestamp": datetime.utcnow().isoformat()
    }
)

logger.error(
    "Login failed",
    extra={
        "email": email,
        "reason": "invalid_password"
    }
)
```

---

## Comandos útiles de desarrollo

```bash
# Ejecutar tests en modo watch
pytest-watch

# Ejecutar tests con cobertura
pytest --cov=. --cov-report=html

# Generar reporte de cobertura
coverage report

# Formatear código
black .

# Verificar estilo
flake8 .

# Análisis de código
pylint Service/ Repository/

# Ejecutar aplicación en desarrollo
uvicorn main:app --reload

# Ejecutar en producción
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

---

## Variables de entorno importantes

```env
# Base de datos
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/app_db

# Seguridad
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
SESSION_ABSOLUTE_EXPIRE_DAYS=30

# CORS
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# Logging
LOG_LEVEL=INFO  # DEBUG para desarrollo

# Rate limiting
# (Configurado en código)
```

---

## Workflow de desarrollo típico

1. **Crear modelo:**
   ```python
   # Models/product.py
   class Product(SQLModel, table=True):
       id: Optional[int] = None
       name: str
       price: float
   ```

2. **Crear repositorio:**
   ```python
   # Repository/product.py
   class ProductRepository:
       @staticmethod
       async def get(product_id: int):
           # ...
   ```

3. **Crear servicio:**
   ```python
   # Service/product.py
   class ProductService:
       @staticmethod
       async def get_product(product_id: int):
           # Lógica de negocio
   ```

4. **Crear GraphQL resolver:**
   ```python
   # Graphql/query.py
   @strawberry.field
   async def product(self, id: int) -> ProductType:
       return await ProductService.get_product(id)
   ```

5. **Escribir tests:**
   ```bash
   pytest tests/test_product_service.py -v
   ```

---

## Verificación de calidad pre-commit

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 1. Formatear
black .

# 2. Verificar estilo
if ! flake8 .; then
    echo "Flake8 errors found"
    exit 1
fi

# 3. Ejecutar tests
if ! pytest tests/; then
    echo "Tests failed"
    exit 1
fi

echo "✅ All checks passed"
```

---

## Stack recomendado

| Capa | Tecnología | Propósito |
|------|-----------|----------|
| API Framework | FastAPI | Web framework moderno |
| GraphQL | Strawberry | Schema-first GraphQL |
| ORM | SQLModel | ORM con tipos |
| Database | PostgreSQL | Base de datos robusta |
| Auth | JWT + Passlib | Autenticación |
| Testing | Pytest | Testing framework |
| Quality | Black + Flake8 | Code quality |
| Logging | JSON Logger | Logging estructurado |
| Rate Limit | SlowAPI | Rate limiting |
| Migration | Alembic | Schema management |

---

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
    `app/core/config/settings.py` (DATABASE_URL, SECRET_KEY, etc).

3.  **Comandos de Migración:**
    *   **Crear migración:** `alembic revision --autogenerate -m "mensaje"`
    *   **Aplicar cambios:** `alembic upgrade head`
    *   **Revertir último cambio:** `alembic downgrade -1`

La migración inicial crea desde cero la tabla `user_user` correspondiente al
modelo `UserUser`.

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

## 📎 Archivos adjuntos

Los documentos e imágenes se guardan en un filestore local y PostgreSQL conserva
únicamente sus metadatos. En Docker, el volumen persistente `filestore_data` se
monta en `/var/lib/webapp/filestore`.

Endpoints autenticados:

* `POST /api/system/attachments`: sube un archivo con `model_uuid`, `record_uuid`
  y `file` mediante `multipart/form-data`.
* `GET /api/system/attachments/record/{model_uuid}/{record_uuid}`: lista los
  adjuntos de un registro.
* `GET /api/system/attachments/{attachment_uuid}/content`: descarga un adjunto.
* `DELETE /api/system/attachments/{attachment_uuid}`: elimina la asociación y
  borra el contenido físico cuando ya no tiene referencias.

El acceso requiere `Authorization: Bearer <token>` y queda aislado por compañía.
La ruta física usa SHA-256 (`<namespace>/<2 primeros caracteres>/<checksum>`) para
evitar colisiones y deduplicar contenido.

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



## 🎓 Recursos útiles

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Strawberry GraphQL](https://strawberry.rocks)
- [SQLModel](https://sqlmodel.tiangolo.com)
- [Pytest](https://docs.pytest.org)
- [Black](https://black.readthedocs.io)
