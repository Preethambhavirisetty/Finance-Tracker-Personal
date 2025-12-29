"""
Configuration management for Finance Tracker application.
Handles environment variables and application settings.
"""

import os
import logging
from datetime import timedelta
from dotenv import load_dotenv


class Config:
    """Application configuration class."""
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        # Load environment variables
        self._load_env()
        
        # Flask configuration
        self.SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
        self.FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
        
        # Database configuration
        database_url = os.environ.get('DATABASE_URL', 'sqlite:///finance_tracker.db')
        # Handle Render's postgres:// URL format (SQLAlchemy needs postgresql://)
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        self.SQLALCHEMY_DATABASE_URI = database_url
        
        # SQLAlchemy settings
        self.SQLALCHEMY_TRACK_MODIFICATIONS = False
        self.SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_pre_ping': os.environ.get('DB_POOL_PRE_PING', 'True').lower() == 'true',
            'pool_recycle': int(os.environ.get('DB_POOL_RECYCLE', '300')),
        }
        
        # Session configuration
        self.SESSION_COOKIE_HTTPONLY = True
        self.SESSION_COOKIE_SAMESITE = 'Lax'
        self.SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
        session_lifetime_days = int(os.environ.get('SESSION_LIFETIME_DAYS', '7'))
        self.PERMANENT_SESSION_LIFETIME = timedelta(days=session_lifetime_days)
        
        # CORS configuration
        cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost')
        self.CORS_ORIGINS = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]
        
        # Logging configuration
        log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
        self.LOG_LEVEL = getattr(logging, log_level, logging.INFO)
        
        # Server configuration
        self.PORT = int(os.environ.get('PORT', os.environ.get('BACKEND_PORT', '5001')))
        self.DEBUG = self.FLASK_ENV != 'production'
    
    def _load_env(self):
        """Load environment variables from .env files."""
        # Always load base .env first
        load_dotenv('.env', override=False)
        
        # Then override with environment-specific file
        current_env = os.environ.get('FLASK_ENV', 'development')
        if current_env == 'production':
            load_dotenv('prod.env', override=True)
        else:
            load_dotenv('dev.env', override=True)
    
    def configure_logging(self):
        """Configure application logging."""
        logging.basicConfig(
            level=self.LOG_LEVEL,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)
    
    def print_env_vars(self):
        """Print all environment variables (for debugging)."""
        all_env_vars = [
            'FLASK_ENV',
            'SECRET_KEY',
            'DATABASE_URL',
            'POSTGRES_DB',
            'POSTGRES_USER',
            'POSTGRES_PASSWORD',
            'POSTGRES_PORT',
            'BACKEND_PORT',
            'SESSION_COOKIE_SECURE',
            'SESSION_LIFETIME_DAYS',
            'DB_POOL_RECYCLE',
            'DB_POOL_PRE_PING',
            'GUNICORN_BIND',
            'GUNICORN_WORKERS',
            'GUNICORN_TIMEOUT',
            'LOG_LEVEL',
            'CORS_ORIGINS',
            'REACT_APP_API_URL',
            'FRONTEND_PORT',
            'BACKUP_KEEP_DAYS',
        ]
        print(f"Running in {self.FLASK_ENV} mode")
        for key in all_env_vars:
            value = os.environ.get(key, 'Not set')
            # Mask sensitive values
            if 'PASSWORD' in key or 'SECRET' in key:
                value = '***' if value != 'Not set' else value
            print(f"{key}: {value}")

