# TaskFlow Pro - Production Deployment Guide

This guide covers deploying TaskFlow Pro to a production environment with security best practices.

## Prerequisites

- Ubuntu 22.04 LTS server (or similar Linux distribution)
- Docker & Docker Compose installed
- Domain name with DNS configured
- At least 2GB RAM, 20GB storage
- SSL certificates (Let's Encrypt recommended)

## Pre-Deployment Checklist

### 1. Security Dependencies Update

Update all dependencies to secure versions:

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Generate Strong Secrets

Generate cryptographically secure secrets:

```bash
# Generate JWT secrets (32+ characters)
openssl rand -hex 32  # For JWT_ACCESS_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET

# Generate MongoDB root password
openssl rand -base64 24

# Generate Redis password
openssl rand -base64 24
```

### 3. Configure Environment Variables

#### Server (.env)
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb://admin:YOUR_MONGO_PASSWORD@mongo:27017/taskflow?authSource=admin
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@redis:6379

# JWT (CRITICAL: Use strong, unique values)
JWT_ACCESS_SECRET=<generated-secret-from-openssl>
JWT_REFRESH_SECRET=<generated-secret-from-openssl>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP (for emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Client
CLIENT_URL=https://yourdomain.com
```

#### Client (.env)
```env
VITE_API_URL=https://yourdomain.com/api
VITE_SOCKET_URL=https://yourdomain.com
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

#### Docker Environment (.env in root)
```env
# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=<generated-mongo-password>

# Redis
REDIS_PASSWORD=<generated-redis-password>
```

## Deployment Methods

### Method 1: Docker Compose (Recommended)

#### Step 1: Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd taskflow-pro

# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit with production values
nano server/.env
nano client/.env
```

#### Step 2: Build and Deploy

```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f server
```

#### Step 3: Initialize MongoDB

```bash
# Access MongoDB container
docker-compose exec mongo mongosh -u admin -p YOUR_MONGO_PASSWORD --authenticationDatabase admin

# Create application user
use taskflow
db.createUser({
  user: "taskflow_user",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "taskflow" }]
})
```

#### Step 4: Setup SSL with Let's Encrypt

```bash
# Install certbot
sudo apt update
sudo apt install certbot

# Stop nginx temporarily
docker-compose stop client

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Update nginx.conf with certificate paths
# Then restart
docker-compose start client
```

#### Step 5: Setup Automated Backups

Backups are automatic via the `mongo-backup` service (daily at midnight).
Backups are stored in `./backups` and retained for 7 days.

To manually backup:

```bash
# Backup MongoDB
docker-compose exec mongo mongodump \
  --username admin \
  --password YOUR_MONGO_PASSWORD \
  --authenticationDatabase admin \
  --out /backups/manual-backup-$(date +%Y%m%d)

# Backup is saved to ./backups directory
```

To restore:

```bash
docker-compose exec mongo mongorestore \
  --username admin \
  --password YOUR_MONGO_PASSWORD \
  --authenticationDatabase admin \
  /backups/backup-folder-name
```

### Method 2: Manual Installation (Without Docker)

#### Prerequisites

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB 7
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Deploy Server

```bash
cd server
npm ci --omit=dev
pm2 start src/index.js --name taskflow-server
pm2 save
pm2 startup  # Follow instructions to enable startup on boot
```

#### Deploy Client

```bash
cd client
npm ci
npm run build

# Copy build to nginx
sudo cp -r dist/* /var/www/taskflow-pro/
```

#### Configure Nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/taskflow-pro
sudo ln -s /etc/nginx/sites-available/taskflow-pro /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Post-Deployment

### 1. Verify Services

```bash
# Check all services are running
docker-compose ps

# Test API endpoint
curl https://yourdomain.com/health

# Test Socket.IO
curl https://yourdomain.com/socket.io/

# Check logs for errors
docker-compose logs --tail=100 server
```

### 2. Security Hardening

```bash
# Enable firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable unused services
sudo systemctl disable bluetooth
sudo systemctl disable cups

# Setup fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 3. Monitoring Setup

#### Basic Monitoring with Docker Stats

```bash
# Monitor resource usage
docker stats

# Setup log rotation
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --cleanup \
  --interval 86400
```

#### Application Monitoring (Recommended)

Integrate with external monitoring services:

- **Sentry** - Error tracking
- **DataDog** - Application performance
- **UptimeRobot** - Uptime monitoring
- **CloudWatch** - AWS monitoring (if on AWS)

### 4. Regular Maintenance

#### Daily
- Monitor logs for errors
- Check disk space: `df -h`
- Verify backups are created

#### Weekly
- Review security logs
- Check for dependency updates: `npm audit`
- Monitor resource usage trends

#### Monthly
- Security audit: `npm audit fix`
- Update system packages: `sudo apt update && sudo apt upgrade`
- Test backup restoration
- Review and rotate logs

## Scaling Considerations

### Horizontal Scaling

For high traffic, consider:

1. **Load Balancer**: Use nginx or HAProxy
2. **Multiple Server Instances**: Scale the backend
3. **Separate Redis**: Use managed Redis (AWS ElastiCache, Redis Cloud)
4. **Separate MongoDB**: Use MongoDB Atlas or self-hosted replica set

### Vertical Scaling

Adjust Docker resource limits in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs server

# Common issues:
# 1. Wrong environment variables
# 2. MongoDB connection failed
# 3. Redis connection failed
# 4. Port conflicts
```

### Database Connection Errors

```bash
# Test MongoDB connection
docker-compose exec mongo mongosh -u admin -p YOUR_PASSWORD --authenticationDatabase admin

# Test Redis connection
docker-compose exec redis redis-cli -a YOUR_PASSWORD ping
```

### SSL Certificate Issues

```bash
# Test certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Restart specific service
docker-compose restart server

# Clear Redis cache
docker-compose exec redis redis-cli -a YOUR_PASSWORD FLUSHDB
```

## Rollback Procedure

If deployment fails:

```bash
# Stop new version
docker-compose down

# Restore from backup
docker-compose exec mongo mongorestore \
  --username admin \
  --password YOUR_PASSWORD \
  --authenticationDatabase admin \
  /backups/latest-backup

# Start previous version
git checkout <previous-commit>
docker-compose up -d
```

## Security Contacts

- Report security vulnerabilities to: security@yourdomain.com
- Use GitHub Security Advisories for responsible disclosure

## Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**Last Updated**: June 6, 2026  
**Version**: 1.0.0
