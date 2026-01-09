#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting Backend..."
cd "$SCRIPT_DIR/backend"
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting Frontend..."
cd "$SCRIPT_DIR/frontend"
npm run dev -- --host &
FRONTEND_PID=$!

echo "App running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press CTRL+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
