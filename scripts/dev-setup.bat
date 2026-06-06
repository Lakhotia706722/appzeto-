@echo off
REM Development setup script for TaskFlow Pro (Windows)

echo 🚀 Setting up TaskFlow Pro development environment...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

REM Check if Docker is available (optional)
where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Docker detected
    set USE_DOCKER=true
) else (
    echo ⚠️  Docker not found. Will use local MongoDB/Redis setup.
    set USE_DOCKER=false
)

REM Install dependencies
echo 📦 Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo 📦 Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

REM Copy environment files
echo 🔧 Setting up environment files...
if not exist "server\.env" (
    copy "server\.env.example" "server\.env"
    echo ✅ Created server/.env - please edit with your configuration
)

if not exist "client\.env" (
    copy "client\.env.example" "client\.env"
    echo ✅ Created client/.env
)

REM Start services with Docker if available
if "%USE_DOCKER%"=="true" (
    echo 🐳 Starting MongoDB and Redis with Docker...
    docker run -d --name taskflow-mongo -p 27017:27017 mongo:7 2>nul || echo MongoDB container already running
    docker run -d --name taskflow-redis -p 6379:6379 redis:7-alpine 2>nul || echo Redis container already running
    timeout /t 3 /nobreak >nul
)

echo 🌱 Seeding sample data...
cd server
call npm run seed 2>nul || echo Seeding skipped (database not ready)
cd ..

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Edit server\.env with your configuration (SMTP, Cloudinary, etc.)
echo 2. Start the development servers:
echo    Terminal 1: cd server ^&^& npm run dev
echo    Terminal 2: cd client ^&^& npm run dev
echo.
echo Or use Docker: docker-compose up -d
echo.
echo Access the app at http://localhost:5173
echo.
echo Test credentials (after seeding):
echo   Admin:  admin@seed.taskflow.dev  /  Admin@1234
echo   Member: member@seed.taskflow.dev  /  Member@1234