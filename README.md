# CyberCash Predict

Predictive ATM Cash-Out Intelligence is a synthetic-data-only SIH26184 prototype. It highlights *probabilistic* ATM/zone risk signals and likely time windows for authorized investigators; it does not identify criminals or establish that an event will occur.

## Architecture

- `frontend/` — React + TypeScript + Vite investigator console.
- `backend/` — FastAPI REST API, JWT/RBAC and deterministic synthetic operational data.
- `ml/` — reproducible scikit-learn baseline and Random Forest training/prediction package.
- `docker-compose.yml` — frontend, backend, and PostGIS service topology.

## Run locally

1. Copy `.env.example` to `.env` and change `JWT_SECRET`.
2. Backend: `cd backend; python -m venv .venv; .venv\Scripts\pip install -r requirements.txt; .venv\Scripts\uvicorn app.main:app --reload --port 8000`
3. Frontend: `cd frontend; npm install; npm run dev`
4. Open `http://localhost:5173`. API docs are at `http://localhost:8000/docs`.

Demo users: `admin@cybercash.local` / `DemoAdmin!2026`, `investigator@cybercash.local` / `DemoInvestigator!2026`, and `analyst@cybercash.local` / `DemoAnalyst!2026`.

## Data and ML

The backend is intentionally self-contained for a frictionless demonstration. It deterministically produces 120 ATMs, 800 transactions, cases, predictions and alerts (seed 26184). Run `python -m ml.train` from the repository root to train Logistic Regression and Random Forest models, print actual held-out metrics, and persist the chosen Random Forest package in `ml/artifacts/`. `python -m ml.predict` exposes reusable prediction loading logic.

For the full deployment topology run `docker compose up --build`; the compose stack starts a PostGIS image. Production migration/ingestion adapters should replace the demo in-memory repository before any authorized real-data use.

## Security and limitations

JWT authorization is enforced in API dependencies: reporting/alerts require Investigator or Admin, model management requires Analyst or Admin. The prototype uses no real PII or financial credentials. PostgreSQL/PostGIS, Alembic migrations, persistent audit storage, PDF map capture, and a true Leaflet tile/heatmap layer are deployment extensions not enabled in the self-contained demo API.
