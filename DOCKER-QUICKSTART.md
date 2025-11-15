# Docker Quick Start Guide

This is a quick reference for deploying and managing the Finance Tracker application with Docker.

## 🚀 Quick Deploy on EC2

### 1. Run the automated deployment script:
```bash
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

This script will:
- Check prerequisites
- Create and configure .env file
- Build Docker images
- Start all services
- Verify deployment

### 2. Access your application:
- Frontend: `http://YOUR_EC2_IP`
- Backend: `http://YOUR_EC2_IP:5001`

---

## 📋 Manual Deployment Steps

### Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Deploy
```bash
# 1. Clone repository
git clone <your-repo-url>
cd Finance-Tracker-Personal

# 2. Configure environment
cp env.example .env
nano .env  # Update with your values

# 3. Build and start
docker-compose build
docker-compose up -d

# 4. Check status
docker-compose ps
docker-compose logs -f
```

---

## 🛠️ Common Commands

### Using Makefile (Recommended)
```bash
make help          # Show all available commands
make build         # Build images
make up            # Start services
make down          # Stop services
make restart       # Restart services
make logs          # View logs
make status        # Check status
make backup        # Create database backup
make monitor       # Show resource usage
```

### Using Docker Compose
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Execute commands
docker-compose exec backend /bin/sh
docker-compose exec db psql -U financeuser
```

---

## 🔧 Configuration

### Required Environment Variables (.env)
```bash
# Database
POSTGRES_DB=finance_tracker
POSTGRES_USER=financeuser
POSTGRES_PASSWORD=your_secure_password

# Backend
SECRET_KEY=your_secret_key
CORS_ORIGINS=http://YOUR_EC2_IP

# Frontend
REACT_APP_API_URL=http://YOUR_EC2_IP:5001
```

### Generate Secure Keys
```bash
# SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"

# POSTGRES_PASSWORD
openssl rand -base64 32
```

---

## 🔍 Health Checks

```bash
# Backend
curl http://localhost:5001/api/health

# Frontend
curl http://localhost/health

# Database
docker-compose exec db pg_isready -U financeuser

# All services
make health
```

---

## 💾 Backup & Restore

### Create Backup
```bash
# Automated (daily at 2 AM)
# Backups stored in ./backups/

# Manual backup
make backup
# or
docker-compose exec db pg_dump -U financeuser finance_tracker > backups/backup_$(date +%Y%m%d).sql
```

### Restore Backup
```bash
make restore
# or
cat backups/backup_YYYYMMDD.sql | docker-compose exec -T db psql -U financeuser -d finance_tracker
```

---

## 🐛 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Check ports
sudo netstat -tulpn | grep -E ':(80|5001|5432)'

# Restart
docker-compose restart
```

### Database connection issues
```bash
# Wait for database to be ready
docker-compose logs db

# Check health
docker-compose exec db pg_isready -U financeuser

# Restart backend
docker-compose restart backend
```

### Frontend can't connect to backend
```bash
# Check CORS settings
grep CORS_ORIGINS .env

# Check API URL
grep REACT_APP_API_URL .env

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Out of disk space
```bash
# Check usage
df -h
docker system df

# Clean up
docker system prune -a
find ./backups -mtime +7 -delete
```

---

## 🔒 Security Checklist

- [ ] Changed default passwords
- [ ] Generated secure SECRET_KEY
- [ ] Updated CORS_ORIGINS with actual domain/IP
- [ ] Configured EC2 Security Groups (ports 22, 80, 5001, 443)
- [ ] Enabled automated backups
- [ ] Set up HTTPS/SSL (recommended)
- [ ] Limited SSH access to your IP
- [ ] Regular system updates

---

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Resource Usage
```bash
# Real-time stats
docker stats

# Container processes
docker-compose top
```

### Disk Usage
```bash
# Docker disk usage
docker system df

# Volume sizes
docker volume ls
```

---

## 🔄 Updates

```bash
# Update application
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d

# Or use Makefile
make update
```

---

## 🆘 Emergency Commands

```bash
# Stop everything immediately
docker-compose stop

# Remove containers (data persists)
docker-compose down

# Full reset (⚠️ DELETES ALL DATA)
docker-compose down -v

# Restart from scratch
docker-compose down -v
docker-compose up -d
```

---

## 📞 Support

- Full documentation: See `DEPLOYMENT.md`
- Check logs: `docker-compose logs -f`
- Check status: `make status`

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  Port 80
│   (React +      │  nginx:alpine
│    Nginx)       │
└────────┬────────┘
         │
         │ HTTP
         ▼
┌─────────────────┐
│   Backend       │  Port 5001
│   (Flask +      │  python:3.11
│    Gunicorn)    │
└────────┬────────┘
         │
         │ PostgreSQL
         ▼
┌─────────────────┐
│   Database      │  Port 5432
│   (PostgreSQL)  │  postgres:15
│                 │
│   Volume:       │
│   postgres_data │ ← Persistent Storage
└─────────────────┘
```

---

**Happy Deploying! 🚀**

