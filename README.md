# TaskFlow Pro

A production-ready, real-time collaborative Kanban task management platform. Built with Node.js, React, MongoDB, and Socket.io.

## Features

### Core Functionality
- **Real-time Kanban boards** with drag-and-drop task management
- **User authentication** with JWT tokens and email verification
- **Team collaboration** with role-based permissions (Owner, Admin, Member, Viewer)
- **Task management** with priorities, due dates, assignees, labels, and checklists
- **File attachments** via Cloudinary integration
- **Comments and @mentions** with real-time notifications
- **Activity timeline** for audit logging
- **Advanced filtering** and global search
- **Board analytics** with charts and metrics

### Real-time Features
- Live task updates across all connected users
- Online member indicators
- Typing indicators in comments
- Instant notifications

### Advanced Features
- **Command palette** (Cmd+K) for quick actions
- **Keyboard shortcuts** for power users
- **Dark/Light/System themes** with seamless switching
- **Offline detection** with sync on reconnect
- **Bulk task operations** and task templates
- **Time tracking** with start/stop timers
- **Task dependencies** and recurring tasks
- **Board export** (CSV/PDF formats)

## Tech Stack

### Backend
- **Node.js** + Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **Redis** for pub/sub and caching
- **JWT** authentication with httpOnly cookies
- **Cloudinary** for file storage
- **Nodemailer** for email notifications
- **Winston** for structured logging

### Frontend
- **React 18** with Vite bundler
- **Zustand** for state management
- **React Query** for server state
- **@dnd-kit** for drag-and-drop
- **Tailwind CSS** with custom design system
- **Framer Motion** for animations
- **Recharts** for analytics visualizations
- **React Hook Form** with Zod validation

### DevOps
- **Docker** + docker-compose for containerization
- **Jest** + Supertest for backend testing
- **Vitest** + Testing Library for frontend testing
- **ESLint** + Prettier for code quality

## Architecture

```
taskflow-pro/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/        # Database, Redis, Cloudinary setup
│   │   ├── controllers/   # Route handlers
│   │   ├── middlewares/   # Auth, validation, error handling
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routers
│   │   ├── services/      # Business logic layer
│   │   ├── sockets/       # Socket.io event handlers
│   │   └── utils/         # Helpers and utilities
│   └── Dockerfile
├── client/                # React frontend
│   ├── src/
│   │   ├── api/          # Axios + React Query setup
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Route components
│   │   ├── store/        # Zustand stores
│   │   └── utils/        # Client utilities
│   └── Dockerfile
└── docker-compose.yml    # Multi-container setup
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5+
- Redis 6+
- Docker (optional)

### Local Development

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd taskflow-pro

# Backend
cd server
npm install
cp .env.example .env
# Edit .env with your configuration

# Frontend
cd ../client
npm install
cp .env.example .env
# Edit .env with your API URL
```

2. **Start services:**
```bash
# Start MongoDB and Redis (or use Docker)
docker run -d -p 27017:27017 mongo:7
docker run -d -p 6379:6379 redis:7-alpine

# Backend (terminal 1)
cd server
npm run dev

# Frontend (terminal 2)
cd client
npm run dev
```

3. **Seed sample data:**
```bash
cd server
npm run seed
```

### Docker Setup

```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit the .env files as needed

# Start all services
docker-compose up -d

# Seed data (optional)
docker-compose exec server npm run seed
```

Access the app at http://localhost (Docker) or http://localhost:5173 (local dev).

## Environment Variables

