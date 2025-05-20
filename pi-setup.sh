#!/bin/bash
# 3D Print Quoting System - Raspberry Pi 4 Setup Script

set -e

echo "=========================================="
echo "3D Print Quoting System - Raspberry Pi Setup"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Ensure the system is up to date
echo "[1/7] Updating system packages..."
apt update && apt upgrade -y

# Install required dependencies
echo "[2/7] Installing dependencies..."
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release git

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "[3/7] Installing Docker..."
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=arm64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io
    systemctl enable docker
else
    echo "[3/7] Docker already installed, skipping..."
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    echo "[4/7] Installing Docker Compose..."
    apt install -y docker-compose-plugin
else
    echo "[4/7] Docker Compose already installed, skipping..."
fi

# Create application directory
echo "[5/7] Creating application directories..."
mkdir -p /opt/3d-print-quoting
mkdir -p /opt/3d-print-quoting/data
mkdir -p /opt/3d-print-quoting/frontend/nginx
mkdir -p /opt/3d-print-quoting/backend

# Generate .env file if it doesn't exist
if [ ! -f /opt/3d-print-quoting/.env ]; then
    echo "[6/7] Creating .env file..."
    cat > /opt/3d-print-quoting/.env << EOF
# Security
SECRET_KEY=$(openssl rand -hex 32)

# Application Settings
APP_PORT=5000
NGINX_HTTP_PORT=80

# Optional PayPal Integration
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_SANDBOX=true

# Pricing Configuration
PLA_RATE=0.025
ABS_RATE=0.028
PETG_RATE=0.035
TPU_RATE=0.045
TIME_RATE=0.15
OVERHEAD_MULTIPLIER=1.35
EOF
else
    echo "[6/7] .env file already exists, skipping..."
fi

# Copy files to the application directory
echo "[7/7] Setting up Docker Compose file..."
cp docker-compose.arm.yml /opt/3d-print-quoting/docker-compose.yml
cp Dockerfile.arm /opt/3d-print-quoting/Dockerfile
cp docker-entrypoint.sh /opt/3d-print-quoting/

# Copy backend files if they exist
if [ -d "backend" ]; then
    cp -r backend/* /opt/3d-print-quoting/backend/
fi

# Copy frontend files if they exist
if [ -d "frontend" ]; then
    cp -r frontend/* /opt/3d-print-quoting/frontend/
fi

# Copy nginx config if it exists
if [ -f "frontend/nginx/nginx.conf" ]; then
    mkdir -p /opt/3d-print-quoting/frontend/nginx
    cp frontend/nginx/nginx.conf /opt/3d-print-quoting/frontend/nginx/
fi

# Set permissions
chown -R 1000:1000 /opt/3d-print-quoting
chmod +x /opt/3d-print-quoting/docker-entrypoint.sh

echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "To start the application, run:"
echo "  cd /opt/3d-print-quoting"
echo "  docker-compose up -d"
echo ""
echo "Access the application at: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "For more information, see the RASPBERRY_PI_DEPLOYMENT.md file."
echo "=========================================="
