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
cd dev/frontend
npm run build
cd ../..

echo -e "${YELLOW}📁 Copying frontend build to app...${NC}"
rm -rf app/public
mkdir -p app/public
cp -r dev/frontend/dist/* app/public/

echo -e "${YELLOW}🔨 Building backend...${NC}"
cd dev/backend
npm run build
cd ../..

echo -e "${YELLOW}📁 Copying backend build to app...${NC}"
rm -rf app/dist
mkdir -p app/dist
cp -r dev/backend/dist/* app/dist/

echo -e "${YELLOW}📁 Copying backend package.json to app...${NC}"
rm -rf app/package.json
cp -r dev/backend/package.json app/package.json

echo -e "${YELLOW}📁 Copying backend package.production.json to app...${NC}"
rm -rf app/package.production.json
cp -r dev/backend/package.production.json app/package.production.json

echo -e "${YELLOW}📁 Copying script folder to app...${NC}"
rm -rf app/scripts
mkdir -p app/scripts
cp -r scripts/* app/scripts/

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Files ready for deployment:${NC}"
echo "   - app/dist/ (compiled backend)"
echo "   - app/public/ (frontend files)"
echo "   - app/package.json"
echo "   - app/scripts/ (scripts folder)"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "   1. Upload app/ folder to your o2switch hosting"
echo "   2. Run 'npm install --production' on the server"
echo "   3. Copy config.production.json to config.json and edit it"
echo "   4. Generate password hash with: npx tsx scripts/hash-password.ts YOUR_PASSWORD"
echo "   5. Set up Node.js app in cPanel to run: node dist/app.js"
echo "   6. Configure domain: ce-tottodiscord.vassharans.com"