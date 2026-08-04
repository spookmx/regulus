#!/usr/bin/env bash
set -e

# Regulus Master Local Development Orchestrator Script
# Checks and starts Neo4j (ports 7687/7474) and Firebase Emulators (ports 8080/4000).
# Runs ECGT seed script to populate Firestore and Neo4j.
# Launches frontend (Next.js) and backend (FastAPI/Uvicorn) dev servers cleanly.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "======================================================"
echo "🚀 Regulus Local Development Orchestrator"
echo "======================================================"

# Helper function to check if a port is listening
is_port_open() {
  local port=$1
  lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost "$port" >/dev/null 2>&1
}

# 1. Check & Start Neo4j
echo "🔍 Checking Neo4j status (ports 7687 / 7474)..."
if is_port_open 7687 || is_port_open 7474; then
  echo "✅ Neo4j is already running."
else
  echo "⚡ Neo4j is NOT running. Starting Neo4j container..."
  if command -v docker >/dev/null 2>&1; then
    if [ -f "docker-compose.yml" ]; then
      docker compose up -d neo4j || docker-compose up -d neo4j
    else
      docker run -d --name regulus-neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/regulus neo4j:5
    fi
    echo "⌛ Waiting for Neo4j service to accept connections..."
    for i in {1..30}; do
      if is_port_open 7687 || is_port_open 7474; then
        echo "✅ Neo4j started successfully!"
        break
      fi
      sleep 1
    done
  else
    echo "⚠️  Docker command not found. Please start Neo4j manually."
  fi
fi

# 2. Check & Start Firebase Emulators
echo "🔍 Checking Firebase Emulators status (ports 8080 / 4000)..."
FIREBASE_PID=""
if is_port_open 8080 || is_port_open 4000; then
  echo "✅ Firebase Emulators are already running."
else
  echo "⚡ Firebase Emulators NOT detected. Launching emulators..."
  if [ -f "firebase.json" ]; then
    npx -y firebase-tools emulators:start --only firestore,ui &
    FIREBASE_PID=$!
    echo "⌛ Waiting for Firebase Emulators to initialize..."
    for i in {1..20}; do
      if is_port_open 8080 || is_port_open 4000; then
        echo "✅ Firebase Emulators started successfully!"
        break
      fi
      sleep 1
    done
  else
    echo "⚠️  firebase.json not found. Skipping Firebase Emulators launch."
  fi
fi

# 3. Seed ECGT Dataset
FORCE_SEED=false
for arg in "$@"; do
  if [ "$arg" == "--seed" ] || [ "$arg" == "-s" ] || [ "$arg" == "--force" ]; then
    FORCE_SEED=true
  fi
done

echo "🌱 Executing ECGT Seed Ingestion Script (seed_ecgt.py)..."
python3 scripts/seed_ecgt.py || echo "⚠️  Seed script completed with warnings."

# 4. Launch Backend & Frontend Development Servers
echo "======================================================"
echo "🎯 Launching Regulus Application Services..."
echo "======================================================"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "🛑 Terminating development servers..."
  if [ -n "$BACKEND_PID" ]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
  if [ -n "$FRONTEND_PID" ]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  if [ -n "$FIREBASE_PID" ]; then kill "$FIREBASE_PID" 2>/dev/null || true; fi
  echo "Clean shutdown complete."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start Backend if present
if [ -d "backend" ]; then
  if [ -f "backend/app/main.py" ] || [ -f "backend/main.py" ]; then
    echo "📦 Checking Backend dependencies..."
    (cd backend && pip install -r requirements.txt >/dev/null 2>&1 || true)
    echo "📦 Launching Backend API server (uvicorn/fastapi)..."
    (cd backend && python3 -m uvicorn app.main:app --reload --port 8000 2>/dev/null || python3 -m uvicorn main:app --reload --port 8000 2>/dev/null) &
    BACKEND_PID=$!
  fi
fi

# Start Frontend if present
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing Frontend dependencies (npm install)..."
    (cd frontend && npm install)
  fi
  echo "💻 Launching Frontend application (Next.js)..."
  (cd frontend && npm run dev) &
  FRONTEND_PID=$!
fi

echo "======================================================"
echo "✨ Regulus Local Development Environment is Ready!"
echo "   • Neo4j Knowledge Graph:  http://localhost:7474"
echo "   • Firebase Emulator UI:   http://localhost:4000"
echo "   • Regulus Web App:        http://localhost:3000"
echo "   • Regulus API Backend:    http://localhost:8000"
echo "======================================================"
echo "Press Ctrl+C to stop all servers."

wait
