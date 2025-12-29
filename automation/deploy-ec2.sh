#!/bin/bash

# Finance Tracker - EC2 Deployment Script
# This script automates the deployment process on EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored message
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

print_info "Starting Finance Tracker deployment on EC2..."

# Step 1: Check prerequisites
print_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check for Docker Compose (V2 or V1)
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_info "All prerequisites found!"

# Step 2: Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    
    if [ -f env.example ]; then
        cp env.example .env
        print_info ".env file created from template."
        
        # Try to get EC2 public IP
        EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
        
        if [ -n "$EC2_PUBLIC_IP" ]; then
            print_info "Detected EC2 public IP: $EC2_PUBLIC_IP"
            
            # Generate secure passwords
            SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
            POSTGRES_PASSWORD=$(openssl rand -base64 24)
            
            # Update .env file
            sed -i.bak "s|your_secure_password_here|$POSTGRES_PASSWORD|g" .env
            sed -i.bak "s|your_super_secret_key_here_change_in_production|$SECRET_KEY|g" .env
            sed -i.bak "s|http://your-ec2-public-ip|http://$EC2_PUBLIC_IP|g" .env
            sed -i.bak "s|http://localhost:3000|http://$EC2_PUBLIC_IP|g" .env
            
            rm -f .env.bak
            
            print_info "Auto-configured .env with EC2 IP and secure passwords!"
        fi
        
        print_warning "Please review and update .env file before continuing!"
        read -p "Press Enter to edit .env file (or Ctrl+C to exit)..." 
        ${EDITOR:-nano} .env
    else
        print_error "env.example not found. Cannot create .env file."
        exit 1
    fi
else
    print_info ".env file found."
fi

# Step 3: Create backups directory
print_info "Creating backups directory..."
mkdir -p backups
chmod 755 backups

# Step 4: Pull latest code (if in git repo)
if [ -d .git ]; then
    print_info "Pulling latest code from git..."
    git pull origin main || print_warning "Could not pull from git. Continuing with local code..."
fi

# Step 5: Check and create swap space if needed (prevents freezing)
print_info "Checking swap space..."
SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_SIZE" -lt 512 ]; then
    print_warning "Low/no swap space detected. Creating 1GB swap file..."
    if [ ! -f /swapfile ]; then
        sudo fallocate -l 1G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024 status=progress
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        print_info "Swap file created and activated!"
    else
        sudo swapon /swapfile 2>/dev/null || print_info "Swap already active"
    fi
fi

# Step 6: Stop existing containers (if any)
if [ "$(docker ps -aq -f name=finance-tracker)" ]; then
    print_info "Stopping existing containers..."
    docker compose down 2>/dev/null || docker-compose down
fi

# Step 7: Clean up Docker to free memory
print_info "Cleaning up Docker (freeing memory)..."
docker system prune -af --volumes > /dev/null 2>&1 || true

# Step 8: Build images SEQUENTIALLY (prevents memory overload)
print_info "Building Docker images sequentially (this prevents freezing)..."

# Build backend first (smaller, faster)
print_info "Building backend (1/2)..."
docker compose build --no-cache backend 2>/dev/null || docker-compose build --no-cache backend

# Small pause to let system recover
sleep 5

# Build frontend (memory intensive, build with limits)
print_info "Building frontend (2/2) - this may take 5-10 minutes..."
print_warning "⚠️  Frontend build is memory-intensive. System may slow down temporarily."

# Build frontend with memory limits
export NODE_OPTIONS="--max_old_space_size=512"
docker compose build --no-cache --build-arg NODE_OPTIONS="--max_old_space_size=512" frontend 2>/dev/null || \
    docker-compose build --no-cache --build-arg NODE_OPTIONS="--max_old_space_size=512" frontend

print_info "All images built successfully!"

# Step 9: Start services
print_info "Starting services..."
docker compose up -d 2>/dev/null || docker-compose up -d

# Step 8: Wait for services to be healthy
print_info "Waiting for services to be ready..."
sleep 10

# Check if services are running
RETRIES=30
BACKEND_READY=false
FRONTEND_READY=false

for i in $(seq 1 $RETRIES); do
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        BACKEND_READY=true
    fi
    
    if curl -s http://localhost/health > /dev/null 2>&1; then
        FRONTEND_READY=true
    fi
    
    if [ "$BACKEND_READY" = true ] && [ "$FRONTEND_READY" = true ]; then
        break
    fi
    
    echo -n "."
    sleep 2
done

echo ""

# Step 9: Verify deployment
print_info "Verifying deployment..."

if [ "$BACKEND_READY" = true ]; then
    print_info "✓ Backend is healthy"
else
    print_warning "✗ Backend is not responding (might still be starting)"
fi

if [ "$FRONTEND_READY" = true ]; then
    print_info "✓ Frontend is healthy"
else
    print_warning "✗ Frontend is not responding (might still be starting)"
fi

# Check database
if docker compose exec -T db pg_isready -U financeuser > /dev/null 2>&1 || docker-compose exec -T db pg_isready -U financeuser > /dev/null 2>&1; then
    print_info "✓ Database is healthy"
else
    print_warning "✗ Database is not responding (might still be starting)"
fi

# Step 10: Display access information
print_info "Deployment complete!"
echo ""
echo "================================================"
echo "           🎉 Finance Tracker Deployed 🎉"
echo "================================================"
echo ""

# Try to get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || hostname -I | awk '{print $1}')

if [ -n "$PUBLIC_IP" ]; then
    echo "Access your application at:"
    echo "  Frontend:  http://$PUBLIC_IP"
    echo "  Backend:   http://$PUBLIC_IP:5001"
    echo "  Health:    http://$PUBLIC_IP:5001/api/health"
else
    echo "Access your application at:"
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost:5001"
fi

echo ""
echo "Useful commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Check status:     docker-compose ps"
echo "  Restart:          docker-compose restart"
echo "  Stop:             docker-compose stop"
echo "  Start:            docker-compose start"
echo ""
echo "Or use the Makefile:"
echo "  make logs         View all logs"
echo "  make status       Check service status"
echo "  make restart      Restart services"
echo "  make backup       Create database backup"
echo "  make help         Show all commands"
echo ""
echo "================================================"

# Create a systemd service for auto-start (optional)
if [ "$1" = "--systemd" ]; then
    print_info "Setting up systemd service for auto-start..."
    
    sudo tee /etc/systemd/system/finance-tracker.service > /dev/null <<EOF
[Unit]
Description=Finance Tracker Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable finance-tracker.service
    
    print_info "Systemd service installed! The application will auto-start on boot."
fi

exit 0

