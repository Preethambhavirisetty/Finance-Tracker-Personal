"""
Budget management routes.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime as dt
from flask import current_app

from core.database import db
from core.models import User, Profile, Budget
from auth import require_auth, get_current_user

budgets_bp = Blueprint('budgets', __name__)


@budgets_bp.route('/profiles/<int:profile_id>/budgets', methods=['GET'])
@require_auth
def get_budgets(profile_id):
    """Get all budgets for a profile."""
    user = get_current_user(User)
    
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        # Get budgets for current month by default
        month = request.args.get('month', dt.now().month, type=int)
        year = request.args.get('year', dt.now().year, type=int)
        
        budgets = Budget.query.filter_by(
            profile_id=profile_id,
            month=month,
            year=year
        ).all()
        
        return jsonify([budget.to_dict() for budget in budgets]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching budgets: {str(e)}")
        return jsonify({'error': 'Failed to fetch budgets'}), 500


@budgets_bp.route('/profiles/<int:profile_id>/budgets', methods=['POST'])
@require_auth
def create_budget(profile_id):
    """Create a new budget."""
    user = get_current_user(User)
    
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        data = request.get_json()
        amount = float(data.get('amount', 0))
        
        if amount <= 0:
            return jsonify({'error': 'Budget amount must be greater than 0'}), 400
        
        month = data.get('month', dt.now().month)
        year = data.get('year', dt.now().year)
        
        # Check if budget already exists
        existing = Budget.query.filter_by(
            profile_id=profile_id,
            category_id=data.get('category_id'),
            month=month,
            year=year
        ).first()
        
        if existing:
            return jsonify({'error': 'Budget already exists for this period'}), 400
        
        new_budget = Budget(
            profile_id=profile_id,
            category_id=data.get('category_id'),
            amount=amount,
            period=data.get('period', 'monthly'),
            month=month,
            year=year,
            alert_threshold=data.get('alert_threshold', 80)
        )

        db.session.add(new_budget)
        db.session.commit()
        
        current_app.logger.info(f"Budget created for profile {profile_id}, amount: {amount}")
        return jsonify(new_budget.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating budget: {str(e)}")
        return jsonify({'error': 'Failed to create budget'}), 500


@budgets_bp.route('/budgets/<int:budget_id>', methods=['PUT'])
@require_auth
def update_budget(budget_id):
    """Update a budget."""
    user = get_current_user(User)
    
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        profile = Profile.query.filter_by(id=budget.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if 'amount' in data:
            budget.amount = float(data['amount'])
        if 'alert_threshold' in data:
            budget.alert_threshold = int(data['alert_threshold'])
        
        db.session.commit()
        return jsonify(budget.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating budget: {str(e)}")
        return jsonify({'error': 'Failed to update budget'}), 500


@budgets_bp.route('/budgets/<int:budget_id>', methods=['DELETE'])
@require_auth
def delete_budget(budget_id):
    """Delete a budget."""
    user = get_current_user(User)
    
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        profile = Profile.query.filter_by(id=budget.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(budget)
        db.session.commit()
        
        current_app.logger.info(f"Budget deleted: {budget_id}")
        return jsonify({'message': 'Budget deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting budget: {str(e)}")
        return jsonify({'error': 'Failed to delete budget'}), 500
