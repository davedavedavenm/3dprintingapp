# Raspberry Pi 4 Deployment Guide
# 3D Print Quoting System

## System Requirements

- Raspberry Pi 4 (recommended: 4GB or 8GB RAM model)
- 32GB+ microSD card (or USB SSD for better performance)
- Raspberry Pi OS Bullseye (64-bit) or newer
- Docker and Docker Compose installed
- Internet connection for initial setup

## Prerequisites

1. Install Docker and Docker Compose on your Raspberry Pi:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=arm64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Add your user to the docker group to run docker without sudo
sudo usermod -aG docker $USER

# Apply changes to current session
newgrp docker
```

2. Enable Docker to start on boot:

```bash
sudo systemctl enable docker
```

3. Create necessary directories for the application:

```bash
mkdir -p ~/3d-print-quoting/data
```

## Deployment Steps

1. Clone or copy the project files to your Raspberry Pi:

2. Create a `.env` file for environment variables:

```bash
cd ~/3d-print-quoting
touch .env
```

3. Add necessary environment variables to the `.env` file:

```
# Security
SECRET_KEY=your_secure_secret_key_here

# Application Settings
APP_PORT=5000
NGINX_HTTP_PORT=80

# Optional PayPal Integration
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_SANDBOX=true

# Pricing Configuration (can be adjusted)
PLA_RATE=0.025
ABS_RATE=0.028
PETG_RATE=0.035
TPU_RATE=0.045
TIME_RATE=0.15
OVERHEAD_MULTIPLIER=1.35
```

4. Deploy the application using Docker Compose:

```bash
# Navigate to the project directory
cd ~/3d-print-quoting

# Start all services in detached mode
docker-compose -f docker-compose.arm.yml up -d
```

5. Monitor the startup process:

```bash
docker-compose -f docker-compose.arm.yml logs -f
```

6. Verify the deployment:
   - Access the web interface at: `http://[your-pi-ip-address]`
   - Test the API at: `http://[your-pi-ip-address]/api/v1/health`

## Resource Management

The Raspberry Pi has limited resources. The docker-compose.arm.yml file includes resource constraints to prevent container crashes. You may need to adjust these based on your specific Raspberry Pi model:

- For 2GB Pi: Lower memory limits further
- For 8GB Pi: You can increase limits slightly for better performance

## Troubleshooting

1. Container fails to start with out-of-memory errors:
   - Reduce memory limits in docker-compose.arm.yml
   - Remove unnecessary services (like worker if not needed)
   - Ensure no other memory-intensive services are running on your Pi

2. PrusaSlicer issues:
   - Verify PrusaSlicer ARM version is properly installed in the container
   - Check logs for specific error messages: `docker-compose -f docker-compose.arm.yml logs app`

3. Slow performance:
   - Use an SSD instead of microSD card
   - Allocate more memory to the swap file
   - Optimize database operations (use SQLite for simplicity on Pi)

## Maintenance

1. View running containers:
   ```bash
   docker-compose -f docker-compose.arm.yml ps
   ```

2. Restart services:
   ```bash
   docker-compose -f docker-compose.arm.yml restart
   ```

3. Update application:
   ```bash
   # Pull latest changes
   git pull
   
   # Rebuild and restart containers
   docker-compose -f docker-compose.arm.yml up -d --build
   ```

4. View logs:
   ```bash
   docker-compose -f docker-compose.arm.yml logs -f [service_name]
   ```

5. Backup data:
   ```bash
   # Stop services
   docker-compose -f docker-compose.arm.yml stop
   
   # Backup volume data
   sudo cp -r /var/lib/docker/volumes/3d-print-quoting_app_data /path/to/backup
   
   # Restart services
   docker-compose -f docker-compose.arm.yml start
   ```

## Optimizing for Production

1. Set up proper security:
   - Configure a firewall with UFW
   - Set up SSL/TLS with certbot for HTTPS

2. Configure automatic updates:
   - Set up a cron job for regular Docker image updates

3. Configure monitoring:
   - Install monitoring tools like Prometheus + Grafana for resource tracking

4. Implement backup procedures:
   - Regular automated backups of the application data
