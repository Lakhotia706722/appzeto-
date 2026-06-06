# Install MongoDB and Redis on Windows

## ⚠️ Important Note
Installing MongoDB and Redis requires **Administrator privileges**. Please follow these steps:

---

## Method 1: Using Chocolatey (Administrator Required)

### Step 1: Open PowerShell as Administrator
1. Press `Windows Key`
2. Type "PowerShell"
3. Right-click "Windows PowerShell"
4. Select "Run as Administrator"

### Step 2: Install MongoDB
```powershell
choco install mongodb -y
```

### Step 3: Install Redis
```powershell
choco install redis-64 -y
```

### Step 4: Start Services
```powershell
# Start MongoDB
net start MongoDB

# Start Redis
redis-server --service-start
```

---

## Method 2: Manual Installation (If Chocolatey Fails)

### Install MongoDB

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Version: 7.0 (Community Edition)
   - Platform: Windows x64
   - Package: MSI

2. **Install**
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Run service as Network Service user"
   - Click "Install"

3. **Verify Installation**
   ```powershell
   # Check if MongoDB is running
   Get-Service MongoDB
   
   # Or connect to MongoDB
   mongosh
   ```

### Install Redis

1. **Download Redis for Windows**
   - Visit: https://github.com/tporadowski/redis/releases
   - Download: `Redis-x64-X.X.XX.msi` (latest version)

2. **Install**
   - Run the downloaded `.msi` file
   - ✅ Check "Add Redis to PATH"
   - ✅ Check "Run Redis as a Service"
   - Click "Install"

3. **Verify Installation**
   ```powershell
   # Check if Redis is running
   Get-Service Redis
   
   # Or test Redis
   redis-cli ping
   # Should return: PONG
   ```

---

## Method 3: Use Existing Docker (Restart Docker Desktop)

If Docker Desktop is installed but not working:

1. **Restart Docker Desktop Properly**
   - Right-click Docker Desktop icon in system tray
   - Click "Quit Docker Desktop"
   - Wait 10 seconds
   - Open Docker Desktop from Start Menu
   - Wait until status shows "Docker Desktop is running"

2. **Start Databases**
   ```powershell
   cd C:\Users\Asus\appzeto\taskflow-pro
   docker-compose up mongo redis -d
   ```

3. **Verify**
   ```powershell
   docker ps
   # Should show mongo and redis containers running
   ```

---

## After Installation - Start the Project

Once MongoDB and Redis are running:

### Terminal 1: Start Backend
```powershell
cd C:\Users\Asus\appzeto\taskflow-pro\server
npm run dev
```

You should see:
```
✅ Environment validation passed
MongoDB connected: localhost
✅ Rate limiter Redis stores attached
Server running on port 5000 [development]
```

### Terminal 2: Frontend (Already Running)
The frontend is already running at: http://localhost:5173

---

## Verification Steps

### 1. Check MongoDB
```powershell
# Method 1: Check service
Get-Service MongoDB

# Method 2: Connect with mongosh
mongosh
# You should see MongoDB shell prompt

# Method 3: Check port
Test-NetConnection localhost -Port 27017
```

### 2. Check Redis
```powershell
# Method 1: Check service
Get-Service Redis

# Method 2: Test connection
redis-cli ping
# Should return: PONG

# Method 3: Check port
Test-NetConnection localhost -Port 6379
```

### 3. Check Backend
```powershell
# Test health endpoint
curl http://localhost:5000/health?detailed=true
```

Expected response:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "redis": "connected",
  "uptime": 123.45
}
```

---

## Troubleshooting

### MongoDB Won't Start
```powershell
# Check if service exists
Get-Service MongoDB

# Try manual start
net start MongoDB

# Check logs
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 20
```

### Redis Won't Start
```powershell
# Check if service exists
Get-Service Redis

# Try manual start
redis-server --service-start

# Test connection
redis-cli ping
```

### Port Already in Use
```powershell
# Check what's using MongoDB port (27017)
netstat -ano | findstr :27017

# Check what's using Redis port (6379)
netstat -ano | findstr :6379

# Kill process if needed (replace PID)
taskkill /PID <PID> /F
```

---

## Quick Start Commands (After Installation)

```powershell
# Verify services are running
Get-Service MongoDB, Redis

# Start backend (if not already running)
cd C:\Users\Asus\appzeto\taskflow-pro\server
npm run dev

# Frontend is already running at:
# http://localhost:5173

# Open browser and start using TaskFlow Pro!
```

---

## Alternative: Use Cloud Services (No Installation Needed)

If local installation is problematic, use free cloud services:

### MongoDB Atlas (Free Tier)
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create free cluster (512MB storage)
3. Get connection string
4. Update `server/.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow
   ```

### Redis Cloud (Free Tier)
1. Sign up: https://redis.com/try-free/
2. Create free database (30MB storage)
3. Get connection string
4. Update `server/.env`:
   ```
   REDIS_URL=redis://default:password@host:port
   ```

Then just start the backend - no local services needed!

---

**Current Status:**
- ✅ Frontend running at http://localhost:5173
- ⏳ Waiting for MongoDB and Redis
- ⏳ Backend will start once databases are ready

**Next Step:** Follow one of the installation methods above, then the backend will connect automatically!
