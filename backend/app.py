from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

app = Flask(__name__)

# Configuration from environment variables
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

# Database configuration - support both PostgreSQL and SQLite
database_url = os.environ.get('DATABASE_URL', 'sqlite:///finance_tracker.db')
# Handle Render's postgres:// URL format (SQLAlchemy needs postgresql://)
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# CORS configuration - allow multiple origins from environment variable
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001')
cors_origins_list = [origin.strip() for origin in cors_origins.split(',')]
CORS(app, supports_credentials=True, origins=cors_origins_list)

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
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
    profile_id = db.Column(db.Integer, db.ForeignKey('profiles.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'income' or 'expense'
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.Date, nullable=False)
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

# Helper function to check authentication
def require_auth():
    if 'user_id' not in session:
        return None
    return User.query.get(session['user_id'])

# Create tables
with app.app_context():
    db.create_all()

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400

        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400

        # Create new user
        password_hash = generate_password_hash(password)
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash
        )
        db.session.add(new_user)
        db.session.commit()

        # Set session
        session['user_id'] = new_user.id
        session.permanent = True

        return jsonify({
            'message': 'User created successfully',
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Missing username or password'}), 400

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid username or password'}), 401

        # Set session
        session['user_id'] = user.id
        session.permanent = True

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    user = require_auth()
    if user:
        return jsonify({
            'authenticated': True,
            'user': user.to_dict()
        }), 200
    else:
        return jsonify({'authenticated': False}), 200

# Profile Routes
@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    profiles = Profile.query.filter_by(user_id=user.id).all()
    return jsonify([profile.to_dict() for profile in profiles]), 200

@app.route('/api/profiles', methods=['POST'])
def create_profile():
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    try:
        data = request.get_json()
        name = data.get('name')

        if not name:
            return jsonify({'error': 'Profile name is required'}), 400

        new_profile = Profile(name=name, user_id=user.id)
        db.session.add(new_profile)
        db.session.commit()

        return jsonify(new_profile.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/profiles/<int:profile_id>', methods=['DELETE'])
def delete_profile(profile_id):
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    try:
        profile = Profile.query.get_or_404(profile_id)
        
        # Check if profile belongs to user
        if profile.user_id != user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(profile)
        db.session.commit()

        return jsonify({'message': 'Profile deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Transaction Routes
@app.route('/api/profiles/<int:profile_id>/transactions', methods=['GET'])
def get_transactions(profile_id):
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    try:
        profile = Profile.query.get_or_404(profile_id)
        
        # Check if profile belongs to user
        if profile.user_id != user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        transactions = Transaction.query.filter_by(profile_id=profile_id).all()
        return jsonify([transaction.to_dict() for transaction in transactions]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profiles/<int:profile_id>/transactions', methods=['POST'])
def create_transaction(profile_id):
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    try:
        profile = Profile.query.get_or_404(profile_id)
        
        # Check if profile belongs to user
        if profile.user_id != user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        transaction_type = data.get('type')
        amount = data.get('amount')
        category = data.get('category')
        description = data.get('description', '')
        date_str = data.get('date')

        if not transaction_type or not amount or not category or not date_str:
            return jsonify({'error': 'Missing required fields'}), 400

        if transaction_type not in ['income', 'expense']:
            return jsonify({'error': 'Type must be income or expense'}), 400

        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

        new_transaction = Transaction(
            profile_id=profile_id,
            type=transaction_type,
            amount=float(amount),
            category=category,
            description=description,
            date=date
        )
        db.session.add(new_transaction)
        db.session.commit()

        return jsonify(new_transaction.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    try:
        transaction = Transaction.query.get_or_404(transaction_id)
        profile = Profile.query.get(transaction.profile_id)
        
        # Check if transaction belongs to user's profile
        if not profile or profile.user_id != user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(transaction)
        db.session.commit()

        return jsonify({'message': 'Transaction deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Finance Tracker API',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'api_base': '/api'
        }
    }), 200

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)

