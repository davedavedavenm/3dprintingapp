#!/bin/bash
# Docker entrypoint script for 3D Print Quoting System
set -e
cleanup() {
    echo "Received shutdown signal, cleaning up..."
    exit 0
}
trap cleanup SIGTERM SIGINT
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local timeout=${4:-30}
    echo "Waiting for $service_name at $host:$port..."
    for i in $(seq 1 $timeout); do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "$service_name is ready!"
            return 0
        fi
        echo "Waiting for $service_name... ($i/$timeout)"
        sleep 1
    done
    echo "Timeout waiting for $service_name"
    exit 1
}
echo "Starting 3D Print Quoting System..."
required_vars=("SECRET_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done
mkdir -p /app/uploads /app/temp /app/logs /app/data # Ensure data dir is also created if sqlite is in /app/data
chmod -R 755 /app/uploads /app/temp /app/logs /app/data # Ensure data dir has permissions
# if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_PORT" ]; then # Not using DATABASE_HOST for SQLite
#     wait_for_service "$DATABASE_HOST" "$DATABASE_PORT" "Database" 60
# fi
if [ -n "$REDIS_URL" ]; then # Simplified check for Redis based on URL
    redis_host=$(echo $REDIS_URL | sed -E 's_redis://([^:]+):.*_\1_')
    redis_port=$(echo $REDIS_URL | sed -E 's_redis://[^:]+:([0-9]+).*_\1_')
    if [ "$redis_host" != "$REDIS_URL" ] && [ "$redis_port" != "$REDIS_URL" ]; then # check if sed worked
         wait_for_service "$redis_host" "$redis_port" "Redis" 30
    fi
fi
if [ -f "$PRUSA_SLICER_PATH" ]; then
    echo "PrusaSlicer found at $PRUSA_SLICER_PATH"
    if ! "$PRUSA_SLICER_PATH" --version >/dev/null 2>&1; then
        echo "Warning: PrusaSlicer test failed, but continuing..."
    else
        echo "PrusaSlicer verification successful"
    fi
else
    echo "Warning: PrusaSlicer not found at $PRUSA_SLICER_PATH"
fi
# RUN_MIGRATIONS not used with SQLite for now
# if [ -n "$RUN_MIGRATIONS" ] && [ "$RUN_MIGRATIONS" = "true" ]; then
#     echo "Running database migrations..."
# fi
echo "Cleaning up temporary files..."
find /app/temp -type f -mtime +1 -delete 2>/dev/null || true
if [ ! -f /app/logs/app.log ]; then
    touch /app/logs/app.log
    chown appuser:appuser /app/logs/app.log # Ensure appuser owns log file
fi
export PYTHONPATH="/app:$PYTHONPATH"
# PATH is already set correctly in Dockerfile for appuser
echo "Executing command: $@"
exec "$@"