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
from app.db.session import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.api import auth, catalog, lots, samples, analytics


def migrate_schema():
    with engine.begin() as conn:
        for stmt in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT",
            # Asegurar valor 'lab' en el enum de PostgreSQL (si ya existía sin él)
            """
            DO $$ BEGIN
              IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_enum e
                  JOIN pg_type t ON t.oid = e.enumtypid
                  WHERE t.typname = 'userrole' AND e.enumlabel = 'lab'
                ) THEN
                  ALTER TYPE userrole ADD VALUE 'lab';
                END IF;
              END IF;
            END $$;
            """,
        ]:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"migrate: {e}")


def seed_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(
            (User.email == "admin@cadmio.com") | (User.email == "admin@cadmio.local")
        ).first()
        if not admin:
            admin = User(
                email="admin@cadmio.com",
                full_name="Administrador",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("Usuario admin creado: admin@cadmio.com / admin123")
        elif admin.email == "admin@cadmio.local":
            admin.email = "admin@cadmio.com"
            db.commit()

        # Usuario laboratorio (flujo pendientes)
        try:
            lab = db.query(User).filter(User.email == "lab@cadmio.com").first()
            if not lab:
                from app.models.user import LAB_PERMISSIONS
                import json
                lab_user = User(
                    email="lab@cadmio.com",
                    full_name="Personal de Laboratorio",
                    hashed_password=get_password_hash("lab123"),
                    role=UserRole.LAB,
                    is_active=True,
                    permissions=json.dumps(LAB_PERMISSIONS),
                )
                db.add(lab_user)
                db.commit()
                print("Usuario lab creado: lab@cadmio.com / lab123")
        except Exception as lab_err:
            db.rollback()
            print(f"seed lab (no bloqueante): {lab_err}")
    except Exception as e:
        db.rollback()
        print(f"seed_admin error (no bloqueante): {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    migrate_schema()
    seed_admin()
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
