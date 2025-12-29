"""
Database setup and initialization for Finance Tracker application.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask import g

# Initialize SQLAlchemy instance
db = SQLAlchemy()
migrate = None  # Will be initialized in init_db


def init_db(app):
    """
    Initialize database with Flask application.
    
    Args:
        app: Flask application instance
    """
    global migrate
    db.init_app(app)
    
    # Initialize Flask-Migrate
    migrate = Migrate(app, db)
    
    # Make models available to auth decorators
    @app.before_request
    def before_request():
        from .models import User, Profile, Transaction
        g.User = User
        g.Profile = Profile
        g.Transaction = Transaction
    
    # Note: db.create_all() is replaced by Flask-Migrate
    # Run migrations with: flask db upgrade
    
    return db

