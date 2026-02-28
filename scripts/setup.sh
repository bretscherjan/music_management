#!/usr/bin/env bash
# =============================================================================
# setup.sh – Docker environment setup for musig-elgg
#
# Usage:
#   ./scripts/setup.sh [dev|prod]
#
#   dev  – starts MySQL (dev DB), Redis, Ollama, Whisper  (default)
#   prod – starts Redis, Ollama, Whisper  (no MySQL)
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.1:8b}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$SCRIPT_DIR/../deployment"

# ── Argument parsing ──────────────────────────────────────────────────────────
ENV="${1:-dev}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Usage: $0 [dev|prod]"
  exit 1
fi

echo "========================================"
echo "  musig-elgg Docker Setup  [$ENV]"
echo "========================================"

# ── Helper: wait for a container to be healthy/running ────────────────────────
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

# ── Step 1: Build images that require a local Dockerfile ─────────────────────
echo ""
echo ">> Building Whisper image..."
docker compose -f "$DEPLOYMENT_DIR/whisper/docker-compose.yml" build

# ── Step 2: Start containers ─────────────────────────────────────────────────
echo ""
echo ">> Starting Redis..."
docker compose -f "$DEPLOYMENT_DIR/docker-compose.redis.yml" up -d

echo ">> Starting Ollama..."
docker compose -f "$DEPLOYMENT_DIR/ollama/docker-compose.yml" up -d

echo ">> Starting Whisper..."
docker compose -f "$DEPLOYMENT_DIR/whisper/docker-compose.yml" up -d

if [[ "$ENV" == "dev" ]]; then
  echo ">> Starting MySQL (dev)..."
  docker compose -f "$DEPLOYMENT_DIR/mysql/docker-compose.yml" up -d
fi

# ── Step 3: Pull Ollama model ─────────────────────────────────────────────────
echo ""
echo ">> Waiting for Ollama to be ready..."
wait_for_container "ollama"

echo ">> Pulling Ollama model: $OLLAMA_MODEL"
# Retry a few times – ollama may need a moment to initialise its API
for attempt in 1 2 3; do
  if docker exec ollama ollama pull "$OLLAMA_MODEL"; then
    echo "   Model ready ✓"
    break
  fi
  echo "   Attempt $attempt failed, retrying in 5 s..."
  sleep 5
done

# ── Step 4: Status ────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo "  Running containers"
echo "========================================"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
  --filter "name=ollama" \
  --filter "name=whisper" \
  --filter "name=musig_elgg"
echo ""
echo "Done! Environment [$ENV] is up."
