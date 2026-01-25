# Deployment Instructions

This folder contains Systemd service files to deploy the Musig Elgg application on a Linux server (e.g., Ubuntu/Debian).

## Prerequisites

- **Node.js** (v18 or higher)
- **MySQL** Server
- **Nginx** (Reverse Proxy)

## 1. Backend Setup

1.  Copy the backend code to `/var/www/musig_elgg/010_backend`.
2.  Install dependencies:
    ```bash
    cd /var/www/musig_elgg/010_backend
    npm install
    ```
3.  Configure `.env` file with your database credentials.
4.  Run Prisma migrations:
    ```bash
    npx prisma migrate deploy
    ```
5.  Setup Systemd:
    ```bash
    sudo cp deployment/musig_elgg-backend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable musig_elgg-backend
    sudo systemctl start musig_elgg-backend
    ```

## 2. Frontend Setup

1.  Copy the frontend code to `/var/www/musig_elgg/020_frontend`.
2.  Install dependencies:
    ```bash
    cd /var/www/musig_elgg/020_frontend
    npm install
    # Build the project
    npm run build
    ```
3.  Setup Systemd:
    ```bash
    sudo cp deployment/musig_elgg-frontend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable musig_elgg-frontend
    sudo systemctl start musig_elgg-frontend
    ```
    *Note: The frontend service uses `npx serve` to host the `dist` folder on port 4000.*

## 3. Nginx Configuration (Example)

You should configure Nginx to proxy requests to these services.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}

## 4. Redis Queue Setup

The application uses Redis for background job processing (Event Reminders).

1.  Start Redis:
    If you are using Docker, you can use the provided `docker-compose.redis.yml`:
    ```bash
    docker-compose -f deployment/docker-compose.redis.yml up -d
    ```
    Or install Redis server on your host:
    ```bash
    sudo apt install redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    ```

2.  Configure `.env` in `010_backend`:
    ```
    REDIS_HOST=localhost
    REDIS_PORT=6379
    ```
```
