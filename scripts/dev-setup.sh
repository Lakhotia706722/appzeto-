#!/bin/bash
# Development setup script for TaskFlow Pro

set -e

echo "🚀 Setting up TaskFlow Pro development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is available (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker detected"
    USE_DOCKER=true
else
    echo "⚠️  Docker not found. Will use local MongoDB/Redis setup."
    USE_DOCKER=false
fi

# Install dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

echo "📦 Installing client dependencies..."
cd ../client
npm install
cd ..

# Copy environment files
echo "🔧 Setting up environment files..."
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo "✅ Created server/.env - please edit with your configuration"
fi

if [ ! -f "client/.env" ]; then
    cp client/.env.example client/.env
    echo "✅ Created client/.env"
fi

# Start services
if [ "$USE_DOCKER" = true ]; then
    echo "🐳 Starting MongoDB and Redis with Docker..."
    docker run -d --name taskflow-mongo -p 27017:27017 mongo:7 || echo "MongoDB container already running"
    docker run -d --name taskflow-redis -p 6379:6379 redis:7-alpine || echo "Redis container already running"
    sleep 3
fi

echo "🌱 Seeding sample data..."
cd server
npm run seed || echo "Seeding skipped (database not ready)"
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your configuration (SMTP, Cloudinary, etc.)"
echo "2. Start the development servers:"
echo "   Terminal 1: cd server && npm run dev"
echo "   Terminal 2: cd client && npm run dev"
echo ""
echo "Or use Docker: docker-compose up -d"
echo ""
echo "Access the app at http://localhost:5173"
echo ""
echo "Test credentials (after seeding):"
echo "  Admin:  admin@seed.taskflow.dev  /  Admin@1234"
echo "  Member: member@seed.taskflow.dev  /  Member@1234"