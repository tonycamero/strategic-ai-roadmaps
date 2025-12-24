#!/bin/bash

# Quick fix - install correct chromium version
cd ~/code/Strategic_AI_Roadmaps

echo "📦 Installing correct versions of PDF dependencies..."
echo ""

pnpm install

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Installation complete!"
  echo ""
  echo "Now starting backend server..."
  cd backend
  pnpm run dev
else
  echo ""
  echo "❌ Installation failed. Please check the error above."
  exit 1
fi
