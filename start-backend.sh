#!/bin/bash

# Fixed: Rebuild shared package and start backend server

echo "🔧 Building shared package..."
cd ~/code/Strategic_AI_Roadmaps/shared
pnpm build

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build failed. Check errors above."
  exit 1
fi

echo ""
echo "✅ Shared package built successfully!"
echo ""
echo "🚀 Starting backend server..."
echo ""

cd ../backend
pnpm run dev
