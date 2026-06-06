# 🚀 Quick Start Guide - TaskFlow Pro

## Current Status

✅ Project is **production-ready**  
✅ All tests passing (20/20)  
✅ Environment files created  
⚠️ Requires MongoDB and Redis to run

---

## 🎯 Choose Your Setup Method

### Option 1: Docker Compose (Recommended - Easiest)

**Prerequisites**: Docker Desktop must be running

```bash
# 1. Start Docker Desktop
# - Open Docker Desktop from Start Menu
# - Wait for "Docker Desktop is running" message

# 2. Start all services (MongoDB, Redis, Server, Client)
cd C:\Users\Asus\appzeto\taskflow-pro
docker-compose up

# That's it! 
# - Backend: http://localhost:5000
# - Frontend: http://localhost:80
# - Health Check: http://localhost:5000/health
```

**To stop**:
```bash
docker-compose down
```

---

### Option 2: Separate Databases with Docker

**Prerequisites**: Docker Desktop running

```bash
# 1. Start only databases
cd C:\Users\Asus\appzeto\taskflow-pro
docker-compose up mongo redis

# 2. In new terminal - Start backend
cd server
npm run dev

# 3. In another terminal - Start frontend
cd client
npm run dev

# Access:
# - Backend: http://localhost:5000
# - Frontend: http://localhost:5173
```

---

### Option 3: Local Installation (No Docker)

**Prerequisites**: MongoDB and Redis installed locally

#### Install MongoDB (Windows)

```bash
# Download MongoDB Community Server
# https://www.mongodb.com/try/download/community

# Or use Chocolatey
choco install mongodb

# Start MongoDB
net start MongoDB
```

#### Install Redis (Windows)

```bash
# Download Redis for Windows
# https://github.com/tporadowski/redis/releases

# Or use Chocolatey
choco install redis-64

# Start Redis
redis-server
```

#### Start Application

```bash
# Terminal 1 - Backend
cd C:\Users\Asus\appzeto\taskflow-pro\server
npm run dev

# Terminal 2 - Frontend
cd C:\Users\Asus\appzeto\taskflow-pro\client
npm run dev

# Access:
# - Backend: http://localhost:5000
# - Frontend: http://localhost:5173
```

---

### Option 4: Cloud Databases (No Local Install)

Use cloud-hosted databases:

1. **MongoDB Atlas** (Free tier available)
   - Sign up: https://www.mongodb.com/cloud/atlas
   - Get connection string
   - Update `server/.env`: `MONGO_URI=mongodb+srv://...`

2. **Redis Cloud** (Free tier available)
   - Sign up: https://redis.com/try-free/
   - Get connection string
   - Update `server/.env`: `REDIS_URL=redis://...`

3. **Start servers**:
   ```bash
   # Backend
   cd server
   npm run dev

   # Frontend
   cd client
   npm run dev
   ```

---

## ✅ Verification Steps

Once services are running:

### 1. Check Backend Health
```bash
curl http://localhost:5000/health?detailed=true
```

Expected response:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "redis": "connected",
  "uptime": 123.45,
  "memory": {...}
}
```

### 2. Check Frontend
Open browser: http://localhost:5173 (or http://localhost:80 with Docker)

You should see the TaskFlow Pro login page.

### 3. Test Registration
1. Click "Register"
2. Create an account
3. Login with credentials
4. Start creating boards and tasks!

---

## 📁 Default Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Dev) | 5173 | http://localhost:5173 |
| Frontend (Docker) | 80 | http://localhost:80 |
| Backend | 5000 | http://localhost:5000 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Redis | 6379 | redis://localhost:6379 |

---

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"

**Solution 1**: Start MongoDB
```bash
docker-compose up mongo
```

**Solution 2**: Check MongoDB is running
```bash
# Check service
docker ps | grep mongo

# Or for local install
net start MongoDB
```

### "Cannot connect to Redis"

**Solution**: Start Redis
```bash
docker-compose up redis
```

### "Port already in use"

**Solution**: Find and stop process using the port
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### "Docker daemon not running"

**Solution**: Start Docker Desktop
1. Open Docker Desktop from Start Menu
2. Wait for it to fully start (system tray icon turns green)
3. Try again

---

## 🎬 Recommended: Quick Start with Docker

The **easiest way** to run the project:

```bash
# 1. Make sure Docker Desktop is running

# 2. One command to start everything
cd C:\Users\Asus\appzeto\taskflow-pro
docker-compose up

# 3. Open browser
http://localhost:80

# Done! 🎉
```

---

## 📝 Current Environment

Your `.env` files have been created with development defaults:

### Server (.env)
- ✅ MongoDB: `mongodb://localhost:27017/taskflow`
- ✅ Redis: `redis://localhost:6379`
- ✅ JWT secrets: Development keys (change for production!)
- ✅ Client URL: `http://localhost:5173`

### Client (.env)
- ✅ API URL: `http://localhost:5000/api`
- ✅ Socket URL: `http://localhost:5000`

---

## 🚀 Next Steps

1. **Start Docker Desktop** (if using Docker)
2. **Run**: `docker-compose up`
3. **Open**: http://localhost:80
4. **Create** your first board!

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Need Help?**
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Security: [SECURITY.md](SECURITY.md)
- Production: [DEPLOYMENT.md](DEPLOYMENT.md)
