# Sistema de Trazabilidad y Monitoreo de Cadmio en Cacao - V2

Sistema profesional de producción para el monitoreo del cadmio en productos de cacao.

## Jerarquía de datos

- **Producto** (Torta de cacao, Grano, Polvo, Alcalino, etc.)
- **Lote**
- **Orígenes de grano** (múltiples por lote)
- **Guías / Cargas de grano** (identificadas por Origen + Guía)

## Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + Pandas + Numpy + Plotly
- **Frontend**: React + Vite + Tailwind CSS (diseño limpio estilo Google)
- **Auth**: JWT + roles (Admin / Analista / Viewer)
- **Gráficos**: Interactivos (Plotly) que se actualizan con nuevos datos
- **Docker**: Listo para producción

## Características

- Dashboard con KPIs de cadmio
- Gráficos interactivos por producto, lote y origen
- Registro de análisis de grano (por guía/origen) y de producto (por lote)
- Composición de lotes (orígenes por peso)
- Importación de Excel
- Exportación de reportes
- Auditoría
- Tema claro, limpio y profesional

## Cómo levantar el sistema

```bash
git clone https://github.com/rframosyataco8-ux/sistema-cadmio-cacao-v2.git
cd sistema-cadmio-cacao-v2
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API + docs: http://localhost:8000/docs
- Usuario por defecto: `admin@cadmio.local` / `admin123`

## Estructura del proyecto

```
backend/          # FastAPI
frontend/         # React + Tailwind
docker-compose.yml
```

Desarrollado para uso en producción.
