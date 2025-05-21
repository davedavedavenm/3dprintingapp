# Docker Deployment Guide - 3D Print Quoting System

This guide provides detailed instructions for deploying the 3D Print Quoting System using Docker. The system supports both standard x86/x64 deployments and ARM64-based deployments (e.g., Raspberry Pi).

## Deployment Options

- **Standard Deployment**: For x86/x64 servers using PostgreSQL, Redis, and Nginx
- **ARM Deployment**: For Raspberry Pi devices using SQLite, Redis, and Nginx

## Prerequisites

### Standard Deployment
- Docker 20.10+ and Docker Compose 2.0+
- 4GB+ RAM
- 10GB+ free disk space
- Internet connection for pulling images

### Raspberry Pi Deployment
- Raspberry Pi 4 (4GB or 8GB RAM recommended)
- Raspberry Pi OS Bullseye (64-bit) or newer
- Docker and Docker Compose installed
- 32GB+ microSD card or USB SSD (recommended)

## Directory Structure

```
3D-Print-Quoting-Website/
├── backend/              # Python/Flask backend
├── frontend/             # React.js frontend
├── config/               # Configuration files
│   ├── nginx/            # Nginx configuration
│   │   ├── nginx.conf
│   │   └── sites-enabled/
│   │       └── default.conf
│   ├── postgres/         # PostgreSQL configuration
│   │   └── init.sql
│   └── redis/            # Redis configuration
│       └── redis.conf
├── docker-compose.yml    # Standard deployment
├── docker-compose.arm.yml # ARM/Raspberry Pi deployment
├── docker-compose.dev.yml # Development overrides
├── Dockerfile            # Standard Dockerfile
├── Dockerfile.arm        # ARM-specific Dockerfile
└── .env                  # Environment variables
```

## Configuration Files

Before deployment, make sure the following configuration files are in place:

### 1. Environment Variables

Copy the `.env.template` file to `.env` and update the values:

```bash
cp .env.template .env
```

**Important Variables to Configure:**
- `SECRET_KEY`: A secure random string
- `POSTGRES_PASSWORD`: PostgreSQL database password
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`: PayPal API credentials

### 2. Database Initialization (Standard Deployment)

The database initialization script (`config/postgres/init.sql`) will create the necessary tables and default data during the first startup.

### 3. Redis Configuration

The Redis configuration file (`config/redis/redis.conf`) is configured for optimal performance. For production, consider:
- Uncomment and set `requirepass` for Redis authentication
- Adjust `maxmemory` based on your server's available memory

### 4. Nginx Configuration

The Nginx configuration files:
- `config/nginx/nginx.conf`: Main configuration
- `config/nginx/sites-enabled/default.conf`: Default server configuration

For production with SSL:
1. Uncomment the HTTPS server section in `config/nginx/sites-enabled/default.conf`
2. Create or obtain SSL certificates and put them in the `ssl_certs` volume

## Deployment Instructions

### Standard Deployment (x86/x64)

1. **Setup Configuration Files**
   ```bash
   mkdir -p config/{nginx/sites-enabled,postgres,redis}
   # Copy configuration files as described above
   ```

2. **Configure Environment**
   ```bash
   cp .env.template .env
   # Edit .env with your settings
   ```

3. **Start the Services**
   ```bash
   docker-compose up -d
   ```

4. **Verify Deployment**
   ```bash
   docker-compose ps
   ```

5. **Access the Application**
   - Frontend: http://your-server-ip
   - Backend API: http://your-server-ip/api

### Raspberry Pi Deployment (ARM64)

1. **Setup Raspberry Pi**
   ```bash
   # Run the setup script as root
   sudo ./pi-setup.sh
   ```

2. **Configure Environment**
   ```bash
   cp .env.template .env
   # Edit .env with your settings
   ```

3. **Start the Services**
   ```bash
   docker-compose -f docker-compose.arm.yml up -d
   ```

4. **Verify Deployment**
   ```bash
   docker-compose -f docker-compose.arm.yml ps
   ```

5. **Access the Application**
   - Frontend: http://your-pi-ip
   - Backend API: http://your-pi-ip/api

### Development Environment

For development, you can use the development override:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

This will:
- Mount the local backend and frontend directories for live code changes
- Start development tools like MailHog and pgAdmin
- Configure hot-reloading for frontend development

## Docker Compose Commands

### Standard Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart a specific service
docker-compose restart app

# Update and rebuild services
docker-compose up -d --build
```