### Server (.env)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/taskflow
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_access_secret_change_me
JWT_REFRESH_SECRET=your_refresh_secret_change_me
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```

### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT tokens
- `GET /api/auth/me` - Get current user

### Boards
- `GET /api/boards` - List user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Tasks
- `GET /api/boards/:boardId/tasks` - List board tasks
- `POST /api/boards/:boardId/tasks` - Create task
- `PUT /api/boards/:boardId/tasks/:id` - Update task
- `DELETE /api/boards/:boardId/tasks/:id` - Delete task
- `POST /api/boards/:boardId/tasks/:id/move` - Move task

See individual route files for complete API specification.

## Socket Events

### Client → Server
- `join-board` - Join board room for real-time updates
- `leave-board` - Leave board room
- `typing:start` - Start typing in comment box
- `typing:stop` - Stop typing

### Server → Client
- `task:created` - New task created
- `task:updated` - Task modified
- `task:moved` - Task moved between columns
- `task:deleted` - Task removed
- `comment:added` - New comment posted
- `members:online` - Online members list update
- `notification:new` - New notification received

## Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Run with coverage
npm run test:coverage
```

## Performance Considerations

- **Pagination**: All list endpoints support pagination
- **Caching**: Board data cached in Redis (2-5 min TTL)
- **Virtual scrolling**: Large task lists (>50 items) use virtual rendering
- **Code splitting**: Lazy-loaded pages and heavy components
- **Debouncing**: Search (300ms) and autosave (800ms) debounced
- **Optimistic updates**: Immediate UI updates with server sync

## Security Features

- **JWT tokens** stored in httpOnly cookies with SameSite=Strict
- **Rate limiting** on auth (10 req/15min) and API routes (300 req/15min)
- **Input sanitization** with express-mongo-sanitize and xss-clean
- **CSRF protection** via SameSite cookies + custom headers
- **File upload validation** with MIME type and size checks
- **Role-based access control** at API and UI levels
- **Audit logging** for all destructive actions

## Deployment

### Production Checklist
- [x] All dependencies updated to secure versions (no high/critical CVEs)
- [x] Environment validation on startup
- [x] Strong JWT secrets required (32+ characters)
- [x] Enhanced security headers (Helmet.js with CSP)
- [x] Docker containers run as non-root users
- [x] Health checks configured for all services
- [x] Multi-stage Docker builds for smaller images
- [x] Automated MongoDB backups (daily retention: 7 days)
- [x] Resource limits on containers
- [x] Nginx reverse proxy configuration with SSL
- [x] Rate limiting with Redis backend
- [x] Comprehensive logging and monitoring

### Quick Production Deploy

```bash
# 1. Generate strong secrets
./scripts/generate-secrets.sh

# 2. Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit the .env files with generated secrets

# 3. Deploy with automated script
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### Docker Production
```bash
# Deploy with production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f server

# Check health
curl http://localhost:5000/health?detailed=true
```

### SSL Setup
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure nginx
sudo cp nginx.conf /etc/nginx/sites-available/taskflow-pro
sudo ln -s /etc/nginx/sites-available/taskflow-pro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment guide.
See [SECURITY.md](SECURITY.md) for security policy and best practices.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes with tests
4. Run linting: `npm run lint`
5. Commit changes: `git commit -m "Add new feature"`
6. Push branch: `git push origin feature/new-feature`
7. Open a Pull Request

### Code Style
- Use TypeScript-style JSDoc comments
- Follow the existing component patterns
- Add tests for new features
- Keep components small and focused
- Use semantic commit messages

## Troubleshooting

### Common Issues

**"Socket connection failed"**
- Check CORS configuration in server/src/index.js
- Verify VITE_SOCKET_URL matches server URL

**"Database connection error"**
- Ensure MongoDB is running on specified port
- Check MONGO_URI format and credentials

**"File upload fails"**
- Verify Cloudinary credentials in .env
- Check file size (<10MB) and allowed MIME types

**"Email not sending"**
- Verify SMTP credentials and app passwords
- Check firewall settings for SMTP port

### Debug Mode
Set `DEBUG=taskflow:*` environment variable to enable verbose logging.

## License

MIT License - see LICENSE file for details.

---

**TaskFlow Pro** - Built for teams who value productivity and collaboration.