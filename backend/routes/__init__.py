"""
Routes module for Finance Tracker application.
Contains all API route handlers organized by feature.
"""

from flask import Blueprint

# Create main API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import and register all route modules
from . import health
from . import auth
from . import profiles
from . import transactions
from . import categories
from . import tags
from . import accounts
from . import budgets
from . import documents

# Register all blueprints
api_bp.register_blueprint(health.health_bp)
api_bp.register_blueprint(auth.auth_bp)
api_bp.register_blueprint(profiles.profiles_bp)
api_bp.register_blueprint(transactions.transactions_bp)
api_bp.register_blueprint(categories.categories_bp)
api_bp.register_blueprint(tags.tags_bp)
api_bp.register_blueprint(accounts.accounts_bp)
api_bp.register_blueprint(budgets.budgets_bp)
api_bp.register_blueprint(documents.documents_bp)

__all__ = ['api_bp']

