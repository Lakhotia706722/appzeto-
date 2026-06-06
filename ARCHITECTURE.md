# TaskFlow Pro - System Architecture & Connectivity

## System Overview

TaskFlow Pro follows a **modern full-stack architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT (Port 80)                    │
│  React 18 + Vite | Zustand | React Query | Socket.IO Client│
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/HTTPS + WebSocket
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    SERVER (Port 5000)                       │
│  Node.js + Express | Socket.IO Server | JWT Auth           │
└───┬──────────────┬──────────────┬───────────────────────────┘
    │              │              │
    │ Mongoose     │ IORedis      │ Cloudinary SDK
    │              │              │
┌───▼──────┐  ┌───▼──────┐  ┌───▼───────────┐
│ MongoDB  │  │  Redis   │  │  Cloudinary   │
│ (27017)  │  │  (6379)  │  │  (External)   │
└──────────┘  └──────────┘  └───────────────┘
```

---

## Component Connectivity

### ✅ 1. Frontend → Backend (REST API)

**Connection File**: `client/src/api/axios.js`

```javascript
// API Base URL Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Sends httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});
```

**Features**:
- ✅ Automatic JWT token refresh on 401
- ✅ HttpOnly cookie authentication
- ✅ CSRF protection via custom headers
- ✅ Request/response interceptors

**Example Usage**:
```javascript
// In hooks/useBoards.js
import api from '../api/axios';

export const useBoard = (boardId) => {
  return useQuery({
    queryKey: queryKeys.boards.detail(boardId),
    queryFn: async () => {
      const res = await api.get(`/boards/${boardId}`);
      return res.data.data.board;
    },
  });
};
```

**Environment Variables**:
- Development: `VITE_API_URL=http://localhost:5000/api`
- Production: `VITE_API_URL=https://yourdomain.com/api`

---

### ✅ 2. Frontend → Backend (WebSocket/Socket.IO)

**Connection File**: `client/src/store/useSocketStore.js`

```javascript
// Socket.IO URL Configuration
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Socket.IO connection with JWT auth
const socket = io(SOCKET_URL, {
  auth: { token },           // JWT token from cookie
  transports: ['websocket'], // WebSocket only
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

**Features**:
- ✅ Real-time task updates
- ✅ Live presence indicators (online members)
- ✅ Typing indicators
- ✅ JWT authentication
- ✅ Automatic reconnection
- ✅ Room-based events (board-specific)

**Events Flow**:
```
Client → Server:
- join-board
- leave-board
- typing:start
- typing:stop

Server → Client:
- connect
- disconnect
- members:online
- task:created
- task:updated
- task:moved
- task:deleted
- comment:added
```

**Environment Variables**:
- Development: `VITE_SOCKET_URL=http://localhost:5000`
- Production: `VITE_SOCKET_URL=https://yourdomain.com`

---

### ✅ 3. Backend → MongoDB

**Connection File**: `server/src/config/db.js`

```javascript
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1); // Fail fast if DB unavailable
  }
};
```

**Features**:
- ✅ Mongoose ODM for schema validation
- ✅ Connection pooling
- ✅ Automatic reconnection
- ✅ Error handling with graceful exit

**Connection Strings**:
- Local: `mongodb://localhost:27017/taskflow`
- Docker: `mongodb://mongo:27017/taskflow`
- Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/taskflow`

**Models**:
- User (authentication, profiles)
- Board (kanban boards, columns, members)
- Task (tasks, comments, attachments)
- Notification (real-time notifications)

---

### ✅ 4. Backend → Redis

**Connection File**: `server/src/config/redis.js`

```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});
```

**Features**:
- ✅ Rate limiting storage
- ✅ Session management
- ✅ Cache storage (board data, user data)
- ✅ Socket.IO pub/sub for scaling
- ✅ Automatic reconnection

**Usage**:
- Rate limiting (Auth: 10/15min, API: 300/15min)
- Caching board data (2-5 min TTL)
- Socket.IO adapter for multi-server scaling
- Session storage

**Connection Strings**:
- Local: `redis://localhost:6379`
- Docker: `redis://redis:6379`
- Cloud: `redis://username:password@host:port`

---

### ✅ 5. Backend → Cloudinary

**Connection File**: `server/src/config/cloudinary.js`

```javascript
const cloudinary = require('cloudinary').v2;

const connectCloudinary = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return;
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};
```

**Features**:
- ✅ File upload handling
- ✅ Image optimization
- ✅ CDN delivery
- ✅ Automatic cleanup on deletion

**Usage**:
- Task attachments
- User avatars
- Board cover images

---

## Docker Networking

### Development (`docker-compose.yml`)

```yaml
services:
  server:
    environment:
      - MONGO_URI=mongodb://mongo:27017/taskflow
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  client:
    depends_on:
      - server

  mongo:
    ports:
      - "27017:27017"  # Exposed for local development

  redis:
    ports:
      - "6379:6379"    # Exposed for local development
```

**Internal DNS Resolution**:
- `server` → accessible at `http://server:5000`
- `mongo` → accessible at `mongodb://mongo:27017`
- `redis` → accessible at `redis://redis:6379`
- `client` → accessible at `http://client:80`

---

### Production (`docker-compose.prod.yml`)

```yaml
networks:
  taskflow-network:
    driver: bridge

services:
  server:
    networks:
      - taskflow-network
    # NO external ports exposed

  mongo:
    networks:
      - taskflow-network
    # NO external ports (internal only)

  redis:
    networks:
      - taskflow-network
    # NO external ports (internal only)

  client:
    networks:
      - taskflow-network
    ports:
      - "80:80"       # External access
      - "443:443"     # HTTPS
```

