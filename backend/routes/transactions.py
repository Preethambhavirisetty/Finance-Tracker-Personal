"""
Transaction management routes.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from flask import current_app

from core.database import db
from core.models import User, Profile, Transaction, Tag, Account
from auth import require_auth, get_current_user, sanitize_input, validate_transaction_data

transactions_bp = Blueprint('transactions', __name__)


@transactions_bp.route('/profiles/<int:profile_id>/transactions', methods=['GET'])
@require_auth
def get_transactions(profile_id):
    """Get all transactions for a profile."""
    user = get_current_user(User)
    
    try:
        # Verify ownership
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found or access denied'}), 404

        # Optimized query with ordering
        transactions = Transaction.query.filter_by(
            profile_id=profile_id
        ).order_by(Transaction.date.desc(), Transaction.created_at.desc()).all()
        
        return jsonify([transaction.to_dict() for transaction in transactions]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching transactions: {str(e)}")
        return jsonify({'error': 'Failed to fetch transactions'}), 500


@transactions_bp.route('/profiles/<int:profile_id>/transactions', methods=['POST'])
@require_auth
def create_transaction(profile_id):
    """Create a new transaction."""
    user = get_current_user(User)
    
    try:
        # Verify ownership
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found or access denied'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate transaction data
        validation_errors = validate_transaction_data(data)
        if validation_errors:
            return jsonify({'error': validation_errors[0]}), 400

        transaction_type = sanitize_input(data.get('type'))
        amount = float(data.get('amount'))
        category = sanitize_input(data.get('category'))
        description = sanitize_input(data.get('description', ''))
        date_str = data.get('date')

        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

        new_transaction = Transaction(
            profile_id=profile_id,
            type=transaction_type,
            amount=amount,
            category=category,
            description=description,
            date=date,
            category_id=data.get('category_id'),
            account_id=data.get('account_id')
        )
        
        # Handle tags (many-to-many relationship)
        tag_ids = data.get('tag_ids', [])
        if tag_ids:
            tags = Tag.query.filter(Tag.id.in_(tag_ids), Tag.profile_id == profile_id).all()
            new_transaction.tags = tags
        
        db.session.add(new_transaction)
        
        # Update account balance if account is specified
        if new_transaction.account_id:
            account = Account.query.get(new_transaction.account_id)
            if account and account.profile_id == profile_id:
                if transaction_type == 'income':
                    account.balance += amount
                else:
                    account.balance -= amount
        
        db.session.commit()

        current_app.logger.info(f"Transaction created: {transaction_type} ${amount} for profile {profile_id}")
        return jsonify(new_transaction.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': 'Invalid amount format'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating transaction: {str(e)}")
        return jsonify({'error': 'Failed to create transaction'}), 500


@transactions_bp.route('/transactions/<int:transaction_id>', methods=['GET'])
@require_auth
def get_transaction(transaction_id):
    """Get a single transaction."""
    user = get_current_user(User)
    
    try:
        # Verify ownership through profile relationship
        transaction = db.session.query(Transaction).join(Profile).filter(
            Transaction.id == transaction_id,
            Profile.user_id == user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found or access denied'}), 404
        
        return jsonify(transaction.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching transaction: {str(e)}")
        return jsonify({'error': 'Failed to fetch transaction'}), 500


@transactions_bp.route('/transactions/<int:transaction_id>', methods=['PUT'])
@require_auth
def update_transaction(transaction_id):
    """Update a transaction."""
    user = get_current_user(User)
    
    try:
        # Verify ownership through profile relationship
        transaction = db.session.query(Transaction).join(Profile).filter(
            Transaction.id == transaction_id,
            Profile.user_id == user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found or access denied'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Store old values for account balance reversal if needed
        old_amount = transaction.amount
        old_type = transaction.type
        old_account_id = transaction.account_id
        
        # Update transaction fields
        transaction.type = sanitize_input(data.get('type', transaction.type))
        transaction.amount = float(data.get('amount', transaction.amount))
        transaction.category = sanitize_input(data.get('category', transaction.category))
        transaction.description = sanitize_input(data.get('description', transaction.description or ''))
        
        if data.get('date'):
            transaction.date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
        
        if 'category_id' in data:
            transaction.category_id = data.get('category_id')
        if 'account_id' in data:
            transaction.account_id = data.get('account_id')
        
        # Handle account balance updates if account changed
        new_account_id = transaction.account_id
        if old_account_id != new_account_id:
            # Reverse old account balance
            if old_account_id:
                old_account = Account.query.get(old_account_id)
                if old_account and old_account.profile_id == transaction.profile_id:
                    if old_type == 'income':
                        old_account.balance -= old_amount
                    else:
                        old_account.balance += old_amount
            
            # Update new account balance
            if new_account_id:
                new_account = Account.query.get(new_account_id)
                if new_account and new_account.profile_id == transaction.profile_id:
                    if transaction.type == 'income':
                        new_account.balance += transaction.amount
                    else:
                        new_account.balance -= transaction.amount
        elif old_account_id and (old_amount != transaction.amount or old_type != transaction.type):
            # Account unchanged but amount/type changed - adjust balance
            account = Account.query.get(old_account_id)
            if account and account.profile_id == transaction.profile_id:
                # Reverse old transaction
                if old_type == 'income':
                    account.balance -= old_amount
                else:
                    account.balance += old_amount
                # Apply new transaction
                if transaction.type == 'income':
                    account.balance += transaction.amount
                else:
                    account.balance -= transaction.amount
        
        db.session.commit()
        return jsonify(transaction.to_dict()), 200
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': 'Invalid date or amount format'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating transaction: {str(e)}")
        return jsonify({'error': 'Failed to update transaction'}), 500


@transactions_bp.route('/transactions/<int:transaction_id>', methods=['DELETE'])
@require_auth
def delete_transaction(transaction_id):
    """Delete a transaction."""
    user = get_current_user(User)
    
    try:
        # Optimized query with join to verify ownership
        transaction = db.session.query(Transaction).join(Profile).filter(
            Transaction.id == transaction_id,
            Profile.user_id == user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found or access denied'}), 404

        # Delete associated documents first (if CASCADE doesn't work)
        from core.models import TransactionDocument
        TransactionDocument.query.filter_by(transaction_id=transaction_id).delete()

        # Update account balance if account is specified
        if transaction.account_id:
            account = Account.query.get(transaction.account_id)
            if account:
                # Reverse the transaction
                if transaction.type == 'income':
                    account.balance -= transaction.amount
                else:
                    account.balance += transaction.amount

        db.session.delete(transaction)
        db.session.commit()

        current_app.logger.info(f"Transaction deleted: {transaction_id} (with documents) by user {user.id}")
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting transaction: {str(e)}")
        return jsonify({'error': 'Failed to delete transaction'}), 500
