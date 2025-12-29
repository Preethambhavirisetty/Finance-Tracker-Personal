# Backend Dockerfile for Finance Tracker
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create a non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (default, can be overridden via PORT env var)
EXPOSE 5001

# Health check (uses PORT env var if available)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import os, requests; port = os.environ.get('PORT', os.environ.get('BACKEND_PORT', '5001')); requests.get(f'http://localhost:{port}/api/health')" || exit 1

# Use entrypoint script to start Gunicorn with environment-based configuration
ENTRYPOINT ["/app/docker-entrypoint.sh"]

