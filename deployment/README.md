# Deployment Instructions

This folder contains the Linux deployment artifacts for Musig Elgg.

## Server Paths

- Repository root: `/var/www/jan-bretscher/04_musig-elgg/musig_elgg`
- Deploy script target: `/var/www/jan-bretscher/04_musig-elgg/deploy.sh`
- Public APK directory: `/var/www/jan-bretscher/04_musig-elgg/public/downloads`
- Android SDK: `/opt/android-sdk`

## Prerequisites

- Node.js with npm
- Java 21
- Android SDK at `/opt/android-sdk`
- MySQL
- Nginx
- `www-data` access for the frontend and backend services

## One-Command Deployment

1. Copy the repository to `/var/www/jan-bretscher/04_musig-elgg/musig_elgg`.
2. Copy the repo root script to `/var/www/jan-bretscher/04_musig-elgg/deploy.sh` and make it executable:

```bash
sudo cp /var/www/jan-bretscher/04_musig-elgg/musig_elgg/deploy.sh /var/www/jan-bretscher/04_musig-elgg/deploy.sh
sudo chmod +x /var/www/jan-bretscher/04_musig-elgg/deploy.sh
```

3. Run the deployment:

```bash
sudo /var/www/jan-bretscher/04_musig-elgg/deploy.sh
```

The script performs these steps:

- pulls the latest code from `origin/main`
- installs backend dependencies with `npm ci --omit=dev`
- runs Prisma generate and deploy migrations
- installs frontend dependencies with `npm ci`
- builds the live web frontend
- syncs the Capacitor Android project
- builds `app-debug.apk`
- publishes the APK as `/downloads/musig-elgg-admin.apk`
- copies the APK both into `020_frontend/dist/downloads` and into `/var/www/jan-bretscher/04_musig-elgg/public/downloads`
- restarts `musig-elgg-backend.service` and `musig-elgg-frontend.service`

The public download page is available at `/download` and links to the generated APK.

If `/downloads/musig-elgg-admin.apk` ever returns the frontend `index.html`, the request is hitting the SPA fallback instead of a real file. Copying the APK into `dist/downloads` avoids that problem even when the Nginx `location /downloads/` alias is missing or misconfigured.

## Systemd Services

Install the included unit files:

```bash
sudo cp deployment/musig_elgg-backend.service /etc/systemd/system/
sudo cp deployment/musig_elgg-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable musig-elgg-backend.service
sudo systemctl enable musig-elgg-frontend.service
```

## Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name musig-elgg.ch;

    location /downloads/ {
        alias /var/www/jan-bretscher/04_musig-elgg/public/downloads/;
        add_header Cache-Control "no-store";
        types {
            application/vnd.android.package-archive apk;
        }
        default_type application/octet-stream;
    }

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## Redis Queue Setup

The application uses Redis for background job processing.

```bash
docker compose -f deployment/docker-compose.redis.yml up -d
```

Or install Redis directly on the host:

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```
