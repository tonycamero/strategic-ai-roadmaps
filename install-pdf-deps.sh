#!/bin/bash

# Install Missing PDF Dependencies
echo "📦 Installing PDF generation dependencies..."
echo ""

cd ~/code/Strategic_AI_Roadmaps

echo "Installing packages..."
pnpm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "You can now restart your backend server with:"
echo "  cd ~/code/Strategic_AI_Roadmaps/backend"
echo "  pnpm run dev"
