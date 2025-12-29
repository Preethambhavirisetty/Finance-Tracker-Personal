"""
Health check and API documentation routes.
"""

from flask import Blueprint, jsonify
from core.database import db
from sqlalchemy import text

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    try:
        # Check database connection
        db.session.execute(text('SELECT 1'))
        db_status = 'connected'
    except Exception as e:
        db_status = 'disconnected'
    
    return jsonify({
        'status': 'ok' if db_status == 'connected' else 'degraded',
        'database': db_status,
        'version': '2.0.0'
    }), 200


@health_bp.route('/docs', methods=['GET'])
def api_docs():
    """API documentation endpoint."""
    return jsonify({
        'version': '2.0.0',
        'endpoints': {
            'auth': {
                'POST /api/register': 'Register a new user',
                'POST /api/login': 'Login user',
                'POST /api/logout': 'Logout user (requires auth)',
                'GET /api/check-auth': 'Check authentication status'
            },
            'profiles': {
                'GET /api/profiles': 'Get all profiles for current user (requires auth)',
                'POST /api/profiles': 'Create new profile (requires auth)',
                'DELETE /api/profiles/<id>': 'Delete profile (requires auth)'
            },
            'transactions': {
                'GET /api/profiles/<id>/transactions': 'Get all transactions for profile (requires auth)',
                'POST /api/profiles/<id>/transactions': 'Create new transaction (requires auth)',
                'DELETE /api/transactions/<id>': 'Delete transaction (requires auth)'
            }
        }
    }), 200

