#!/bin/bash

# Define paths
BACKEND_DIR="020_backend/MusigElgg"
NSWAG_CONFIG="$BACKEND_DIR/nswag.json"

echo "Building Backend..."
dotnet build $BACKEND_DIR

if [ $? -ne 0 ]; then
    echo "Backend build failed. Exiting."
    exit 1
fi

echo "Starting Backend..."
# Start in background and save PID
#Redirect output to /dev/null to keep terminal clean, or keep it for debugging
dotnet run --project $BACKEND_DIR --urls "http://localhost:5141" > /dev/null 2>&1 &
BACKEND_PID=$!

echo "Backend started with PID $BACKEND_PID. Waiting for it to become available..."
sleep 10

echo "Generating API Client..."
# Run NSwag using npx
# Ensure nswag is installed or npx will download it
npx -y nswag run $NSWAG_CONFIG /runtime:Net90

GENERATION_STATUS=$?

echo "Stopping Backend..."
# Kill the backend process
kill $BACKEND_PID

if [ $GENERATION_STATUS -eq 0 ]; then
    echo "Client generation successful!"
else
    echo "Client generation failed!"
    exit 1
fi
