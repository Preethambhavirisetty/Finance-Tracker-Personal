# Authentication and Authorization Module
from functools import wraps
from flask import session, jsonify, request
from datetime import datetime, timedelta
import re
from collections import defaultdict
import time

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)
RATE_LIMIT_WINDOW = 300  # 5 minutes
MAX_LOGIN_ATTEMPTS = 5

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """Validate username format"""
    if not username or len(username) < 3 or len(username) > 80:
        return False, "Username must be between 3 and 80 characters"
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Username can only contain letters, numbers, underscores, and hyphens"
    
    return True, None

def validate_password(password):
    """Validate password strength"""
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    
    # Check for at least one uppercase, one lowercase, and one number
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, None

def check_rate_limit(identifier, max_attempts=MAX_LOGIN_ATTEMPTS, window=RATE_LIMIT_WINDOW):
    """
    Simple rate limiting implementation
    In production, use Redis or similar
    """
    current_time = time.time()
    
    # Clean old entries
    rate_limit_storage[identifier] = [
        timestamp for timestamp in rate_limit_storage[identifier]
        if current_time - timestamp < window
    ]
    
    # Check if rate limit exceeded
    if len(rate_limit_storage[identifier]) >= max_attempts:
        oldest_attempt = rate_limit_storage[identifier][0]
        retry_after = int(window - (current_time - oldest_attempt))
        return False, retry_after
    
    # Record this attempt
    rate_limit_storage[identifier].append(current_time)
    return True, 0

def require_auth(f):
    """
    Decorator to require authentication for a route
    Usage: @require_auth
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Check session timeout (30 minutes of inactivity)
        if 'last_activity' in session:
            last_activity = datetime.fromisoformat(session['last_activity'])
            if datetime.utcnow() - last_activity > timedelta(minutes=30):
                session.clear()
                return jsonify({'error': 'Session expired'}), 401
        
        # Update last activity
        session['last_activity'] = datetime.utcnow().isoformat()
        
        return f(*args, **kwargs)
    return decorated_function

def get_current_user(User):
    """
    Get the current authenticated user
    Returns None if not authenticated
    """
    if 'user_id' not in session:
        return None
    
    user = User.query.get(session['user_id'])
    return user

def require_profile_ownership(Profile):
    """
    Decorator to check if the user owns the profile
    Expects profile_id in route parameters
    """
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            profile_id = kwargs.get('profile_id')
            if not profile_id:
                return jsonify({'error': 'Profile ID required'}), 400
            
            from flask import g
            User = g.User  # Get User model from app context
            
            user = get_current_user(User)
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Use join to optimize query
            profile = Profile.query.filter_by(
                id=profile_id,
                user_id=user.id
            ).first()
            
            if not profile:
                return jsonify({'error': 'Profile not found or access denied'}), 404
            
            # Store profile in kwargs for the route to use
            kwargs['profile'] = profile
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_transaction_ownership(Transaction, Profile):
    """
    Decorator to check if the user owns the transaction
    Expects transaction_id in route parameters
    """
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            transaction_id = kwargs.get('transaction_id')
            if not transaction_id:
                return jsonify({'error': 'Transaction ID required'}), 400
            
            from flask import g
            User = g.User  # Get User model from app context
            
            user = get_current_user(User)
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Optimized query with join
            transaction = Transaction.query.join(Profile).filter(
                Transaction.id == transaction_id,
                Profile.user_id == user.id
            ).first()
            
            if not transaction:
                return jsonify({'error': 'Transaction not found or access denied'}), 404
            
            # Store transaction in kwargs for the route to use
            kwargs['transaction'] = transaction
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def sanitize_input(data):
    """
    Sanitize user input to prevent XSS and injection attacks
    """
    if isinstance(data, str):
        # Remove potentially dangerous characters
        return data.strip()
    return data

def validate_transaction_data(data):
    """
    Validate transaction data
    """
    errors = []
    
    transaction_type = data.get('type')
    if not transaction_type or transaction_type not in ['income', 'expense']:
        errors.append('Type must be either "income" or "expense"')
    
    amount = data.get('amount')
    try:
        amount_float = float(amount)
        if amount_float <= 0:
            errors.append('Amount must be greater than 0')
        if amount_float > 999999999:
            errors.append('Amount is too large')
    except (TypeError, ValueError):
        errors.append('Invalid amount format')
    
    category = data.get('category')
    if not category or len(category.strip()) == 0:
        errors.append('Category is required')
    elif len(category) > 100:
        errors.append('Category is too long (max 100 characters)')
    
    date_str = data.get('date')
    if not date_str:
        errors.append('Date is required')
    
    description = data.get('description', '')
    if len(description) > 500:
        errors.append('Description is too long (max 500 characters)')
    
    return errors

def create_session(user_id):
    """
    Create a new session for the user
    """
    session.clear()
    session['user_id'] = user_id
    session['last_activity'] = datetime.utcnow().isoformat()
    session['created_at'] = datetime.utcnow().isoformat()
    session.permanent = True

