#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# GCP Setup Script für Music Management Microservices
# Führe dieses Skript einmalig aus, um die GCP-Infrastruktur zu konfigurieren.
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── KONFIGURATION ──────────────────────────────────────────────────────────────
PROJECT_ID="${1:-YOUR_PROJECT_ID}"
REGION="${2:-europe-west6}"
DB_INSTANCE_NAME="music-management-db"
DB_NAME="music_management"
DB_USER="music_management_user"
GCS_BUCKET_NAME="${PROJECT_ID}-music-management-uploads"
GCS_CHAT_BUCKET="${PROJECT_ID}-music-management-chat"
ARTIFACT_REPO="music-management"

echo "=== GCP Setup für Music Management ==="
echo "Project: $PROJECT_ID"
echo "Region:  $REGION"
echo ""

# ── 1. APIs aktivieren ─────────────────────────────────────────────────────────
echo "[1/8] APIs aktivieren..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  --project="$PROJECT_ID"

# ── 2. Artifact Registry erstellen ────────────────────────────────────────────
echo "[2/8] Artifact Registry Repository erstellen..."
gcloud artifacts repositories create "$ARTIFACT_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Music Management Microservices" \
  --project="$PROJECT_ID" || echo "Repository existiert bereits."

# ── 3. Cloud SQL (MySQL 8) erstellen ──────────────────────────────────────────
echo "[3/8] Cloud SQL Instanz erstellen (dies kann ~5 Minuten dauern)..."
gcloud sql instances create "$DB_INSTANCE_NAME" \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region="$REGION" \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=02:00 \
  --project="$PROJECT_ID" || echo "SQL Instanz existiert bereits."

# Datenbank erstellen
gcloud sql databases create "$DB_NAME" \
  --instance="$DB_INSTANCE_NAME" \
  --project="$PROJECT_ID" || echo "Datenbank existiert bereits."

# Passwort generieren
DB_PASSWORD=$(openssl rand -base64 32)

# User erstellen
gcloud sql users create "$DB_USER" \
  --instance="$DB_INSTANCE_NAME" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID" || echo "User existiert bereits."

# Connection String
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe "$DB_INSTANCE_NAME" \
  --format='value(connectionName)' --project="$PROJECT_ID")

DB_URL="mysql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?socket=/cloudsql/${INSTANCE_CONNECTION_NAME}"

# ── 4. Secret Manager ──────────────────────────────────────────────────────────
echo "[4/8] Secrets in Secret Manager speichern..."

# JWT Secret generieren
JWT_SECRET=$(openssl rand -hex 64)

echo -n "$DB_URL" | gcloud secrets create music-management-db-url \
  --data-file=- --project="$PROJECT_ID" || \
  echo -n "$DB_URL" | gcloud secrets versions add music-management-db-url \
    --data-file=- --project="$PROJECT_ID"

echo -n "$JWT_SECRET" | gcloud secrets create music-management-jwt-secret \
  --data-file=- --project="$PROJECT_ID" || \
  echo -n "$JWT_SECRET" | gcloud secrets versions add music-management-jwt-secret \
    --data-file=- --project="$PROJECT_ID"

echo -n "$GCS_BUCKET_NAME" | gcloud secrets create music-management-gcs-bucket \
  --data-file=- --project="$PROJECT_ID" || \
  echo -n "$GCS_BUCKET_NAME" | gcloud secrets versions add music-management-gcs-bucket \
    --data-file=- --project="$PROJECT_ID"

# ── 5. Google Cloud Storage Buckets ───────────────────────────────────────────
echo "[5/8] GCS Buckets für File-Uploads erstellen..."

gcloud storage buckets create "gs://${GCS_BUCKET_NAME}" \
  --location="$REGION" \
  --uniform-bucket-level-access \
  --project="$PROJECT_ID" || echo "Bucket existiert bereits."

gcloud storage buckets create "gs://${GCS_CHAT_BUCKET}" \
  --location="$REGION" \
  --uniform-bucket-level-access \
  --project="$PROJECT_ID" || echo "Chat Bucket existiert bereits."

# CORS-Konfiguration für Uploads
cat > /tmp/cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
gcloud storage buckets update "gs://${GCS_BUCKET_NAME}" --cors-file=/tmp/cors.json

# ── 6. Service Account Berechtigungen ─────────────────────────────────────────
echo "[6/8] Cloud Run Service Account konfigurieren..."

SA_EMAIL="$(gcloud iam service-accounts list \
  --filter='displayName:Compute Engine default service account' \
  --format='value(email)' --project="$PROJECT_ID")"

# Cloud Run SA braucht Zugriff auf Secrets
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

# Cloud Run SA braucht SQL-Client Zugriff
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client"

# Cloud Run SA braucht GCS Zugriff
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"

# ── 7. Cloud Build Trigger ────────────────────────────────────────────────────
echo "[7/8] Cloud Build Trigger erstellen..."
echo "HINWEIS: Cloud Build Trigger muss manuell über die GCP Console oder GitHub Integration konfiguriert werden."
echo "  1. GCP Console → Cloud Build → Triggers → 'Connect Repository'"
echo "  2. GitHub Repository verbinden"
echo "  3. Trigger für cloudbuild.yaml bei Push auf main Branch erstellen"

# ── 8. Zusammenfassung ────────────────────────────────────────────────────────
echo ""
echo "=== Setup abgeschlossen ==="
echo ""
echo "Wichtige Konfiguration:"
echo "  Project ID:        $PROJECT_ID"
echo "  Region:            $REGION"
echo "  SQL Instance:      $INSTANCE_CONNECTION_NAME"
echo "  GCS Bucket:        gs://$GCS_BUCKET_NAME"
echo "  Chat GCS Bucket:   gs://$GCS_CHAT_BUCKET"
echo ""
echo "Nächste Schritte:"
echo "  1. In cloudbuild.yaml: 'YOUR_DOMAIN' durch deine Domain ersetzen"
echo "  2. In cloudbuild.yaml: 'YOUR_OLLAMA_VM_IP' durch die IP deiner Ollama VM ersetzen"
echo "  3. Cloud Build Trigger via GCP Console konfigurieren"
echo "  4. Für Ollama: Compute Engine VM mit GPU erstellen (optional)"
echo "  5. Ersten Build manuell triggern: gcloud builds submit --config=deployment/gcp/cloudbuild.yaml"
echo ""
echo "Secrets wurden gespeichert:"
echo "  - music-management-db-url"
echo "  - music-management-jwt-secret"
echo "  - music-management-gcs-bucket"
