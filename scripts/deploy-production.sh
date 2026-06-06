#!/bin/bash
#
# Production Deployment Script for TaskFlow Pro
# Usage: ./scripts/deploy-production.sh
#

set -e  # Exit on error

echo "🚀 TaskFlow Pro - Production Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo -e "${RED}❌ Do not run this script as root${NC}"
  exit 1
fi

# Pre-deployment checks
echo ""
echo "📋 Pre-deployment checks..."

# Check if .env files exist
if [ ! -f "server/.env" ]; then
  echo -e "${RED}❌ server/.env not found${NC}"
  echo "Copy server/.env.example and configure it"
  exit 1
fi

if [ ! -f "client/.env" ]; then
  echo -e "${RED}❌ client/.env not found${NC}"
  echo "Copy client/.env.example and configure it"
  exit 1
fi

echo -e "${GREEN}✅ Environment files found${NC}"

# Check Docker is installed
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker not installed${NC}"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}❌ Docker Compose not installed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker installed${NC}"

# Validate environment variables
echo ""
echo "🔐 Validating environment variables..."

# Check JWT secrets length
JWT_ACCESS_SECRET=$(grep JWT_ACCESS_SECRET server/.env | cut -d '=' -f2)
JWT_REFRESH_SECRET=$(grep JWT_REFRESH_SECRET server/.env | cut -d '=' -f2)

if [ ${#JWT_ACCESS_SECRET} -lt 32 ]; then
  echo -e "${RED}❌ JWT_ACCESS_SECRET is too short (< 32 characters)${NC}"
  echo "Generate with: openssl rand -hex 32"
  exit 1
fi

if [ ${#JWT_REFRESH_SECRET} -lt 32 ]; then
  echo -e "${RED}❌ JWT_REFRESH_SECRET is too short (< 32 characters)${NC}"
  echo "Generate with: openssl rand -hex 32"
  exit 1
fi

# Check for default secrets
if [[ "$JWT_ACCESS_SECRET" == *"change_me"* ]]; then
  echo -e "${RED}❌ JWT_ACCESS_SECRET contains default value${NC}"
  exit 1
fi

if [[ "$JWT_REFRESH_SECRET" == *"change_me"* ]]; then
  echo -e "${RED}❌ JWT_REFRESH_SECRET contains default value${NC}"
  exit 1
fi

echo -e "${GREEN}✅ JWT secrets validated${NC}"

# Run security audit
echo ""
echo "🔍 Running security audit..."

cd server
if npm audit --production --audit-level=high | grep -q "found 0 vulnerabilities"; then
  echo -e "${GREEN}✅ No high/critical vulnerabilities in server${NC}"
else
  echo -e "${YELLOW}⚠️  Vulnerabilities found in server dependencies${NC}"
  npm audit --production --audit-level=high
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
cd ..

cd client
if npm audit --production --audit-level=high | grep -q "found 0 vulnerabilities"; then
  echo -e "${GREEN}✅ No high/critical vulnerabilities in client${NC}"
else
  echo -e "${YELLOW}⚠️  Vulnerabilities found in client dependencies${NC}"
  npm audit --production --audit-level=high
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
cd ..

# Run tests
echo ""
echo "🧪 Running tests..."

cd server
if npm test; then
  echo -e "${GREEN}✅ Server tests passed${NC}"
else
  echo -e "${RED}❌ Server tests failed${NC}"
  exit 1
fi
cd ..

# Backup current deployment
echo ""
echo "💾 Creating backup..."

BACKUP_DIR="backups/deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -d "data" ]; then
  cp -r data "$BACKUP_DIR/"
  echo -e "${GREEN}✅ Data backed up to $BACKUP_DIR${NC}"
fi

# Build Docker images
echo ""
echo "🔨 Building Docker images..."

docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Docker images built successfully${NC}"
else
  echo -e "${RED}❌ Docker build failed${NC}"
  exit 1
fi

# Stop old containers
echo ""
echo "🛑 Stopping old containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Start new containers
echo ""
echo "▶️  Starting new containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."

MAX_WAIT=120
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
  if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✅ Server is healthy${NC}"
    break
  fi
  echo "Waiting for server... ($WAITED/$MAX_WAIT seconds)"
  sleep 5
  WAITED=$((WAITED + 5))
done

if [ $WAITED -ge $MAX_WAIT ]; then
  echo -e "${RED}❌ Server failed to start within $MAX_WAIT seconds${NC}"
  echo "Checking logs..."
  docker-compose logs --tail=50 server
  exit 1
fi

# Verify deployment
echo ""
echo "✅ Verifying deployment..."

# Check all containers are running
if docker-compose ps | grep -q "Up"; then
  echo -e "${GREEN}✅ All containers are running${NC}"
else
  echo -e "${RED}❌ Some containers are not running${NC}"
  docker-compose ps
  exit 1
fi

# Test API endpoint
if curl -s http://localhost:5000/health?detailed=true | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ API health check passed${NC}"
else
  echo -e "${RED}❌ API health check failed${NC}"
  exit 1
fi

# Success
echo ""
echo "========================================"
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "========================================"
echo ""
echo "📊 Deployment Information:"
echo "  - Backup: $BACKUP_DIR"
echo "  - Server: http://localhost:5000"
echo "  - Client: http://localhost:80"
echo "  - Health: http://localhost:5000/health?detailed=true"
echo ""
echo "📝 Next Steps:"
echo "  1. Test the application thoroughly"
echo "  2. Monitor logs: docker-compose logs -f"
echo "  3. Check metrics: docker stats"
echo "  4. Setup monitoring alerts"
echo "  5. Configure SSL certificates"
echo ""
echo "🔄 To rollback:"
echo "  docker-compose down"
echo "  git checkout <previous-commit>"
echo "  ./scripts/deploy-production.sh"
echo ""
