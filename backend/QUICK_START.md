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
DB_CONFIG=postgresql+asyncpg://user:pass@localhost:5432/app_db

# Seguridad
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

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

## 🎓 Recursos útiles

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Strawberry GraphQL](https://strawberry.rocks)
- [SQLModel](https://sqlmodel.tiangolo.com)
- [Pytest](https://docs.pytest.org)
- [Black](https://black.readthedocs.io)