**Security**:
- ✅ Isolated bridge network
- ✅ Only client port exposed
- ✅ MongoDB/Redis internal only
- ✅ Service-to-service communication

---

## Request Flow Examples

### Example 1: User Logs In

```
1. User enters credentials in LoginPage
   ↓
2. Client calls: api.post('/auth/login', { email, password })
   ↓
3. Server validates credentials → generates JWT tokens
   ↓
4. Server sets httpOnly cookies with tokens
   ↓
5. Server responds with user data
   ↓
6. Client stores user in Zustand (useAuthStore)
   ↓
7. Client redirects to dashboard
```

### Example 2: User Views Board

```
1. User navigates to /boards/:boardId
   ↓
2. Client calls: api.get('/boards/:boardId')
   JWT cookie automatically sent
   ↓
3. Server validates JWT → checks permissions
   ↓
4. Server queries MongoDB for board data
   ↓
5. Server checks Redis cache for board
   ↓
6. Server responds with board data
   ↓
7. Client displays board in KanbanBoard component
   ↓
8. Client connects Socket.IO → emits 'join-board'
   ↓
9. Server adds user to board room
   ↓
10. Server broadcasts online members list
```

### Example 3: User Moves Task (Real-time)

```
1. User drags task to new column
   ↓
2. Client optimistically updates UI (React Query)
   ↓
3. Client calls: api.post('/boards/:boardId/tasks/:taskId/move')
   ↓
4. Server validates → updates MongoDB
   ↓
5. Server emits Socket.IO: 'task:moved' to board room
   ↓
6. All connected clients receive event
   ↓
7. Other clients update their UI in real-time
   ↓
8. Original client confirms success
```

---

## Environment Configuration

### Complete Connectivity Setup

#### Server `.env`
```bash
# Server
PORT=5000
NODE_ENV=production

# Database Connections
MONGO_URI=mongodb://mongo:27017/taskflow
REDIS_URL=redis://redis:6379

# JWT Secrets
JWT_ACCESS_SECRET=<32+ character secret>
JWT_REFRESH_SECRET=<32+ character secret>

# External Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Client URL (for CORS)
CLIENT_URL=https://yourdomain.com
```

#### Client `.env`
```bash
# Backend API
VITE_API_URL=https://yourdomain.com/api

# WebSocket Server
VITE_SOCKET_URL=https://yourdomain.com

# Cloudinary (public)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

---

## Connectivity Verification

### Test Backend Connections

```bash
# 1. Test MongoDB
curl http://localhost:5000/health?detailed=true
# Should show: "mongodb": "connected"

# 2. Test Redis
curl http://localhost:5000/health?detailed=true
# Should show: "redis": "connected"

# 3. Test API endpoint
curl http://localhost:5000/api/auth/me
# Should return 401 (auth required) - API is working

# 4. Test Socket.IO
curl http://localhost:5000/socket.io/
# Should return Socket.IO handshake
```

### Test Frontend Connections

```bash
# 1. Build client
cd client && npm run build

# 2. Check API URL in build
grep -r "VITE_API_URL" dist/

# 3. Test client locally
npm run preview
# Visit http://localhost:4173

# 4. Open browser console
# - Check Network tab for API calls
# - Check WS tab for Socket.IO connection
```

### Test Full Stack with Docker

```bash
# 1. Start all services
docker-compose up -d

# 2. Check all containers running
docker-compose ps

# 3. Test connections
curl http://localhost:5000/health?detailed=true
curl http://localhost:80

# 4. Check logs
docker-compose logs server
docker-compose logs client

# 5. Test Socket.IO
# Open browser to http://localhost
# Open DevTools → Network → WS
# Should see Socket.IO connection
```

---

## Troubleshooting Connectivity

### Common Issues

#### 1. Frontend can't reach backend
```bash
# Check VITE_API_URL is correct
echo $VITE_API_URL

# Check CORS settings in server
# Should include your client URL
CLIENT_URL=http://localhost:5173

# Check server is running
curl http://localhost:5000/health
```

#### 2. Socket.IO not connecting
```bash
# Check VITE_SOCKET_URL
echo $VITE_SOCKET_URL

# Check Socket.IO endpoint
curl http://localhost:5000/socket.io/

# Check browser console for errors
# Common: CORS, authentication, firewall
```

#### 3. MongoDB connection failed
```bash
# Check MongoDB is running
docker ps | grep mongo
# OR
mongosh mongodb://localhost:27017

# Check MONGO_URI format
# Local: mongodb://localhost:27017/taskflow
# Docker: mongodb://mongo:27017/taskflow
```

#### 4. Redis connection failed
```bash
# Check Redis is running
docker ps | grep redis
# OR
redis-cli ping

# Check REDIS_URL format
# Local: redis://localhost:6379
# Docker: redis://redis:6379
```

---

## Summary: All Connections ✅

| Connection | Status | Files | Ports |
|------------|--------|-------|-------|
| **Frontend → Backend API** | ✅ Connected | `client/src/api/axios.js` | 5000 |
| **Frontend → Socket.IO** | ✅ Connected | `client/src/store/useSocketStore.js` | 5000 |
| **Backend → MongoDB** | ✅ Connected | `server/src/config/db.js` | 27017 |
| **Backend → Redis** | ✅ Connected | `server/src/config/redis.js` | 6379 |
| **Backend → Cloudinary** | ✅ Connected | `server/src/config/cloudinary.js` | HTTPS |
| **Backend → SMTP** | ✅ Connected | `server/src/config/mailer.js` | 587 |

---

**Last Updated**: June 6, 2026  
**Version**: 1.0.0  
**Status**: All Systems Connected ✅
