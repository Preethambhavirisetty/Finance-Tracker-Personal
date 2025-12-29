"""
Account management routes.
"""

from flask import Blueprint, request, jsonify
from flask import current_app

from core.database import db
from core.models import User, Profile, Account
from auth import require_auth, get_current_user, sanitize_input

accounts_bp = Blueprint('accounts', __name__)


@accounts_bp.route('/profiles/<int:profile_id>/accounts', methods=['GET'])
@require_auth
def get_accounts(profile_id):
    """Get all accounts for a profile."""
    user = get_current_user(User)
    
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        accounts = Account.query.filter_by(profile_id=profile_id).order_by(Account.name).all()
        return jsonify([acc.to_dict() for acc in accounts]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching accounts: {str(e)}")
        return jsonify({'error': 'Failed to fetch accounts'}), 500


@accounts_bp.route('/profiles/<int:profile_id>/accounts', methods=['POST'])
@require_auth
def create_account(profile_id):
    """Create a new account."""
    user = get_current_user(User)
    
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        data = request.get_json()
        name = sanitize_input(data.get('name', ''))
        acc_type = data.get('type', 'cash')
        
        if not name or len(name) < 2:
            return jsonify({'error': 'Account name must be at least 2 characters'}), 400
        
        if acc_type not in ['cash', 'bank', 'credit_card', 'investment', 'savings', 'checking', 'loans', 'other']:
            return jsonify({'error': 'Invalid account type'}), 400
        
        new_account = Account(
            profile_id=profile_id,
            name=name,
            type=acc_type,
            balance=float(data.get('balance', 0)),
            currency=data.get('currency', 'USD'),
            icon=data.get('icon', '💰'),
            color=data.get('color', '#10B981')
        )

        
        db.session.add(new_account)
        db.session.commit()
        
        current_app.logger.info(f"Account created: {name} for profile {profile_id}")
        return jsonify(new_account.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating account: {str(e)}")
        return jsonify({'error': 'Failed to create account'}), 500


@accounts_bp.route('/accounts/<int:account_id>', methods=['PUT'])
@require_auth
def update_account(account_id):
    """Update an account."""
    user = get_current_user(User)
    
    try:
        account = Account.query.get(account_id)
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        profile = Profile.query.filter_by(id=account.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if 'name' in data:
            account.name = sanitize_input(data['name'])
        if 'balance' in data:
            account.balance = float(data['balance'])
        if 'icon' in data:
            account.icon = data['icon']
        if 'color' in data:
            account.color = data['color']
        if 'is_active' in data:
            account.is_active = data['is_active']
        
        db.session.commit()
        return jsonify(account.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating account: {str(e)}")
        return jsonify({'error': 'Failed to update account'}), 500


@accounts_bp.route('/accounts/<int:account_id>', methods=['DELETE'])
@require_auth
def delete_account(account_id):
    """Delete an account."""
    user = get_current_user(User)
    
    try:
        account = Account.query.get(account_id)
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        profile = Profile.query.filter_by(id=account.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(account)
        db.session.commit()
        
        current_app.logger.info(f"Account deleted: {account_id}")
        return jsonify({'message': 'Account deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting account: {str(e)}")
        return jsonify({'error': 'Failed to delete account'}), 500