### Raspberry Pi Deployment

Replace `docker-compose` with `docker-compose -f docker-compose.arm.yml` in the commands above.

## Volumes and Data Persistence

The Docker Compose files define several named volumes for data persistence:

- `postgres_data`: PostgreSQL database (standard deployment)
- `redis_data`: Redis data
- `app_uploads`: Uploaded STL files
- `app_temp`: Temporary files (e.g., G-code)
- `app_logs`: Application logs
- `app_data`: SQLite database and other application data
- `nginx_logs`: Nginx logs
- `ssl_certs`: SSL certificates
- `frontend_build`: Built frontend assets

## Backup and Restore

### Backup

```bash
# Stop the services
docker-compose down

# Backup volumes
docker run --rm -v 3d-print-quoting-website_app_uploads:/source -v /path/to/backup:/backup \
  busybox tar -zcvf /backup/app_uploads.tar.gz -C /source .

# Repeat for other volumes as needed

# Restart the services
docker-compose up -d
```

### Restore

```bash
# Stop the services
docker-compose down

# Restore volumes
docker run --rm -v 3d-print-quoting-website_app_uploads:/destination -v /path/to/backup:/backup \
  busybox sh -c "rm -rf /destination/* && tar -zxvf /backup/app_uploads.tar.gz -C /destination"

# Repeat for other volumes as needed

# Restart the services
docker-compose up -d
```

## Monitoring and Maintenance

All services include health checks. You can monitor their status with:

```bash
docker-compose ps
```

For detailed monitoring:

1. **Check Service Logs**
   ```bash
   docker-compose logs -f app
   ```

2. **Check Application Health**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Check Database Connection**
   ```bash
   docker-compose exec postgres pg_isready -U quoting_user -d quoting_db
   ```

4. **Check Redis Connection**
   ```bash
   docker-compose exec redis redis-cli ping
   ```

## Production Considerations

For production deployments, consider:

1. **SSL Configuration**
   - Obtain SSL certificates (e.g., Let's Encrypt)
   - Configure Nginx for HTTPS

2. **Security Hardening**
   - Set secure passwords for all components
   - Configure firewall rules
   - Use least privilege principles

3. **Performance Tuning**
   - Adjust PostgreSQL/Redis cache settings
   - Configure worker processes for Gunicorn
   - Implement a CDN for static assets

4. **Monitoring**
   - Set up monitoring tools (Prometheus/Grafana)
   - Configure log aggregation
   - Set up alerts for critical issues

## Troubleshooting

### Common Issues

1. **Container Fails to Start**
   - Check logs: `docker-compose logs app`
   - Verify environment variables in `.env`
   - Check for port conflicts

2. **Database Connection Issues**
   - Verify database credentials
   - Check if PostgreSQL container is running

3. **Redis Connection Issues**
   - Check if Redis container is running
   - Verify Redis configuration

4. **Frontend/Backend Communication Issues**
   - Check Nginx configuration
   - Verify environment variables for API URLs

5. **PayPal Integration Issues**
   - Verify PayPal API credentials
   - Check webhook configuration

### Specific Raspberry Pi Issues

1. **Out of Memory Errors**
   - Reduce memory limits in `docker-compose.arm.yml`
   - Disable unused services (e.g., worker)
   - Increase swap space

2. **Performance Issues**
   - Use an SSD instead of microSD card
   - Optimize Redis configuration
   - Minimize logging in production

## Updating the Application

To update the application:

1. **Pull the Latest Changes**
   ```bash
   git pull
   ```

2. **Rebuild and Restart Services**
   ```bash
   docker-compose up -d --build
   ```

For ARM deployments:
```bash
docker-compose -f docker-compose.arm.yml up -d --build
```

## Support and Resources

- **Project Documentation**: See `README.md` and other documentation files
- **Docker Documentation**: [https://docs.docker.com/](https://docs.docker.com/)
- **Raspberry Pi Documentation**: [https://www.raspberrypi.org/documentation/](https://www.raspberrypi.org/documentation/)
