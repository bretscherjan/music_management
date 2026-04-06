#!/bin/bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/var/www/jan-bretscher/04_musig-elgg/musig_elgg}"
BACKEND_DIR="$REPO_DIR/010_backend"
FRONTEND_DIR="$REPO_DIR/020_frontend"
ANDROID_DIR="$FRONTEND_DIR/android"
PUBLIC_DOWNLOAD_DIR="${PUBLIC_DOWNLOAD_DIR:-/var/www/jan-bretscher/04_musig-elgg/public/downloads}"
FRONTEND_DOWNLOAD_DIR="$FRONTEND_DIR/dist/downloads"
APK_SOURCE="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
APK_TARGET="$PUBLIC_DOWNLOAD_DIR/musig-elgg-admin.apk"
FRONTEND_APK_TARGET="$FRONTEND_DOWNLOAD_DIR/musig-elgg-admin.apk"

ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/opt/android-sdk}"
ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
PATH="$JAVA_HOME/bin:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        exit 1
    fi
}

log_step() {
    echo
    echo "==> $1"
}

require_command git
require_command npm
require_command npx
require_command java

if [ ! -d "$REPO_DIR/.git" ]; then
    echo "Repository directory not found: $REPO_DIR" >&2
    exit 1
fi

if [ ! -d "$ANDROID_SDK_ROOT" ]; then
    echo "Android SDK not found at $ANDROID_SDK_ROOT" >&2
    exit 1
fi

echo "--- Starting full deployment including Android APK ---"
echo "Repository: $REPO_DIR"
echo "Android SDK: $ANDROID_SDK_ROOT"
echo "Java Home: $JAVA_HOME"
echo "APK target: $APK_TARGET"

log_step "Updating repository"
cd "$REPO_DIR"
git fetch --prune origin
git checkout main
git reset --hard origin/main

log_step "Installing backend dependencies and running Prisma"
cd "$BACKEND_DIR"
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy

log_step "Installing frontend dependencies"
cd "$FRONTEND_DIR"
npm ci

log_step "Building frontend assets"
npm run build

log_step "Syncing Capacitor Android project"
npx cap sync android

log_step "Building Android debug APK"
cd "$ANDROID_DIR"
chmod +x ./gradlew
./gradlew --no-daemon clean assembleDebug

if [ ! -f "$APK_SOURCE" ]; then
    echo "APK build output not found: $APK_SOURCE" >&2
    exit 1
fi

log_step "Publishing APK"
install -d "$FRONTEND_DOWNLOAD_DIR"
install -m 0644 "$APK_SOURCE" "$FRONTEND_APK_TARGET"
sudo install -d -o www-data -g www-data "$PUBLIC_DOWNLOAD_DIR"
sudo install -m 0644 -o www-data -g www-data "$APK_SOURCE" "$APK_TARGET"

log_step "Restarting services"
sudo systemctl daemon-reload
sudo systemctl restart musig-elgg-backend.service
sudo systemctl restart musig-elgg-frontend.service

echo
echo "--- Deployment finished successfully ---"
echo "APK available at: https://musig-elgg.ch/downloads/musig-elgg-admin.apk"
echo "Download page: https://musig-elgg.ch/download"