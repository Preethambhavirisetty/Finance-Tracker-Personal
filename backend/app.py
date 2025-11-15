from flask import Flask, request, jsonify, session, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import logging

# Import authentication utilities
from auth import (
    require_auth, 
    get_current_user, 
    validate_email, 
    validate_username, 
    validate_password,
    check_rate_limit,
    sanitize_input,
    validate_transaction_data,
    create_session
)

app = Flask(__name__)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment variables
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

# Database configuration - support both PostgreSQL and SQLite
database_url = os.environ.get('DATABASE_URL', 'sqlite:///finance_tracker.db')
# Handle Render's postgres:// URL format (SQLAlchemy needs postgresql://)
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Session configuration
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
# Only use secure cookies if explicitly enabled (requires HTTPS)
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# CORS configuration - allow multiple origins from environment variable
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,https://finance-tracker-personal-d9ec.vercel.app')
cors_origins_list = [origin.strip() for origin in cors_origins.split(',')]
CORS(app, 
     supports_credentials=True, 
     origins=cors_origins_list,
     allow_headers=['Content-Type', 'Authorization'],
     expose_headers=['Content-Type'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('profiles', lazy=True))
    transactions = db.relationship('Transaction', backref='profile', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'user_id': self.user_id,
            'createdAt': self.created_at.isoformat()
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profiles.id'), nullable=False, index=True)
    type = db.Column(db.String(20), nullable=False, index=True)  # 'income' or 'expense'
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    date = db.Column(db.Date, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'type': self.type,
            'amount': self.amount,
            'category': self.category,
            'description': self.description,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat()
        }

# Make models available to auth decorators
@app.before_request
def before_request():
    g.User = User
    g.Profile = Profile
    g.Transaction = Transaction

# Create tables (only if they don't exist)
with app.app_context():
    try:
        db.create_all()
        logger.info("Database tables created successfully")
    except Exception as e:
        # Tables might already exist, which is fine
        logger.info(f"Database initialization: {str(e)}")
        pass

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
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
            logger.warning(f"Registration attempt with existing username: {username}")
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            logger.warning(f"Registration attempt with existing email: {email}")
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
        
        logger.info(f"New user registered: {username} (ID: {new_user.id})")

        return jsonify({
            'message': 'User created successfully',
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed. Please try again'}), 500

@app.route('/api/login', methods=['POST'])
def login():
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
            logger.warning(f"Rate limit exceeded for login attempt: {username} from {client_ip}")
            return jsonify({
                'error': f'Too many login attempts. Please try again in {retry_after} seconds'
            }), 429

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password_hash, password):
            logger.warning(f"Failed login attempt for username: {username}")
            # Generic error message to prevent username enumeration
            return jsonify({'error': 'Invalid credentials'}), 401

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Create session
        create_session(user.id)
        
        logger.info(f"User logged in: {username} (ID: {user.id})")

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed. Please try again'}), 500

@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    user_id = session.get('user_id')
    session.clear()
    logger.info(f"User logged out (ID: {user_id})")
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
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

# Profile Routes
@app.route('/api/profiles', methods=['GET'])
@require_auth
def get_profiles():
    user = get_current_user(User)
    profiles = Profile.query.filter_by(user_id=user.id).order_by(Profile.created_at.desc()).all()
    return jsonify([profile.to_dict() for profile in profiles]), 200

@app.route('/api/profiles', methods=['POST'])
@require_auth
def create_profile():
    user = get_current_user(User)
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = sanitize_input(data.get('name', ''))

        if not name or len(name.strip()) == 0:
            return jsonify({'error': 'Profile name is required'}), 400
        
        if len(name) > 100:
            return jsonify({'error': 'Profile name is too long (max 100 characters)'}), 400

        new_profile = Profile(name=name, user_id=user.id)
        db.session.add(new_profile)
        db.session.commit()

        logger.info(f"Profile created: {name} for user {user.id}")
        return jsonify(new_profile.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating profile: {str(e)}")
        return jsonify({'error': 'Failed to create profile'}), 500

@app.route('/api/profiles/<int:profile_id>', methods=['DELETE'])
@require_auth
def delete_profile(profile_id):
    user = get_current_user(User)
    
    try:
        # Optimized query with ownership check
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        
        if not profile:
            return jsonify({'error': 'Profile not found or access denied'}), 404

        db.session.delete(profile)
        db.session.commit()

        logger.info(f"Profile deleted: {profile_id} by user {user.id}")
        return jsonify({'message': 'Profile deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting profile: {str(e)}")
        return jsonify({'error': 'Failed to delete profile'}), 500

# Transaction Routes
@app.route('/api/profiles/<int:profile_id>/transactions', methods=['GET'])
@require_auth
def get_transactions(profile_id):
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
        logger.error(f"Error fetching transactions: {str(e)}")
        return jsonify({'error': 'Failed to fetch transactions'}), 500

@app.route('/api/profiles/<int:profile_id>/transactions', methods=['POST'])
@require_auth
def create_transaction(profile_id):
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
            date=date
        )
        db.session.add(new_transaction)
        db.session.commit()

        logger.info(f"Transaction created: {transaction_type} ${amount} for profile {profile_id}")
        return jsonify(new_transaction.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': 'Invalid amount format'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating transaction: {str(e)}")
        return jsonify({'error': 'Failed to create transaction'}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
@require_auth
def delete_transaction(transaction_id):
    user = get_current_user(User)
    
    try:
        # Optimized query with join to verify ownership
        transaction = db.session.query(Transaction).join(Profile).filter(
            Transaction.id == transaction_id,
            Profile.user_id == user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found or access denied'}), 404

        db.session.delete(transaction)
        db.session.commit()

        logger.info(f"Transaction deleted: {transaction_id} by user {user.id}")
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting transaction: {str(e)}")
        return jsonify({'error': 'Failed to delete transaction'}), 500

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Finance Tracker API',
        'status': 'running',
        'version': '2.0.0',
        'endpoints': {
            'health': '/api/health',
            'api_base': '/api',
            'docs': '/api/docs'
        }
    }), 200

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health():
    try:
        # Check database connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        db_status = 'connected'
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        db_status = 'disconnected'
    
    return jsonify({
        'status': 'ok' if db_status == 'connected' else 'degraded',
        'database': db_status,
        'version': '2.0.0'
    }), 200

# API Documentation endpoint
@app.route('/api/docs', methods=['GET'])
def api_docs():
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

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)
