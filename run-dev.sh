#!/bin/bash

echo "🚀 Starting UNI.CON development environment..."

# Start a new tmux session named 'unicon_dev'
tmux new-session -d -s unicon_dev

# Pane 1: Frontend (Expo)
tmux send-keys -t unicon_dev 'echo "Starting Frontend (Expo)..."; cd frontendV2/src && npm install && npx expo start --web' C-m

# Pane 2: Backend (Docker Compose)
tmux split-window -h
tmux send-keys -t unicon_dev 'echo "Starting Backend (Docker Compose)..."; cd backend && docker compose -f docker-compose.debug.yml up' C-m

# Attach to the tmux session
tmux attach-session -t unicon_dev
