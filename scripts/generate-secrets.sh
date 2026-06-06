#!/bin/bash
#
# Generate secure secrets for production deployment
# Usage: ./scripts/generate-secrets.sh
#

echo "🔐 TaskFlow Pro - Secret Generator"
echo "===================================="
echo ""
echo "Generating cryptographically secure secrets..."
echo ""

# Generate JWT secrets
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Generate database passwords
MONGO_ROOT_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -base64 24)

# Display secrets
echo "📝 Copy these values to your .env files:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SERVER .ENV (server/.env)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DOCKER .ENV (root directory .env)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "MONGO_ROOT_PASSWORD=$MONGO_ROOT_PASSWORD"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  SECURITY WARNINGS:"
echo "  1. Save these secrets in a secure password manager"
echo "  2. NEVER commit these to version control"
echo "  3. Rotate secrets every 90 days"
echo "  4. Use different secrets for staging/production"
echo ""
echo "💡 To save to files automatically:"
echo "  ./scripts/generate-secrets.sh > secrets.txt"
echo "  chmod 600 secrets.txt"
echo ""
