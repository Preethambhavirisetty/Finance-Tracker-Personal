#!/bin/sh
# Docker entrypoint script for Finance Tracker backend
# Reads environment variables and starts Gunicorn with appropriate settings

# Set defaults
GUNICORN_BIND=${GUNICORN_BIND:-0.0.0.0:5001}
GUNICORN_WORKERS=${GUNICORN_WORKERS:-4}
GUNICORN_TIMEOUT=${GUNICORN_TIMEOUT:-120}
PORT=${PORT:-${BACKEND_PORT:-5001}}

# Extract host and port from GUNICORN_BIND if it's in format host:port
# Otherwise use 0.0.0.0:PORT
if echo "$GUNICORN_BIND" | grep -q ":"; then
    BIND_ADDRESS="$GUNICORN_BIND"
else
    BIND_ADDRESS="0.0.0.0:${PORT}"
fi

# Start Gunicorn with environment-based configuration
exec gunicorn \
    --bind "$BIND_ADDRESS" \
    --workers "$GUNICORN_WORKERS" \
    --timeout "$GUNICORN_TIMEOUT" \
    --access-logfile - \
    --error-logfile - \
    app:app

