# Google Cloud Deployment – Music Management

## Architektur auf GCP

```
Internet
    │
    ▼
Cloud Load Balancer (HTTPS)
    │
    ├── /            → Cloud Run: frontend
    ├── /api/auth/*  → Cloud Run: auth-service
    ├── /api/events/ → Cloud Run: event-service
    ├── /api/files/  → Cloud Run: file-service
    └── /api/chat/   → Cloud Run: chat-service (inkl. WebSocket)

Daten:
  ├── Cloud SQL (MySQL 8.0) – gemeinsame Datenbank für alle Services
  ├── Cloud Storage – Datei-Uploads & Chat-Daten
  └── Secret Manager – JWT, DB-Credentials
```

---

## Voraussetzungen

- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installiert und eingeloggt
- GCP-Projekt erstellt
- Billing aktiviert

---

## 1. Einmalige GCP-Infrastruktur aufsetzen

```bash
chmod +x deployment/gcp/setup.sh
./deployment/gcp/setup.sh YOUR_PROJECT_ID europe-west6
```

Das Skript erstellt:
- **Artifact Registry** für Docker Images
- **Cloud SQL** (MySQL 8, db-f1-micro)
- **Secret Manager** Einträge für DB-URL und JWT-Secret
- **GCS Buckets** für Uploads und Chat-Daten
- **IAM-Berechtigungen** für Cloud Run Service Accounts

---

## 2. Cloud Build Trigger konfigurieren

1. GCP Console → **Cloud Build** → **Triggers**
2. **"Connect Repository"** → GitHub verbinden
3. Trigger erstellen:
   - **Name**: `deploy-on-push`
   - **Event**: Push auf Branch `main`
   - **Config**: `deployment/gcp/cloudbuild.yaml`

Oder manuell deployen:
```bash
gcloud builds submit \
  --config=deployment/gcp/cloudbuild.yaml \
  --project=YOUR_PROJECT_ID .
```

---

## 3. cloudbuild.yaml anpassen

Ersetze in `deployment/gcp/cloudbuild.yaml`:
- `YOUR_PROJECT_ID` → deine GCP Projekt-ID
- `YOUR_DOMAIN` → deine Domain (z.B. `music.example.com`)
- `YOUR_OLLAMA_VM_IP` → IP der Ollama Compute Engine VM (falls vorhanden)

---

## 4. Datenbankmigrationen ausführen

Nach dem ersten Deployment muss `auth-service` die Prisma-Migrations ausführen.
Der auth-service macht dies automatisch beim Start via:
```
npx prisma@5.8.0 migrate deploy --schema=../../packages/shared/prisma/schema.prisma
```

---

## 5. Ollama auf GCP (optional)

Da Cloud Run keine persistenten GPU-Container unterstützt, empfehlen wir eine **Compute Engine VM**:

```bash
# GPU VM erstellen (N1 mit NVIDIA T4)
gcloud compute instances create ollama-vm \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=100GB \
  --maintenance-policy=TERMINATE \
  --zone=europe-west6-a

# SSH verbinden und Ollama installieren
gcloud compute ssh ollama-vm --zone=europe-west6-a
# Dann: curl -fsSL https://ollama.ai/install.sh | sh
# Dann: ollama serve --host 0.0.0.0
```

> **Hinweis**: Falls keine GPU gewünscht ist, kann Ollama auch ohne GPU auf einer CPU-VM laufen (langsamer). Alternativ kann `LLM_PROVIDER=openai` mit einem OpenAI API-Key verwendet werden.

---

## 6. WebSocket / Socket.IO auf Cloud Run

Cloud Run unterstützt WebSockets nativ. Wichtig:
- `--min-instances=1` für den chat-service (kein Cold-Start bei WebSocket-Verbindungen)
- Timeout auf 3600s setzen:
```bash
gcloud run services update chat-service \
  --timeout=3600 \
  --region=europe-west6
```

---

## 7. Load Balancer & HTTPS (optional)

Für eine eigene Domain mit HTTPS:
```bash
# Externe IP reservieren
gcloud compute addresses create music-management-ip --global

# HTTPS-Zertifikat (via Google Managed Cert)
# → GCP Console → Network Services → Load Balancing → Create LB
```

---

## Kostenschätzung (Entwicklung/klein)

| Ressource | Typ | ~Kosten/Monat |
|-----------|-----|---------------|
| Cloud SQL | db-f1-micro | ~10 CHF |
| Cloud Run (4 Services, 0 Min-Instances) | CPU auf Anfrage | ~5-20 CHF |
| Cloud Storage | 10 GB | ~0.25 CHF |
| Secret Manager | 6 Secrets | <1 CHF |
| **Total** | | **~15-35 CHF** |

> Mit `min-instances=1` für chat-service erhöhen sich die Kosten leicht, aber WebSocket-Verbindungen sind stabiler.

---

## Troubleshooting

### Service startet nicht
```bash
gcloud run logs tail auth-service --region=europe-west6
```

### DB-Verbindung testen
```bash
gcloud sql connect music-management-db --user=music_management_user
```

### Secrets prüfen
```bash
gcloud secrets list --project=YOUR_PROJECT_ID
gcloud secrets versions access latest --secret=music-management-db-url
```
