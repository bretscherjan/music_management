#!/usr/bin/env bash
# =============================================================================
# Run.sh – unified starting script for musig-elgg
# =============================================================================

set -e

# Default values
FRONTEND=0
BACKEND=0
REDIS=0
MYSQL=0
WHISPER=0
OLLAMA=0
BUILD=0
SETUP_DOCKER=0
PULL_MODEL=0

# Parse arguments
for arg in "$@"; do
  case $arg in
    -frontend|--frontend) FRONTEND=1 ;;
    -backend|--backend) BACKEND=1 ;;
    -redis|--redis) REDIS=1 ;;
    -mysql|--mysql) MYSQL=1 ;;
    -whisper|--whisper) WHISPER=1 ;;
    -ollama|--ollama) OLLAMA=1 ;;
    -build|--build) BUILD=1 ;;
    -setupDocker|--setupDocker) SETUP_DOCKER=1 ;;
    -pullModel|--pullModel) PULL_MODEL=1 ;;
    *) echo "Unknown parameter passed: $arg"; exit 1 ;;
  esac
done

OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.1:8b}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$SCRIPT_DIR/deployment"
FRONTEND_DIR="$SCRIPT_DIR/020_frontend"
BACKEND_DIR="$SCRIPT_DIR/010_backend"

echo "========================================"
echo "  musig-elgg Start Script"
echo "========================================"

# Helper
wait_for_container() {
  local name="$1"
  local max=30
  echo -n "Waiting for $name"
  for i in $(seq 1 $max); do
    if docker inspect --format='{{.State.Running}}' "$name" 2>/dev/null | grep -q "true"; then
      echo " ✓"
      return 0
    fi
    echo -n "."
    sleep 2
  done
  echo " ✗ timeout"
  return 1
}

# ── Docker Setup ─────────────────────────────────────────────────────────────
if [ $SETUP_DOCKER -eq 1 ]; then
  echo -e "\n>> Stopping and removing all containers..."
  docker compose -f "$DEPLOYMENT_DIR/docker-compose.redis.yml" down -v --remove-orphans 2>/dev/null || true
  docker compose -f "$DEPLOYMENT_DIR/ollama/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true
  docker compose -f "$DEPLOYMENT_DIR/whisper/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true
  docker compose -f "$DEPLOYMENT_DIR/mysql/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true
  echo "   Done ✓"
fi

# ── Build ────────────────────────────────────────────────────────────────────
if [ $BUILD -eq 1 ]; then
  if [ $FRONTEND -eq 1 ]; then
    echo -e "\n>> Building Frontend..."
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    cd "$SCRIPT_DIR"
  fi
  if [ $BACKEND -eq 1 ]; then
    echo -e "\n>> Installing Backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
    cd "$SCRIPT_DIR"
  fi
  if [ $WHISPER -eq 1 ]; then
    echo -e "\n>> Building Whisper image..."
    docker compose -f "$DEPLOYMENT_DIR/whisper/docker-compose.yml" build
  fi
fi

# ── Start Docker Services ────────────────────────────────────────────────────
if [ $REDIS -eq 1 ]; then
  echo -e "\n>> Starting Redis..."
  docker compose -f "$DEPLOYMENT_DIR/docker-compose.redis.yml" up -d
fi

if [ $MYSQL -eq 1 ]; then
  echo -e "\n>> Starting MySQL..."
  docker compose -f "$DEPLOYMENT_DIR/mysql/docker-compose.yml" up -d
fi

if [ $OLLAMA -eq 1 ]; then
  echo -e "\n>> Starting Ollama..."
  docker compose -f "$DEPLOYMENT_DIR/ollama/docker-compose.yml" up -d
fi

if [ $WHISPER -eq 1 ]; then
  echo -e "\n>> Starting Whisper..."
  docker compose -f "$DEPLOYMENT_DIR/whisper/docker-compose.yml" up -d
fi

# ── Pull Model ─────────────────────────────────────────────────────────────
if [ $PULL_MODEL -eq 1 ] && [ $OLLAMA -eq 1 ]; then
  echo -e "\n>> Waiting for Ollama to be ready..."
  wait_for_container "ollama"

  echo ">> Pulling Ollama model: $OLLAMA_MODEL"
  for attempt in 1 2 3; do
    if docker exec ollama ollama pull "$OLLAMA_MODEL"; then
      echo "   Model ready ✓"
      break
    fi
    echo "   Attempt $attempt failed, retrying in 5 s..."
    sleep 5
  done
fi

# ── Start Backend & Frontend ─────────────────────────────────────────────────
start_in_terminal() {
  local CMD_DIR="$1"
  local CMD_EXEC="$2"
  local TITLE="$3"

  cd "$CMD_DIR"
  if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="$TITLE" -- bash -c "$CMD_EXEC; exec bash"
  elif command -v xfce4-terminal &> /dev/null; then
    xfce4-terminal --title="$TITLE" -x bash -c "$CMD_EXEC; exec bash"
  elif command -v konsole &> /dev/null; then
    konsole --title="$TITLE" -e bash -c "$CMD_EXEC; exec bash"
  elif command -v xterm &> /dev/null; then
    xterm -title "$TITLE" -e bash -c "$CMD_EXEC; exec bash" &
  else
    echo "No supported terminal emulator found. Running in background..."
    nohup bash -c "$CMD_EXEC" > "$(pwd)/$(echo "$TITLE" | tr ' ' '_').log" 2>&1 &
    echo "$TITLE started in background. Check $CMD_DIR/$(echo "$TITLE" | tr ' ' '_').log"
  fi
}

if [ $BACKEND -eq 1 ]; then
  echo -e "\n>> Starting Backend..."
  start_in_terminal "$BACKEND_DIR" "npm run dev" "Backend dev server"
  cd "$SCRIPT_DIR"
fi

if [ $FRONTEND -eq 1 ]; then
  echo -e "\n>> Starting Frontend..."
  start_in_terminal "$FRONTEND_DIR" "npm run dev" "Frontend dev server"
  cd "$SCRIPT_DIR"
fi

# ── Status ───────────────────────────────────────────────────────────────────
echo -e "\n========================================"
echo "  Running containers"
echo "========================================"
FILTER_ARGS=()
[ $OLLAMA -eq 1 ] && FILTER_ARGS+=("--filter" "name=ollama")
[ $WHISPER -eq 1 ] && FILTER_ARGS+=("--filter" "name=whisper")
( [ $REDIS -eq 1 ] || [ $MYSQL -eq 1 ] ) && FILTER_ARGS+=("--filter" "name=musig_elgg")

if [ ${#FILTER_ARGS[@]} -gt 0 ]; then
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" "${FILTER_ARGS[@]}"
else
  echo "No Docker containers requested."
fi

echo -e "\nDone!"
