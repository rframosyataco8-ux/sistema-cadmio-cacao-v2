from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from app.core.config import settings
from app.core.middleware import (
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    LimitRequestSizeMiddleware,
)
from app.core.metrics import PrometheusMiddleware, metrics_response
from app.db.session import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.api import auth, catalog, lots, samples, analytics


def migrate_schema():
    """Migraciones ligeras e idempotentes. Evita el enum PG problemático."""
    with engine.begin() as conn:
        for stmt in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT",
            # role como VARCHAR: elimina conflictos ADMIN vs admin del enum nativo
            """
            DO $$ BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'role'
              ) THEN
                BEGIN
                  ALTER TABLE users
                    ALTER COLUMN role TYPE VARCHAR(20)
                    USING lower(role::text);
                EXCEPTION WHEN others THEN
                  # ya es varchar u otro tipo compatible
                  NULL;
                END;
                UPDATE users SET role = lower(role) WHERE role IS NOT NULL AND role <> lower(role);
              END IF;
            END $$;
            """,
        ]:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"migrate: {e}")


def seed_admin():
    """Garantiza admin y lab con contraseñas conocidas (idempotente)."""
    import json
    from app.models.user import LAB_PERMISSIONS

    db = SessionLocal()
    try:
        accounts = [
            {
                "email": "admin@cadmio.com",
                "full_name": "Administrador",
                "password": "admin123",
                "role": UserRole.ADMIN.value,
                "permissions": None,
            },
            {
                "email": "lab@cadmio.com",
                "full_name": "Personal de Laboratorio",
                "password": "lab123",
                "role": UserRole.LAB.value,
                "permissions": json.dumps(LAB_PERMISSIONS),
            },
        ]
        for acc in accounts:
            u = db.query(User).filter(User.email == acc["email"]).first()
            if not u:
                if acc["email"] == "admin@cadmio.com":
                    u = db.query(User).filter(User.email == "admin@cadmio.local").first()
                    if u:
                        u.email = acc["email"]
                if not u:
                    u = User(
                        email=acc["email"],
                        full_name=acc["full_name"],
                        hashed_password=get_password_hash(acc["password"]),
                        role=acc["role"],
                        is_active=True,
                        permissions=acc["permissions"],
                    )
                    db.add(u)
                    print(f"Usuario creado: {acc['email']}")
            u.full_name = acc["full_name"]
            u.hashed_password = get_password_hash(acc["password"])
            u.role = acc["role"]
            u.is_active = True
            if acc["permissions"] is not None:
                u.permissions = acc["permissions"]
            print(f"Usuario listo: {acc['email']} / rol={acc['role']}")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"seed_admin error: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    migrate_schema()
    seed_admin()
    # Si no hay muestras, carga datos reales del Excel (idempotente)
    try:
        from app.models.sample import SampleLot, SampleGrain
        db = SessionLocal()
        try:
            n_lot = db.query(SampleLot).count()
            n_grain = db.query(SampleGrain).count()
        finally:
            db.close()
        if n_lot == 0 and n_grain == 0:
            print("BD vacía: ejecutando seed de datos reales...")
            from app.db.seed import seed as seed_real_data
            seed_real_data()
        else:
            print(f"Datos existentes: {n_lot} muestras lote, {n_grain} grano")
    except Exception as e:
        print(f"Nota auto-seed: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(PrometheusMiddleware)
app.add_middleware(LimitRequestSizeMiddleware, max_body_bytes=settings.MAX_REQUEST_BODY_BYTES)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=settings.RATE_LIMIT_PER_MINUTE,
    login_per_minute=settings.RATE_LIMIT_LOGIN_PER_MINUTE,
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(catalog.router, prefix=settings.API_V1_STR)
app.include_router(lots.router, prefix=settings.API_V1_STR)
app.include_router(samples.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for e in exc.errors():
        loc = " → ".join(str(x) for x in e.get("loc", []) if x != "body")
        errors.append({"field": loc or "body", "message": e.get("msg", "Dato inválido")})
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Datos de entrada inválidos",
            "code": "validation_error",
            "errors": errors,
        },
    )


@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={
            "detail": "Conflicto de datos (duplicado o referencia inválida).",
            "code": "integrity_error",
        },
    )


@app.exception_handler(OperationalError)
async def operational_exception_handler(request: Request, exc: OperationalError):
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Servicio de base de datos no disponible temporalmente.",
            "code": "db_unavailable",
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error al procesar la operación en base de datos.",
            "code": "db_error",
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] {request.method} {request.url.path}: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor. Inténtalo de nuevo.",
            "code": "internal_error",
        },
    )


@app.get("/")
def root():
    return {"name": settings.PROJECT_NAME, "version": settings.VERSION, "status": "ok"}


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    try:
        from app.core.cache import analytics_cache
        cache_name = analytics_cache.backend_name
    except Exception:
        cache_name = "unknown"
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "ok" if db_ok else "error",
        "cache": cache_name,
        "version": settings.VERSION,
    }


@app.get("/metrics", include_in_schema=False)
def metrics():
    return metrics_response()
