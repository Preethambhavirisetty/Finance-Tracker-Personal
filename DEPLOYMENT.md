# Finance Tracker - Docker Deployment Guide for EC2

This guide walks you through deploying the Finance Tracker application on an AWS EC2 instance using Docker and Docker Compose for production use with persistent storage.

## Table of Contents
- [Prerequisites](#prerequisites)
- [EC2 Instance Setup](#ec2-instance-setup)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Prerequisites

### AWS Account & EC2 Instance
- AWS account with EC2 access
- Recommended EC2 instance: **t3.small** or larger (2 vCPU, 2GB RAM minimum)
- Amazon Linux 2023, Ubuntu 22.04, or similar Linux distribution
- At least 20GB of storage (EBS volume)

### Security Group Configuration
Configure your EC2 security group to allow the following inbound traffic:
- **Port 22**: SSH (your IP only)
- **Port 80**: HTTP (0.0.0.0/0)
- **Port 443**: HTTPS (0.0.0.0/0) - if using SSL
- **Port 5001**: Backend API (0.0.0.0/0) - or restrict as needed

---

## EC2 Instance Setup

### Step 1: Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
# Or for Ubuntu:
# ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 2: Update System Packages

**For Amazon Linux 2023:**
```bash
sudo yum update -y
```

**For Ubuntu:**
```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Docker

**For Amazon Linux 2023:**
```bash
# Install Docker
sudo yum install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -a -G docker ec2-user

# Log out and log back in for group changes to take effect
exit
# Then reconnect via SSH
```

**For Ubuntu:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker ubuntu

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Log out and log back in
exit
# Then reconnect via SSH
```

### Step 4: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Step 5: Install Git

**For Amazon Linux 2023:**
```bash
sudo yum install -y git
```

**For Ubuntu:**
```bash
sudo apt install -y git
```

---

## Installation

### Step 1: Clone the Repository

```bash
cd ~
git clone https://github.com/your-username/Finance-Tracker-Personal.git
cd Finance-Tracker-Personal
```

**Or upload your code:**
```bash
# From your local machine
scp -i your-key.pem -r Finance-Tracker-Personal/ ec2-user@your-ec2-public-ip:~/
```

### Step 2: Create Backup Directory

```bash
mkdir -p backups
chmod 755 backups
```

---

## Configuration

### Step 1: Create Environment File

```bash
# Copy the example environment file
cp env.example .env

# Edit the environment file
nano .env
```

### Step 2: Configure Environment Variables

Update the `.env` file with your configuration:

```bash
# =================================
# Database Configuration
# =================================
POSTGRES_DB=finance_tracker
POSTGRES_USER=financeuser
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# =================================
# Backend Configuration
# =================================
SECRET_KEY=YOUR_GENERATED_SECRET_KEY_HERE
FLASK_ENV=production

# CORS Origins (add your EC2 public IP or domain)
CORS_ORIGINS=http://YOUR_EC2_PUBLIC_IP,http://YOUR_DOMAIN_COM

# =================================
# Frontend Configuration
# =================================
# Backend API URL
REACT_APP_API_URL=http://YOUR_EC2_PUBLIC_IP:5001

# =================================
# Backup Configuration
# =================================
BACKUP_KEEP_DAYS=7
```

### Step 3: Generate Secure Keys

**Generate SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Generate strong POSTGRES_PASSWORD:**
```bash
openssl rand -base64 32
```

### Step 4: Update API URL in Frontend Build

If you need to rebuild the frontend with a specific API URL:

```bash
# Edit docker-compose.yml to add build args for frontend service
nano docker-compose.yml
```

Add under the `frontend` service:
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    args:
      REACT_APP_API_URL: http://YOUR_EC2_PUBLIC_IP:5001
```

---

## Deployment

### Step 1: Build and Start Services

```bash
# Build all images (first time or after code changes)
docker-compose build

# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 2: Verify Services are Running

```bash
# Check all containers are up
docker-compose ps

# Expected output:
# NAME                        STATUS        PORTS
# finance-tracker-backend     Up (healthy)  0.0.0.0:5001->5001/tcp
# finance-tracker-frontend    Up (healthy)  0.0.0.0:80->80/tcp
# finance-tracker-db          Up (healthy)  0.0.0.0:5432->5432/tcp
# finance-tracker-backup      Up
```

### Step 3: Check Service Health

```bash
# Check backend health
curl http://localhost:5001/api/health

# Check frontend health
curl http://localhost/health

# Check database
docker-compose exec db pg_isready -U financeuser
```

### Step 4: Access Your Application

Open your browser and navigate to:
- **Frontend**: `http://YOUR_EC2_PUBLIC_IP`
- **Backend API**: `http://YOUR_EC2_PUBLIC_IP:5001`
- **Health Check**: `http://YOUR_EC2_PUBLIC_IP:5001/api/health`

---

## Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop Services

```bash
# Stop all services (data persists)
docker-compose stop

# Stop and remove containers (data persists in volumes)
docker-compose down

# Stop and remove everything INCLUDING VOLUMES (⚠️ DELETES DATA)
docker-compose down -v
```

### Update Application

```bash
# Pull latest code
cd ~/Finance-Tracker-Personal
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Database Backups

Backups are automatically created daily and stored in the `./backups` directory.

**Manual Backup:**
```bash
# Create a manual backup
docker-compose exec db pg_dump -U financeuser finance_tracker > backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore from Backup:**
```bash
# Stop the services
docker-compose stop backend frontend

# Restore the database
cat backups/backup_YYYYMMDD_HHMMSS.sql | docker-compose exec -T db psql -U financeuser -d finance_tracker

# Restart services
docker-compose start backend frontend
```

**Download Backups to Local Machine:**
```bash
# From your local machine
scp -i your-key.pem ec2-user@your-ec2-public-ip:~/Finance-Tracker-Personal/backups/*.sql ./local-backups/
```

### Monitor Disk Usage

```bash
# Check Docker disk usage
docker system df

# Check volume sizes
docker volume ls
du -sh $(docker volume inspect finance-tracker-personal_postgres_data | grep Mountpoint | awk '{print $2}' | tr -d '"')

# Clean up unused Docker resources
docker system prune -a
```

### View Resource Usage

```bash
# Real-time container stats
docker stats

# Container processes
docker-compose top
```

---

## Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

**Common issues:**
1. **Port conflicts**: Make sure ports 80, 5001, and 5432 are not in use
   ```bash
   sudo netstat -tulpn | grep -E ':(80|5001|5432)'
   ```

2. **Database connection issues**: Wait for database to be fully ready
   ```bash
   docker-compose logs db
   ```

3. **Permission issues**: Check file permissions
   ```bash
   ls -la backups/
   ```

### Cannot Connect to Application

1. **Check EC2 Security Group**: Ensure ports 80 and 5001 are open
2. **Check services are running**: `docker-compose ps`
3. **Check firewall** (if enabled):
   ```bash
   sudo iptables -L -n
   ```

### Frontend Can't Connect to Backend

1. **Verify CORS_ORIGINS in .env**: Should include your EC2 public IP
2. **Check REACT_APP_API_URL**: Should point to your backend
3. **Rebuild frontend** after changing API URL:
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

### Database Issues

**Check database logs:**
```bash
docker-compose logs db
```

**Connect to database:**
```bash
docker-compose exec db psql -U financeuser -d finance_tracker
```

**Reset database (⚠️ DELETES ALL DATA):**
```bash
docker-compose down -v
docker-compose up -d
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker cache
docker system prune -a -f

# Remove old backups (keep last 7 days)
find ./backups -name "backup_*.sql" -type f -mtime +7 -delete
```

---

## Security Best Practices

### 1. Use Strong Passwords
- Generate strong passwords for `POSTGRES_PASSWORD` and `SECRET_KEY`
- Never use default passwords in production

### 2. Restrict Access
- Limit SSH access to your IP only in Security Group
- Consider using AWS Systems Manager Session Manager instead of SSH
- Use IAM roles for EC2 instead of access keys

### 3. Enable HTTPS (Recommended)
Using Let's Encrypt with Certbot:

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx  # Amazon Linux
# or
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Update docker-compose.yml to expose port 443
# Update nginx.conf to handle SSL
```

### 4. Regular Updates
```bash
# Update system packages weekly
sudo yum update -y  # Amazon Linux
# or
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Update Docker images monthly
docker-compose pull
docker-compose up -d
```

### 5. Enable CloudWatch Monitoring
- Set up CloudWatch alarms for CPU, memory, and disk usage
- Enable VPC Flow Logs
- Monitor application logs

### 6. Database Security
- Never expose port 5432 to the internet
- Use strong passwords
- Regular backups
- Enable automated snapshots of EBS volumes

### 7. Environment Variables
- Never commit `.env` file to version control
- Store sensitive values in AWS Secrets Manager or Parameter Store
- Rotate secrets regularly

### 8. Network Security
- Use VPC with private subnets for database
- Enable AWS WAF for DDoS protection
- Use AWS Shield Standard (free)

---

## Additional Resources

### Useful Commands Reference

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

# Execute command in container
docker-compose exec backend bash
docker-compose exec db psql -U financeuser

# Build images
docker-compose build

# Pull latest images
docker-compose pull

# Remove containers and networks
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

### Monitoring Setup (Optional)

Consider adding monitoring with:
- **Prometheus + Grafana** for metrics
- **ELK Stack** for log aggregation
- **AWS CloudWatch** for infrastructure monitoring
- **Uptime monitors** like UptimeRobot or Pingdom

---

## Cost Optimization

1. **Use Reserved Instances** for long-term deployments (up to 72% savings)
2. **Right-size your instance** - start with t3.small, scale up if needed
3. **Use EBS gp3 volumes** instead of gp2 (cheaper)
4. **Enable automated backups** to S3 instead of keeping many local backups
5. **Set up CloudWatch alarms** to detect anomalies
6. **Stop instance during non-business hours** if applicable (development environments)

---

## Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review this documentation
- Check GitHub issues
- Review application logs in `backend_logs` volume

---

## License

MIT License - See LICENSE file for details.

---

**Last Updated:** November 2025
**Version:** 1.0.0

