#!/bin/bash

# Fix: Rebuild shared package and start backend
cd ~/code/Strategic_AI_Roadmaps

echo "🔧 Rebuilding shared package..."
echo ""

# Build shared package
cd shared
pnpm build

if [ $? -ne 0 ]; then
  echo "❌ Failed to build shared package"
  exit 1
fi

echo ""
echo "✅ Shared package built successfully!"
echo ""
echo "🚀 Starting backend server..."
echo ""

# Start backend
cd ../backend
pnpm run dev
