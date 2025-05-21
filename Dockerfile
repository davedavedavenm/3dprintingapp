# 3D Print Quoting System - Docker Configuration
# Multi-stage build for production-ready deployment

# Build stage for dependency installation
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PrusaSlicer
ARG PRUSA_SLICER_VERSION=2.6.1
RUN wget -O prusa-slicer.tar.bz2 \
    "https://github.com/prusa3d/PrusaSlicer/releases/download/version_${PRUSA_SLICER_VERSION}/PrusaSlicer-${PRUSA_SLICER_VERSION}+linux-x64-GTK3-202309111016.tar.bz2" \
    && tar -xjf prusa-slicer.tar.bz2 -C /opt \
    && mv /opt/PrusaSlicer-${PRUSA_SLICER_VERSION}+linux-x64-GTK3-202309111016 /opt/prusa-slicer \
    && rm prusa-slicer.tar.bz2

# Create application directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH" \
    PRUSA_SLICER_PATH="/opt/prusa-slicer/prusa-slicer" \
    FLASK_ENV=production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgtk-3-0 \
    libgconf-2-4 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

# Copy PrusaSlicer from builder stage
COPY --from=builder /opt/prusa-slicer /opt/prusa-slicer
RUN chmod +x /opt/prusa-slicer/prusa-slicer

# Copy Python dependencies
COPY --from=builder /root/.local /home/appuser/.local

# Set up application directory
WORKDIR /app
RUN chown -R appuser:appuser /app

# Create required directories with proper permissions
RUN mkdir -p /app/uploads /app/temp /app/logs /app/data \
    && chown -R appuser:appuser /app/uploads /app/temp /app/logs /app/data \
    && chmod 755 /app/uploads /app/temp /app/logs /app/data

# Switch to non-root user
USER appuser

# Copy application code
COPY --chown=appuser:appuser backend/ .

# Create configuration directories
RUN mkdir -p config

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Entry point script
COPY --chown=appuser:appuser docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Default command
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["gunicorn", "--config", "gunicorn.conf.py", "main:app"]

# Development stage
FROM production as development

# Switch back to root for development tools installation
USER root

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    pytest-mock \
    black \
    flake8 \
    mypy \
    ipython

# Install development tools
RUN apt-get update && apt-get install -y \
    vim \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Switch back to app user
USER appuser

# Set development environment
ENV FLASK_ENV=development \
    FLASK_DEBUG=1

# Override for development
CMD ["python", "main.py"]
