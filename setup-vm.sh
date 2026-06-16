#!/bin/bash

# ==============================================================================
# Music Management - VM Setup Skript (Ubuntu)
# ==============================================================================
# Dieses Skript installiert Docker und startet die Applikation.
# Ausführung: 
# 1. git clone https://github.com/bretscherjan/music_management.git
# 2. cd music_management
# 3. chmod +x setup-vm.sh
# 4. ./setup-vm.sh
# ==============================================================================

set -e # Bricht das Skript bei Fehlern sofort ab

echo "🚀 Starte Server-Setup für Music Management..."

# 1. System-Pakete aktualisieren
echo "📦 Aktualisiere System-Pakete..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Docker installieren (falls noch nicht vorhanden)
if ! command -v docker &> /dev/null
then
    echo "🐳 Installiere Docker und Docker Compose..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✅ Docker ist bereits installiert."
fi

# 3. .env Datei generieren, falls nicht vorhanden
if [ ! -f .env ]; then
    echo "🔐 Erstelle eine neue Produktions-.env Datei..."
    
    # Sichere, zufällige Passwörter generieren
    DB_ROOT_PW=$(openssl rand -hex 16)
    DB_USER_PW=$(openssl rand -hex 16)
    JWT_SEC=$(openssl rand -hex 32)
    
    cat <<EOT > .env
# ── Produktionsumgebung (.env) ──
MYSQL_ROOT_PASSWORD=${DB_ROOT_PW}
MYSQL_DATABASE=music_management
MYSQL_USER=music_management_user
MYSQL_PASSWORD=${DB_USER_PW}

JWT_SECRET=${JWT_SEC}
JWT_EXPIRES_IN=7d

# WICHTIG: Ersetze dies mit der echten öffentlichen IP deiner Google Cloud VM!
CORS_ORIGIN=http://DEINE_ÖFFENTLICHE_IP
PUBLIC_ADMIN_MODE=false
EOT
    echo "⚠️ WICHTIG: Die .env Datei wurde erstellt. Bitte bearbeite sie mit 'nano .env' und trage die echte IP deiner VM bei CORS_ORIGIN ein!"
else
    echo "✅ .env Datei gefunden."
fi

# 4. Docker Container starten
echo "🏗 Baue und starte die Microservices..."
sudo docker compose build
sudo docker compose up -d

echo "================================================================="
echo "🎉 Setup erfolgreich abgeschlossen!"
echo ""
echo "Die Datenbank benötigt beim allerersten Start ca. 30-60 Sekunden,"
echo "um hochzufahren. Danach verbinden sich die Services automatisch."
echo ""
echo "Befehle für die Zukunft:"
echo " - Logs ansehen: sudo docker compose logs -f"
echo " - Server stoppen: sudo docker compose down"
echo " - Server neustarten: sudo docker compose restart"
echo "================================================================="
