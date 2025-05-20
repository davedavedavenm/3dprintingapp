#!/bin/bash
# 3D Print Quoting System - Raspberry Pi 4 Setup Script (Revised)
set -e
echo "=========================================="
echo "3D Print Quoting System - Raspberry Pi Setup"
echo "=========================================="
APP_DIR="/opt/3d-print-quoting"
# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi
# Ensure the system is up to date
echo "[1/5] Updating system packages..."
apt-get update && apt-get upgrade -y
# Install required dependencies
echo "[2/5] Installing dependencies (git, curl, gnupg, lsb-release)..."
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git
# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "[3/5] Installing Docker..."
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    systemctl enable docker
    systemctl start docker
    usermod -aG docker $SUDO_USER || echo "Could not add $SUDO_USER to docker group. Run 'sudo usermod -aG docker \$USER' manually and re-login."
else
    echo "[3/5] Docker already installed."
fi
# Install Docker Compose plugin if not already installed
if ! docker compose version &> /dev/null; then # Checks if 'docker compose' (plugin) works
    echo "[4/5] Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin
else
    echo "[4/5] Docker Compose plugin already installed."
fi
echo "[5/5] Creating application directory: $APP_DIR (if it doesn't exist)..."
mkdir -p "$APP_DIR"
# Ownership will be handled by git clone or user manually after cloning
echo "=========================================="
echo "Setup of prerequisites complete!"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Ensure you have SSH keys configured for GitHub on this Pi if using SSH, or use HTTPS."
echo "2. Clone your project repository into $APP_DIR:"
echo "   sudo git clone <your-repo-url> \"$APP_DIR\""
echo "   (Replace <your-repo-url> with your actual GitHub repository URL)"
echo "3. Change directory: cd \"$APP_DIR\""
echo "4. Create a .env file if needed (e.g., copy .env.example to .env and fill it)."
echo "5. If your Pi-specific compose file is named docker-compose.arm.yml, you might want to rename or symlink it:"
echo "   sudo cp docker-compose.arm.yml docker-compose.yml"
echo "6. Build and start the application:"
echo "   sudo docker compose up -d --build"
echo ""
echo "Access the application at: http://$(hostname -I | awk '{print $1}') (if Nginx is configured for port 80)"
echo ""
echo "For more detailed deployment steps, refer to RASPBERRY_PI_DEPLOYMENT.md in your project."
echo "=========================================="