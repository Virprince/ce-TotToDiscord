#!/bin/bash

# Build and Deploy Script for CE-Tot-To-Discord
# Usage: ./scripts/build-and-deploy.sh

set -e

echo "🚀 Starting build and deploy process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building frontend...${NC}"
cd frontend
npm run build
cd ..

echo -e "${YELLOW}📁 Copying frontend build to backend...${NC}"
rm -rf backend/public
mkdir -p backend/public
cp -r frontend/dist/* backend/public/

echo -e "${YELLOW}🔨 Building backend...${NC}"
cd backend
npm run build
cd ..

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Files ready for deployment:${NC}"
echo "   - backend/dist/ (compiled backend)"
echo "   - backend/public/ (frontend files)"
echo "   - backend/package.json"
echo "   - backend/config.production.json (template)"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "   1. Upload backend/ folder to your o2switch hosting"
echo "   2. Run 'npm install --production' on the server"
echo "   3. Copy config.production.json to config.json and edit it"
echo "   4. Generate password hash with: npx tsx scripts/hash-password.ts YOUR_PASSWORD"
echo "   5. Set up Node.js app in cPanel to run: node dist/app.js"
echo "   6. Configure domain: ce-tottodiscord.vassharans.com"