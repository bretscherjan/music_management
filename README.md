# Music Management - Microservices Architektur & Deployment

Dieses Dokument beschreibt die Architektur, den lokalen Start sowie die Deployment-Strategie der Music Management App. Die Applikation wurde von einem Monolithen in eine skalierbare Microservices-Architektur überführt, die für den Betrieb in der Google Cloud (GCP) via Cloud Run optimiert ist.

---

## 1. Architektur-Übersicht

Das System besteht nun aus mehreren isolierten Diensten, die alle hinter einem API Gateway (Nginx) zusammenlaufen. 

### Die Services im Detail:
1. **Frontend (`020_frontend`)**: Eine React/Vite-Applikation. Alle API-Anfragen gehen an `/api/*` und werden vom Gateway verarbeitet.
2. **API Gateway (`gateway`)**: Ein Nginx-Reverse-Proxy (Port 80 lokal). Er leitet Traffic basierend auf dem URL-Pfad an den richtigen Backend-Service weiter. Websocket-Traffic wird ebenfalls hierüber geleitet.
3. **Auth Service (`auth-service`)**: Zuständig für Login, Registrierung, User-Management und Settings. **Wichtig:** Dieser Service führt beim Start als einziger die Datenbank-Migration (`prisma migrate deploy`) durch.
4. **Event Service (`event-service`)**: Verwaltet Termine, Kalender-Feeds, Polling und Notification-Logik.
5. **File Service (`file-service`)**: Kümmert sich um Datei-Uploads, Sheet-Music (Noten), Setlists und die OnlyOffice-Anbindung.
6. **Chat Service (`chat-service`)**: Hält den Socket.IO Server für Echtzeit-Kommunikation. Verarbeitet Chat-Nachrichten und kommuniziert mit den AI-Diensten.
7. **Shared Package (`packages/shared`)**: Eine gemeinsame Library, die das Prisma-Schema, Datenbank-Client, Validierungen (Zod), Logger und Middlewares bereitstellt. So wird redundanter Code vermieden.

### KI-Integration (AI)
- **Whisper**: Ein lokaler Service für Audio-Transkription (Sprachnachrichten zu Text).
- **Ollama**: Führt lokale Large Language Models (LLMs) aus, z. B. um Chat-Verläufe zusammenzufassen (Protokolle).

---

## 2. Lokales Setup & Starten

Für die lokale Entwicklung wird **Docker Compose** genutzt. Es orchestriert die gesamte Umgebung inklusive einer lokalen MySQL-Datenbank.

### Voraussetzungen
- Docker Desktop oder Docker Engine installiert
- Node.js (für lokale Skript-Entwicklung)

### Start-Befehl
Navigiere ins Hauptverzeichnis und führe aus:

```bash
docker compose up --build -d
```

### Was passiert beim Starten?
1. **MySQL** startet und ist unter `localhost:3306` verfügbar.
2. Die **Backend-Services** starten. Der `auth-service` führt automatisch die Prisma-Migrationen aus, um die Tabellen anzulegen, und führt Seed-Skripte aus.
3. Das **Frontend** und das **Gateway** starten.
4. **Ollama** und **Whisper** laden ihre Modelle (Ollama lädt `llama3` automatisch herunter).

### Zugriff auf die App
- **Web-App**: http://localhost (wird über das Gateway ausgeliefert)
- **API (Beispiel Auth)**: `http://localhost/api/auth/...`
- **Socket.IO**: Verbindet sich automatisch über `http://localhost/api/socket.io`

Um die Logs eines bestimmten Services zu sehen (z.B. Chat):
```bash
docker compose logs -f chat-service
```

---

## 3. Google Cloud (GCP) Deployment-Idee

Das Ziel ist es, die App hochverfügbar, wartungsfrei und skalierbar in der Google Cloud laufen zu lassen. Die Konfigurationen dafür liegen im Ordner `deployment/gcp/`.

### Ziel-Architektur in der Cloud:
- **Google Cloud Run**: Führt die Docker-Container für Frontend, Gateway und die 4 Microservices serverless aus (skaliert bei Bedarf auf 0 oder N Instanzen).
- **Google Cloud SQL**: Managed MySQL Datenbank für ausfallsichere Datenspeicherung.
- **Google Cloud Storage (GCS)**: Speichert hochgeladene Dateien anstelle von lokalen Volumes.
- **Secret Manager**: Verwaltet sensible `.env` Variablen.
- **Compute Engine (VM)**: Für **Ollama**, da KI-Modelle GPU-Unterstützung benötigen, was in Cloud Run nicht effizient/kostengünstig ist. Cloud Run greift über eine interne IP auf diese VM zu.

### Wie das Deployment abläuft (CI/CD)
Wir nutzen **Google Cloud Build**. Die Datei `cloudbuild.yaml` definiert eine Pipeline, die:
1. Alle Docker-Images in die *Artifact Registry* pusht.
2. Die Images parallel in *Cloud Run* deployed.

#### Schritte für den Release:
1. **Infrastruktur anlegen**: Einmalig das Skript `deployment/gcp/setup.sh` in der Google Cloud Shell ausführen. Dies aktiviert die APIs, erstellt die Datenbank und die Service-Accounts.
2. **Geheimnisse hinterlegen**: `.env` Variablen im Secret Manager abspeichern.
3. **Build anstossen**:
   ```bash
   gcloud builds submit --config deployment/gcp/cloudbuild.yaml
   ```
4. Nach Abschluss des Builds gibt GCP dir eine öffentliche URL für das Gateway/Frontend zurück, unter der die App weltweit erreichbar ist.

---

## 4. Wichtige Konzepte für die Entwicklung

- **Neue Tabellen anlegen**: Änderungen im Prisma-Schema müssen in `packages/shared/prisma/schema.prisma` gemacht werden. Danach lokal `npx prisma migrate dev` (im shared-Ordner) ausführen. Beim nächsten Docker-Start führt der `auth-service` die Migration automatisch in der Datenbank aus.
- **Inter-Service Kommunikation**: Wenn ein Service Daten von einem anderen braucht (z.B. Event-Service braucht File-Metadaten), geschieht dies idealerweise über interne HTTP-Aufrufe (z.B. `http://file-service:3003/api/files/...`) oder sie teilen sich einfach die Datenbank, da alle dasselbe Prisma-Schema verwenden.
- **Websockets (Socket.IO)**: Da Cloud Run horizontales Skalieren unterstützt, ist der `chat-service` der einzige Socket.IO Server. Wenn z.B. der `event-service` ein Live-Update senden will, ruft er einen internen Endpoint im `chat-service` auf, welcher den Broadcast an alle Clients übernimmt (`websocket-bridge`).
