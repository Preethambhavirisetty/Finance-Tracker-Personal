"""
Authentication routes (register, login, logout, check-auth).
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app

from core.database import db
from core.models import User
from auth import (
    require_auth,
    get_current_user,
    validate_email,
    validate_username,
    validate_password,
    check_rate_limit,
    sanitize_input,
    create_session
)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = sanitize_input(data.get('username', ''))
        email = sanitize_input(data.get('email', ''))
        password = data.get('password', '')

        # Validate username
        is_valid, error_msg = validate_username(username)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Validate email
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        # Validate password strength
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Check rate limiting (by IP)
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        allowed, retry_after = check_rate_limit(f"register:{client_ip}", max_attempts=10, window=3600)
        if not allowed:
            return jsonify({
                'error': f'Too many registration attempts. Please try again in {retry_after} seconds'
            }), 429

        # Check if user already exists
        if User.query.filter_by(username=username).first():
            current_app.logger.warning(f"Registration attempt with existing username: {username}")
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            current_app.logger.warning(f"Registration attempt with existing email: {email}")
            return jsonify({'error': 'Email already exists'}), 400

        # Create new user
        password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            last_login=datetime.utcnow()
        )
        db.session.add(new_user)
        db.session.commit()

        # Create session
        create_session(new_user.id)
        
        current_app.logger.info(f"New user registered: {username} (ID: {new_user.id})")

        return jsonify({
            'message': 'User created successfully',
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed. Please try again'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = sanitize_input(data.get('username', ''))
        password = data.get('password', '')

        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400

        # Rate limiting by IP and username
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        allowed, retry_after = check_rate_limit(f"login:{client_ip}:{username}")
        if not allowed:
            current_app.logger.warning(f"Rate limit exceeded for login attempt: {username} from {client_ip}")
            return jsonify({
                'error': f'Too many login attempts. Please try again in {retry_after} seconds'
            }), 429

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password_hash, password):
            current_app.logger.warning(f"Failed login attempt for username: {username}")
            # Generic error message to prevent username enumeration
            return jsonify({'error': 'Invalid credentials'}), 401

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Create session
        create_session(user.id)
        
        current_app.logger.info(f"User logged in: {username} (ID: {user.id})")

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed. Please try again'}), 500


@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """Logout user."""
    user_id = session.get('user_id')
    session.clear()
    current_app.logger.info(f"User logged out (ID: {user_id})")
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/check-auth', methods=['GET'])
def check_auth():
    """Check authentication status."""
    user = get_current_user(User)
    if user:
        # Check session timeout
        if 'last_activity' in session:
            last_activity = datetime.fromisoformat(session['last_activity'])
            if datetime.utcnow() - last_activity > timedelta(minutes=30):
                session.clear()
                return jsonify({'authenticated': False}), 200
        
        # Update last activity
        session['last_activity'] = datetime.utcnow().isoformat()
        
        return jsonify({
            'authenticated': True,
            'user': user.to_dict()
        }), 200
    else:
        return jsonify({'authenticated': False}), 200
