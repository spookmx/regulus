# Regulus — Regulatory Intelligence & Compliance Orchestration System

**Regulus** models regulatory **provenance** — the traceable origin of every product decision back to law — and automates the lifecycle of compliance delivery end-to-end.

---

## Architecture Overview

Regulus replaces fragmented compliance handoffs with a single connected system where the full regulatory chain is observable, traceable, and AI-assisted.

- **Agent Runtime**: Google Antigravity SDK (Python ≥ 3.11) with typed tool pipelines and MCP server integration.
- **Backend Service**: FastAPI backend handling API routes, rule evaluation, and agent execution.
- **Frontend App**: Next.js 16 (App Router) + Tailwind CSS + Firebase Auth & TanStack Query.
- **Persistence & Storage**: Firebase Cloud Firestore + Vector Index.

---

## Directory Layout

```text
regulus/
├── backend/            # FastAPI & Antigravity agent runtime
│   ├── app/            # Core backend logic, routes, and services
│   ├── tests/          # Pytest suite
│   ├── main.py         # Entrypoint
│   └── requirements.txt# Python dependencies
├── frontend/           # Next.js web application
│   ├── src/            # App router pages, components, context
│   ├── e2e/            # Playwright end-to-end tests
│   └── package.json    # Frontend dependencies & scripts
├── scripts/            # Utility and seeding scripts
├── docker-compose.yml  # Local services configuration
├── firebase.json       # Firebase services configuration
├── firestore.rules     # Firestore security rules
└── regulus-mvp.md      # Full MVP specification & artifact schemas
```

---

## Getting Started

### Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 20.x or higher
- **Firebase CLI**: `npm install -g firebase-tools`
- **Docker** (optional for local services)

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest  # Run test suite
python main.py  # Start local server
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev  # Start Next.js development server at http://localhost:3000
```

---

## Testing & CI/CD

- **Backend Unit Tests**: Run `pytest` inside the `backend/` directory.
- **Frontend Quality**: Run `npm run lint` and `npx tsc --noEmit` inside `frontend/`.
- **Automated CI**: GitHub Actions workflow defined in `.github/workflows/ci.yml` validates code on pull requests and pushes to `main`.

---

## Contributing

1. Create a feature branch (`git checkout -b feature/my-feature`).
2. Follow the issue and PR templates in `.github/`.
3. Ensure all backend tests pass and frontend builds cleanly.
4. Submit a Pull Request.
