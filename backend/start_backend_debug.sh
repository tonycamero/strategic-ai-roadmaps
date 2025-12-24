#!/bin/bash
# Navigate to backend
cd /home/tonycamero/code/Strategic_AI_Roadmaps/backend

# Explicitly load .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

pnpm run dev > backend_debug.txt 2>&1 &
echo $! > backend.pid
