from flask import Flask, request, jsonify, session, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import logging
from cryptography.fernet import Fernet
from auth import (
    require_auth,
    get_current_user,
    validate_email,
    validate_username,
    validate_password,
    check_rate_limit,
    sanitize_input,
    validate_transaction_data,
    create_session,
)

try:
    from plaid_service import (
        create_link_token,
        exchange_public_token,
        fetch_plaid_accounts,
        remove_plaid_item,
        sync_transactions as plaid_sync_transactions,
        map_plaid_account_type,
        map_plaid_category,
    )

    PLAID_AVAILABLE = True
except ImportError:
    PLAID_AVAILABLE = False

app = Flask(__name__)
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
if (
    os.environ.get("FLASK_ENV") == "production"
    and SECRET_KEY == "your-secret-key-change-in-production"
):
    raise RuntimeError("SECRET_KEY must be configured in production")

app.config["SECRET_KEY"] = SECRET_KEY
database_url = os.environ.get("DATABASE_URL", "sqlite:///finance_tracker.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = (
    os.environ.get("SESSION_COOKIE_SECURE", "False").lower() == "true"
)
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)
cors_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,https://finance-tracker-personal-d9ec.vercel.app",
)
cors_origins_list = [origin.strip() for origin in cors_origins.split(",")]
CORS(
    app,
    supports_credentials=True,
    origins=cors_origins_list,
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)

db = SQLAlchemy(app)
_ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY", "")
_fernet = Fernet(_ENCRYPTION_KEY.encode()) if _ENCRYPTION_KEY else None


def encrypt_value(value: str) -> str:
    if not _fernet:
        raise RuntimeError("ENCRYPTION_KEY not configured")
    return _fernet.encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    if not _fernet:
        raise RuntimeError("ENCRYPTION_KEY not configured")
    return _fernet.decrypt(value.encode()).decode()


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }


class Profile(db.Model):
    __tablename__ = "profiles"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("profiles", lazy=True))
    transactions = db.relationship(
        "Transaction", backref="profile", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "user_id": self.user_id,
            "createdAt": self.created_at.isoformat(),
        }


class Category(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(
        db.Integer, db.ForeignKey("profiles.id"), nullable=False, index=True
    )
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False, index=True)  # 'income' or 'expense'
    icon = db.Column(db.String(50), default="📁")
    color = db.Column(db.String(7), default="#6B7280")
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "name": self.name,
            "type": self.type,
            "icon": self.icon,
            "color": self.color,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat(),
        }


class Tag(db.Model):
    __tablename__ = "tags"
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(
        db.Integer, db.ForeignKey("profiles.id"), nullable=False, index=True
    )
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), default="#3B82F6")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "name": self.name,
            "color": self.color,
            "created_at": self.created_at.isoformat(),
        }


class Account(db.Model):
    __tablename__ = "accounts"
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(
        db.Integer, db.ForeignKey("profiles.id"), nullable=False, index=True
    )
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(
        db.String(50), nullable=False
    )  # 'cash', 'bank', 'credit_card', 'investment'
    balance = db.Column(db.Float, default=0)
    currency = db.Column(db.String(3), default="USD")
    icon = db.Column(db.String(50), default="💰")
    color = db.Column(db.String(7), default="#10B981")
    is_active = db.Column(db.Boolean, default=True)
    plaid_account_id = db.Column(db.String(255), nullable=True, unique=True, index=True)
    plaid_item_id = db.Column(
        db.Integer, db.ForeignKey("plaid_items.id"), nullable=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "name": self.name,
            "type": self.type,
            "balance": self.balance,
            "currency": self.currency,
            "icon": self.icon,
            "color": self.color,
            "is_active": self.is_active,
            "plaid_account_id": self.plaid_account_id,
            "plaid_item_id": self.plaid_item_id,
            "created_at": self.created_at.isoformat(),
        }


class Budget(db.Model):
    __tablename__ = "budgets"
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(
        db.Integer, db.ForeignKey("profiles.id"), nullable=False, index=True
    )
    category_id = db.Column(
        db.Integer, db.ForeignKey("categories.id"), nullable=True, index=True
    )
    amount = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), default="monthly")  # 'monthly', 'yearly'
    month = db.Column(db.Integer, nullable=True)  # 1-12
    year = db.Column(db.Integer, nullable=False)
    alert_threshold = db.Column(db.Integer, default=80)  # Alert at 80% usage
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        spent = 0
        if self.category_id:
            category = Category.query.get(self.category_id)
            if category:
                query = Transaction.query.filter_by(
                    profile_id=self.profile_id, category=category.name, type="expense"
                )
                if self.month:
                    query = query.filter(
                        db.extract("month", Transaction.date) == self.month,
                        db.extract("year", Transaction.date) == self.year,
                    )
                spent = sum(t.amount for t in query.all())
        else:
            query = Transaction.query.filter_by(
                profile_id=self.profile_id, type="expense"
            )
            if self.month:
                query = query.filter(
                    db.extract("month", Transaction.date) == self.month,
                    db.extract("year", Transaction.date) == self.year,
                )
            spent = sum(t.amount for t in query.all())

        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "category_id": self.category_id,
            "amount": self.amount,
            "spent": spent,
            "remaining": self.amount - spent,
            "percentage": (spent / self.amount * 100) if self.amount > 0 else 0,
            "period": self.period,
            "month": self.month,
            "year": self.year,
            "alert_threshold": self.alert_threshold,
            "is_exceeded": spent > self.amount,
            "is_warning": (
                (spent / self.amount * 100) >= self.alert_threshold
                if self.amount > 0
                else False
            ),
            "created_at": self.created_at.isoformat(),
        }


transaction_tags = db.Table(
    "transaction_tags",
    db.Column(
        "transaction_id", db.Integer, db.ForeignKey("transactions.id"), primary_key=True
    ),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id"), primary_key=True),
)


class Transaction(db.Model):
    __tablename__ = "transactions"
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(
        db.Integer, db.ForeignKey("profiles.id"), nullable=False, index=True
    )
    category_id = db.Column(
        db.Integer, db.ForeignKey("categories.id"), nullable=True, index=True
    )
    account_id = db.Column(
        db.Integer, db.ForeignKey("accounts.id"), nullable=True, index=True
    )
    type = db.Column(db.String(20), nullable=False, index=True)  # 'income' or 'expense'
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(
        db.String(100), nullable=False, index=True
    )  # Kept for backward compatibility
    description = db.Column(db.Text)
    date = db.Column(db.Date, nullable=False, index=True)
    plaid_transaction_id = db.Column(
        db.String(255), nullable=True, unique=True, index=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tags = db.relationship(
        "Tag",
        secondary=transaction_tags,
        lazy="subquery",
        backref=db.backref("transactions", lazy=True),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "category_id": self.category_id,
            "account_id": self.account_id,
            "type": self.type,
            "amount": self.amount,
            "category": self.category,
            "description": self.description,
            "date": self.date.isoformat(),
            "plaid_transaction_id": self.plaid_transaction_id,
            "tags": [tag.to_dict() for tag in self.tags],
            "created_at": self.created_at.isoformat(),
        }


class PlaidItem(db.Model):
    __tablename__ = "plaid_items"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    profile_id = db.Column(
        db.Integer, db.ForeignKey("profiles.id"), nullable=False, index=True
    )
    access_token_enc = db.Column(db.Text, nullable=False)
    item_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    institution_id = db.Column(db.String(255))
    institution_name = db.Column(db.String(255))
    cursor = db.Column(db.Text)
    last_synced_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "item_id": self.item_id,
            "institution_id": self.institution_id,
            "institution_name": self.institution_name,
            "last_synced_at": (
                self.last_synced_at.isoformat() if self.last_synced_at else None
            ),
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }


@app.before_request
def before_request():
    g.User = User
    g.Profile = Profile
    g.Transaction = Transaction


@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if os.environ.get("FLASK_ENV") == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
    return response


with app.app_context():
    try:
        db.create_all()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.info(f"Database initialization: {str(e)}")
    from sqlalchemy import text as _text

    _col_migrations = [
        "ALTER TABLE accounts ADD COLUMN plaid_account_id VARCHAR(255)",
        "ALTER TABLE accounts ADD COLUMN plaid_item_id INTEGER",
        "ALTER TABLE transactions ADD COLUMN plaid_transaction_id VARCHAR(255)",
    ]
    for _sql in _col_migrations:
        try:
            db.session.execute(_text(_sql))
            db.session.commit()
        except Exception:
            db.session.rollback()


@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        username = sanitize_input(data.get("username", ""))
        email = sanitize_input(data.get("email", ""))
        password = data.get("password", "")
        is_valid, error_msg = validate_username(username)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        allowed, retry_after = check_rate_limit(
            f"register:{client_ip}", max_attempts=10, window=3600
        )
        if not allowed:
            return (
                jsonify(
                    {
                        "error": f"Too many registration attempts. Please try again in {retry_after} seconds"
                    }
                ),
                429,
            )
        if User.query.filter_by(username=username).first():
            logger.warning(f"Registration attempt with existing username: {username}")
            return jsonify({"error": "Username already exists"}), 400

        if User.query.filter_by(email=email).first():
            logger.warning(f"Registration attempt with existing email: {email}")
            return jsonify({"error": "Email already exists"}), 400
        password_hash = generate_password_hash(password, method="pbkdf2:sha256")
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            last_login=datetime.utcnow(),
        )
        db.session.add(new_user)
        db.session.commit()
        create_session(new_user.id)

        logger.info(f"New user registered: {username} (ID: {new_user.id})")

        return (
            jsonify(
                {"message": "User created successfully", "user": new_user.to_dict()}
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({"error": "Registration failed. Please try again"}), 500


@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        username = sanitize_input(data.get("username", ""))
        password = data.get("password", "")

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        allowed, retry_after = check_rate_limit(f"login:{client_ip}:{username}")
        if not allowed:
            logger.warning(
                f"Rate limit exceeded for login attempt: {username} from {client_ip}"
            )
            return (
                jsonify(
                    {
                        "error": f"Too many login attempts. Please try again in {retry_after} seconds"
                    }
                ),
                429,
            )

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password_hash, password):
            logger.warning(f"Failed login attempt for username: {username}")
            return jsonify({"error": "Invalid credentials"}), 401
        user.last_login = datetime.utcnow()
        db.session.commit()
        create_session(user.id)

        logger.info(f"User logged in: {username} (ID: {user.id})")

        return jsonify({"message": "Login successful", "user": user.to_dict()}), 200
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed. Please try again"}), 500


@app.route("/api/logout", methods=["POST"])
@require_auth
def logout():
    user_id = session.get("user_id")
    session.clear()
    logger.info(f"User logged out (ID: {user_id})")
    return jsonify({"message": "Logout successful"}), 200


@app.route("/api/check-auth", methods=["GET"])
def check_auth():
    user = get_current_user(User)
    if user:
        if "last_activity" in session:
            last_activity = datetime.fromisoformat(session["last_activity"])
            if datetime.utcnow() - last_activity > timedelta(minutes=30):
                session.clear()
                return jsonify({"authenticated": False}), 200
        session["last_activity"] = datetime.utcnow().isoformat()

        return jsonify({"authenticated": True, "user": user.to_dict()}), 200
    else:
        return jsonify({"authenticated": False}), 200


@app.route("/api/profiles", methods=["GET"])
@require_auth
def get_profiles():
    user = get_current_user(User)
    profiles = (
        Profile.query.filter_by(user_id=user.id)
        .order_by(Profile.created_at.desc())
        .all()
    )
    return jsonify([profile.to_dict() for profile in profiles]), 200


@app.route("/api/profiles", methods=["POST"])
@require_auth
def create_profile():
    user = get_current_user(User)

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        name = sanitize_input(data.get("name", ""))

        if not name or len(name.strip()) == 0:
            return jsonify({"error": "Profile name is required"}), 400

        if len(name) > 100:
            return (
                jsonify({"error": "Profile name is too long (max 100 characters)"}),
                400,
            )

        new_profile = Profile(name=name, user_id=user.id)
        db.session.add(new_profile)
        db.session.commit()

        logger.info(f"Profile created: {name} for user {user.id}")
        return jsonify(new_profile.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating profile: {str(e)}")
        return jsonify({"error": "Failed to create profile"}), 500


@app.route("/api/profiles/<int:profile_id>", methods=["DELETE"])
@require_auth
def delete_profile(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()

        if not profile:
            return jsonify({"error": "Profile not found or access denied"}), 404

        db.session.delete(profile)
        db.session.commit()

        logger.info(f"Profile deleted: {profile_id} by user {user.id}")
        return jsonify({"message": "Profile deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting profile: {str(e)}")
        return jsonify({"error": "Failed to delete profile"}), 500


@app.route("/api/profiles/<int:profile_id>/transactions", methods=["GET"])
@require_auth
def get_transactions(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found or access denied"}), 404
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")

        query = Transaction.query.filter_by(profile_id=profile_id)

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                query = query.filter(Transaction.date >= start_date)
            except ValueError:
                pass

        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
                query = query.filter(Transaction.date <= end_date)
            except ValueError:
                pass

        transactions = query.order_by(
            Transaction.date.desc(), Transaction.created_at.desc()
        ).all()

        return jsonify([transaction.to_dict() for transaction in transactions]), 200
    except Exception as e:
        logger.error(f"Error fetching transactions: {str(e)}")
        return jsonify({"error": "Failed to fetch transactions"}), 500


@app.route("/api/profiles/<int:profile_id>/transactions", methods=["POST"])
@require_auth
def create_transaction(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found or access denied"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        validation_errors = validate_transaction_data(data)
        if validation_errors:
            return jsonify({"error": validation_errors[0]}), 400

        transaction_type = sanitize_input(data.get("type"))
        amount = float(data.get("amount"))
        category = sanitize_input(data.get("category"))
        description = sanitize_input(data.get("description", ""))
        date_str = data.get("date")

        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        new_transaction = Transaction(
            profile_id=profile_id,
            type=transaction_type,
            amount=amount,
            category=category,
            description=description,
            date=date,
            category_id=data.get("category_id"),
            account_id=data.get("account_id"),
        )
        tag_ids = data.get("tag_ids", [])
        if tag_ids:
            tags = Tag.query.filter(
                Tag.id.in_(tag_ids), Tag.profile_id == profile_id
            ).all()
            new_transaction.tags = tags

        db.session.add(new_transaction)
        if new_transaction.account_id:
            account = Account.query.get(new_transaction.account_id)
            if account and account.profile_id == profile_id:
                if transaction_type == "income":
                    account.balance += amount
                else:
                    account.balance -= amount

        db.session.commit()

        logger.info(
            f"Transaction created: {transaction_type} ${amount} for profile {profile_id}"
        )
        return jsonify(new_transaction.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": "Invalid amount format"}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating transaction: {str(e)}")
        return jsonify({"error": "Failed to create transaction"}), 500


@app.route("/api/transactions/<int:transaction_id>", methods=["DELETE"])
@require_auth
def delete_transaction(transaction_id):
    user = get_current_user(User)

    try:
        transaction = (
            db.session.query(Transaction)
            .join(Profile)
            .filter(Transaction.id == transaction_id, Profile.user_id == user.id)
            .first()
        )

        if not transaction:
            return jsonify({"error": "Transaction not found or access denied"}), 404
        if transaction.account_id:
            account = Account.query.get(transaction.account_id)
            if account:
                if transaction.type == "income":
                    account.balance -= transaction.amount
                else:
                    account.balance += transaction.amount

        db.session.delete(transaction)
        db.session.commit()

        logger.info(f"Transaction deleted: {transaction_id} by user {user.id}")
        return jsonify({"message": "Transaction deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting transaction: {str(e)}")
        return jsonify({"error": "Failed to delete transaction"}), 500


@app.route("/api/transactions/<int:transaction_id>", methods=["PUT"])
@require_auth
def update_transaction(transaction_id):
    user = get_current_user(User)

    try:
        transaction = (
            db.session.query(Transaction)
            .join(Profile)
            .filter(Transaction.id == transaction_id, Profile.user_id == user.id)
            .first()
        )

        if not transaction:
            return jsonify({"error": "Transaction not found or access denied"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        old_amount = transaction.amount
        old_type = transaction.type
        old_account_id = transaction.account_id

        if "type" in data:
            new_type = data["type"]
            if new_type not in ["income", "expense"]:
                return jsonify({"error": "Type must be income or expense"}), 400
            transaction.type = new_type
        if "amount" in data:
            transaction.amount = float(data["amount"])
        if "category" in data:
            transaction.category = sanitize_input(data["category"])
        if "category_id" in data:
            transaction.category_id = data["category_id"]
        if "description" in data:
            transaction.description = sanitize_input(data.get("description", ""))
        if "date" in data:
            try:
                transaction.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        new_amount = transaction.amount
        new_type = transaction.type
        new_account_id = data.get("account_id", old_account_id)
        if old_account_id:
            old_account = Account.query.get(old_account_id)
            if old_account:
                if old_type == "income":
                    old_account.balance -= old_amount
                else:
                    old_account.balance += old_amount
        transaction.account_id = new_account_id
        if new_account_id:
            new_account = Account.query.get(new_account_id)
            if new_account and new_account.profile_id == transaction.profile_id:
                if new_type == "income":
                    new_account.balance += new_amount
                else:
                    new_account.balance -= new_amount

        if "tag_ids" in data:
            tag_ids = data["tag_ids"]
            tags = Tag.query.filter(
                Tag.id.in_(tag_ids), Tag.profile_id == transaction.profile_id
            ).all()
            transaction.tags = tags

        db.session.commit()
        logger.info(f"Transaction updated: {transaction_id} by user {user.id}")
        return jsonify(transaction.to_dict()), 200
    except ValueError:
        return jsonify({"error": "Invalid amount format"}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating transaction: {str(e)}")
        return jsonify({"error": "Failed to update transaction"}), 500


@app.route("/", methods=["GET"])
def root():
    return (
        jsonify(
            {
                "message": "Finance Tracker API",
                "status": "running",
                "version": "2.0.0",
                "endpoints": {
                    "health": "/api/health",
                    "api_base": "/api",
                    "docs": "/api/docs",
                },
            }
        ),
        200,
    )


@app.route("/api/health", methods=["GET"])
def health():
    try:
        from sqlalchemy import text

        db.session.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        db_status = "disconnected"

    return (
        jsonify(
            {
                "status": "ok" if db_status == "connected" else "degraded",
                "database": db_status,
                "version": "2.0.0",
            }
        ),
        200,
    )


@app.route("/api/docs", methods=["GET"])
def api_docs():
    return (
        jsonify(
            {
                "version": "2.0.0",
                "endpoints": {
                    "auth": {
                        "POST /api/register": "Register a new user",
                        "POST /api/login": "Login user",
                        "POST /api/logout": "Logout user (requires auth)",
                        "GET /api/check-auth": "Check authentication status",
                    },
                    "profiles": {
                        "GET /api/profiles": "Get all profiles for current user (requires auth)",
                        "POST /api/profiles": "Create new profile (requires auth)",
                        "DELETE /api/profiles/<id>": "Delete profile (requires auth)",
                    },
                    "transactions": {
                        "GET /api/profiles/<id>/transactions": "Get all transactions for profile (requires auth)",
                        "POST /api/profiles/<id>/transactions": "Create new transaction (requires auth)",
                        "DELETE /api/transactions/<id>": "Delete transaction (requires auth)",
                    },
                },
            }
        ),
        200,
    )


@app.route("/api/profiles/<int:profile_id>/categories", methods=["GET"])
@require_auth
def get_categories(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        categories = (
            Category.query.filter_by(profile_id=profile_id)
            .order_by(Category.name)
            .all()
        )
        return jsonify([cat.to_dict() for cat in categories]), 200
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return jsonify({"error": "Failed to fetch categories"}), 500


@app.route("/api/profiles/<int:profile_id>/categories", methods=["POST"])
@require_auth
def create_category(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        data = request.get_json()
        name = sanitize_input(data.get("name", ""))
        cat_type = data.get("type", "expense")

        if not name or len(name) < 2:
            return (
                jsonify({"error": "Category name must be at least 2 characters"}),
                400,
            )

        if cat_type not in ["income", "expense"]:
            return jsonify({"error": "Type must be income or expense"}), 400
        existing = Category.query.filter_by(
            profile_id=profile_id, name=name, type=cat_type
        ).first()
        if existing:
            return jsonify({"error": "Category already exists"}), 400

        new_category = Category(
            profile_id=profile_id,
            name=name,
            type=cat_type,
            icon=data.get("icon", "📁"),
            color=data.get("color", "#6B7280"),
            is_default=data.get("is_default", False),
        )

        db.session.add(new_category)
        db.session.commit()

        logger.info(f"Category created: {name} for profile {profile_id}")
        return jsonify(new_category.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating category: {str(e)}")
        return jsonify({"error": "Failed to create category"}), 500


@app.route("/api/categories/<int:category_id>", methods=["PUT"])
@require_auth
def update_category(category_id):
    user = get_current_user(User)

    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({"error": "Category not found"}), 404

        profile = Profile.query.filter_by(
            id=category.profile_id, user_id=user.id
        ).first()
        if not profile:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()

        if "name" in data:
            category.name = sanitize_input(data["name"])
        if "icon" in data:
            category.icon = data["icon"]
        if "color" in data:
            category.color = data["color"]

        db.session.commit()
        return jsonify(category.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating category: {str(e)}")
        return jsonify({"error": "Failed to update category"}), 500


@app.route("/api/categories/<int:category_id>", methods=["DELETE"])
@require_auth
def delete_category(category_id):
    user = get_current_user(User)

    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({"error": "Category not found"}), 404

        profile = Profile.query.filter_by(
            id=category.profile_id, user_id=user.id
        ).first()
        if not profile:
            return jsonify({"error": "Unauthorized"}), 403

        db.session.delete(category)
        db.session.commit()

        logger.info(f"Category deleted: {category_id}")
        return jsonify({"message": "Category deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting category: {str(e)}")
        return jsonify({"error": "Failed to delete category"}), 500


@app.route("/api/profiles/<int:profile_id>/tags", methods=["GET"])
@require_auth
def get_tags(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        tags = Tag.query.filter_by(profile_id=profile_id).order_by(Tag.name).all()
        return jsonify([tag.to_dict() for tag in tags]), 200
    except Exception as e:
        logger.error(f"Error fetching tags: {str(e)}")
        return jsonify({"error": "Failed to fetch tags"}), 500


@app.route("/api/profiles/<int:profile_id>/tags", methods=["POST"])
@require_auth
def create_tag(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        data = request.get_json()
        name = sanitize_input(data.get("name", ""))

        if not name or len(name) < 2:
            return jsonify({"error": "Tag name must be at least 2 characters"}), 400
        existing = Tag.query.filter_by(profile_id=profile_id, name=name).first()
        if existing:
            return jsonify({"error": "Tag already exists"}), 400

        new_tag = Tag(
            profile_id=profile_id, name=name, color=data.get("color", "#3B82F6")
        )

        db.session.add(new_tag)
        db.session.commit()

        logger.info(f"Tag created: {name} for profile {profile_id}")
        return jsonify(new_tag.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating tag: {str(e)}")
        return jsonify({"error": "Failed to create tag"}), 500


@app.route("/api/tags/<int:tag_id>", methods=["DELETE"])
@require_auth
def delete_tag(tag_id):
    user = get_current_user(User)

    try:
        tag = Tag.query.get(tag_id)
        if not tag:
            return jsonify({"error": "Tag not found"}), 404

        profile = Profile.query.filter_by(id=tag.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Unauthorized"}), 403

        db.session.delete(tag)
        db.session.commit()

        logger.info(f"Tag deleted: {tag_id}")
        return jsonify({"message": "Tag deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting tag: {str(e)}")
        return jsonify({"error": "Failed to delete tag"}), 500


@app.route("/api/profiles/<int:profile_id>/accounts", methods=["GET"])
@require_auth
def get_accounts(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        accounts = (
            Account.query.filter_by(profile_id=profile_id).order_by(Account.name).all()
        )
        return jsonify([acc.to_dict() for acc in accounts]), 200
    except Exception as e:
        logger.error(f"Error fetching accounts: {str(e)}")
        return jsonify({"error": "Failed to fetch accounts"}), 500


@app.route("/api/profiles/<int:profile_id>/accounts", methods=["POST"])
@require_auth
def create_account(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        data = request.get_json()
        name = sanitize_input(data.get("name", ""))
        acc_type = data.get("type", "cash")

        if not name or len(name) < 2:
            return jsonify({"error": "Account name must be at least 2 characters"}), 400

        if acc_type not in [
            "cash",
            "bank",
            "credit_card",
            "investment",
            "savings",
            "other",
        ]:
            return jsonify({"error": "Invalid account type"}), 400

        new_account = Account(
            profile_id=profile_id,
            name=name,
            type=acc_type,
            balance=float(data.get("balance", 0)),
            currency=data.get("currency", "USD"),
            icon=data.get("icon", "💰"),
            color=data.get("color", "#10B981"),
        )

        db.session.add(new_account)
        db.session.commit()

        logger.info(f"Account created: {name} for profile {profile_id}")
        return jsonify(new_account.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating account: {str(e)}")
        return jsonify({"error": "Failed to create account"}), 500


@app.route("/api/accounts/<int:account_id>", methods=["PUT"])
@require_auth
def update_account(account_id):
    user = get_current_user(User)

    try:
        account = Account.query.get(account_id)
        if not account:
            return jsonify({"error": "Account not found"}), 404

        profile = Profile.query.filter_by(
            id=account.profile_id, user_id=user.id
        ).first()
        if not profile:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()

        if "name" in data:
            account.name = sanitize_input(data["name"])
        if "balance" in data:
            account.balance = float(data["balance"])
        if "icon" in data:
            account.icon = data["icon"]
        if "color" in data:
            account.color = data["color"]
        if "is_active" in data:
            account.is_active = data["is_active"]

        db.session.commit()
        return jsonify(account.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating account: {str(e)}")
        return jsonify({"error": "Failed to update account"}), 500


@app.route("/api/accounts/<int:account_id>", methods=["DELETE"])
@require_auth
def delete_account(account_id):
    user = get_current_user(User)

    try:
        account = Account.query.get(account_id)
        if not account:
            return jsonify({"error": "Account not found"}), 404

        profile = Profile.query.filter_by(
            id=account.profile_id, user_id=user.id
        ).first()
        if not profile:
            return jsonify({"error": "Unauthorized"}), 403

        db.session.delete(account)
        db.session.commit()

        logger.info(f"Account deleted: {account_id}")
        return jsonify({"message": "Account deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting account: {str(e)}")
        return jsonify({"error": "Failed to delete account"}), 500


@app.route("/api/profiles/<int:profile_id>/budgets", methods=["GET"])
@require_auth
def get_budgets(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        from datetime import datetime as dt

        month = request.args.get("month", dt.now().month, type=int)
        year = request.args.get("year", dt.now().year, type=int)

        budgets = Budget.query.filter_by(
            profile_id=profile_id, month=month, year=year
        ).all()

        return jsonify([budget.to_dict() for budget in budgets]), 200
    except Exception as e:
        logger.error(f"Error fetching budgets: {str(e)}")
        return jsonify({"error": "Failed to fetch budgets"}), 500


@app.route("/api/profiles/<int:profile_id>/budgets", methods=["POST"])
@require_auth
def create_budget(profile_id):
    user = get_current_user(User)

    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        data = request.get_json()
        amount = float(data.get("amount", 0))

        if amount <= 0:
            return jsonify({"error": "Budget amount must be greater than 0"}), 400

        from datetime import datetime as dt

        month = data.get("month", dt.now().month)
        year = data.get("year", dt.now().year)
        existing = Budget.query.filter_by(
            profile_id=profile_id,
            category_id=data.get("category_id"),
            month=month,
            year=year,
        ).first()

        if existing:
            return jsonify({"error": "Budget already exists for this period"}), 400

        new_budget = Budget(
            profile_id=profile_id,
            category_id=data.get("category_id"),
            amount=amount,
            period=data.get("period", "monthly"),
            month=month,
            year=year,
            alert_threshold=data.get("alert_threshold", 80),
        )

        db.session.add(new_budget)
        db.session.commit()

        logger.info(f"Budget created for profile {profile_id}, amount: {amount}")
        return jsonify(new_budget.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating budget: {str(e)}")
        return jsonify({"error": "Failed to create budget"}), 500


@app.route("/api/budgets/<int:budget_id>", methods=["PUT"])
@require_auth
def update_budget(budget_id):
    user = get_current_user(User)

    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({"error": "Budget not found"}), 404

        profile = Profile.query.filter_by(id=budget.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()

        if "amount" in data:
            budget.amount = float(data["amount"])
        if "alert_threshold" in data:
            budget.alert_threshold = int(data["alert_threshold"])

        db.session.commit()
        return jsonify(budget.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating budget: {str(e)}")
        return jsonify({"error": "Failed to update budget"}), 500


@app.route("/api/budgets/<int:budget_id>", methods=["DELETE"])
@require_auth
def delete_budget(budget_id):
    user = get_current_user(User)

    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({"error": "Budget not found"}), 404

        profile = Profile.query.filter_by(id=budget.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({"error": "Unauthorized"}), 403

        db.session.delete(budget)
        db.session.commit()

        logger.info(f"Budget deleted: {budget_id}")
        return jsonify({"message": "Budget deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting budget: {str(e)}")
        return jsonify({"error": "Failed to delete budget"}), 500


def _get_or_create_category(profile_id, cat_info, tx_type):
    cat = Category.query.filter_by(profile_id=profile_id, name=cat_info["name"]).first()
    if not cat:
        cat = Category(
            profile_id=profile_id,
            name=cat_info["name"],
            type=tx_type,
            icon=cat_info["icon"],
            color=cat_info["color"],
            is_default=True,
        )
        db.session.add(cat)
        db.session.flush()
    return cat


def _import_plaid_transaction(profile_id, account_id, tx):
    plaid_tx_id = (
        tx.get("transaction_id")
        if isinstance(tx, dict)
        else getattr(tx, "transaction_id", None)
    )
    existing = Transaction.query.filter_by(plaid_transaction_id=plaid_tx_id).first()

    amount_raw = tx.get("amount") if isinstance(tx, dict) else getattr(tx, "amount", 0)
    tx_type = "income" if float(amount_raw) < 0 else "expense"
    amount = abs(float(amount_raw))

    pfc = (
        tx.get("personal_finance_category")
        if isinstance(tx, dict)
        else getattr(tx, "personal_finance_category", None)
    )
    cat_info = map_plaid_category(pfc, tx_type)
    category = _get_or_create_category(profile_id, cat_info, tx_type)

    date_val = tx.get("date") if isinstance(tx, dict) else getattr(tx, "date", None)
    if isinstance(date_val, str):
        from datetime import date as _date

        date_val = _date.fromisoformat(date_val)

    name = tx.get("name", "") if isinstance(tx, dict) else getattr(tx, "name", "")

    if existing:
        existing.amount = amount
        existing.type = tx_type
        existing.category = category.name
        existing.category_id = category.id
        existing.date = date_val
        existing.description = name
        return existing, False

    new_tx = Transaction(
        profile_id=profile_id,
        account_id=account_id,
        type=tx_type,
        amount=amount,
        category=category.name,
        category_id=category.id,
        description=name,
        date=date_val,
        plaid_transaction_id=plaid_tx_id,
    )
    db.session.add(new_tx)
    return new_tx, True


def _sync_transactions_for_item(item):
    access_token = decrypt_value(item.access_token_enc)
    cursor = item.cursor
    has_more = True
    total_added = 0

    while has_more:
        added, modified, removed, next_cursor, has_more = plaid_sync_transactions(
            access_token, cursor
        )
        cursor = next_cursor

        for tx in added:
            plaid_acct_id = (
                tx.get("account_id")
                if isinstance(tx, dict)
                else getattr(tx, "account_id", None)
            )
            account = Account.query.filter_by(plaid_account_id=plaid_acct_id).first()
            if not account:
                continue
            _, is_new = _import_plaid_transaction(item.profile_id, account.id, tx)
            if is_new:
                total_added += 1

        for tx in modified:
            plaid_acct_id = (
                tx.get("account_id")
                if isinstance(tx, dict)
                else getattr(tx, "account_id", None)
            )
            account = Account.query.filter_by(plaid_account_id=plaid_acct_id).first()
            if account:
                _import_plaid_transaction(item.profile_id, account.id, tx)

        for tx in removed:
            plaid_tx_id = (
                tx.get("transaction_id")
                if isinstance(tx, dict)
                else getattr(tx, "transaction_id", None)
            )
            existing = Transaction.query.filter_by(
                plaid_transaction_id=plaid_tx_id
            ).first()
            if existing:
                db.session.delete(existing)

    item.cursor = cursor
    item.last_synced_at = datetime.utcnow()
    db.session.commit()
    return total_added


@app.route("/api/plaid/create-link-token", methods=["POST"])
@require_auth
def create_plaid_link_token():
    if not PLAID_AVAILABLE:
        return jsonify({"error": "Plaid not configured"}), 503
    user = get_current_user(User)
    try:
        link_token = create_link_token(user.id)
        return jsonify({"link_token": link_token}), 200
    except RuntimeError as e:
        logger.error(f"Plaid link token configuration error: {str(e)}")
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        logger.error(f"Plaid link token error: {str(e)}")
        return jsonify({"error": "Failed to create Plaid link token"}), 500


@app.route("/api/plaid/exchange-token", methods=["POST"])
@require_auth
def plaid_exchange_token():
    if not PLAID_AVAILABLE:
        return jsonify({"error": "Plaid not configured"}), 503
    user = get_current_user(User)
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    profile_id = data.get("profile_id")
    public_token = data.get("public_token")
    metadata = data.get("metadata", {})

    if not profile_id or not public_token:
        return jsonify({"error": "profile_id and public_token are required"}), 400

    profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
    if not profile:
        return jsonify({"error": "Profile not found or access denied"}), 404

    try:
        access_token, item_id = exchange_public_token(public_token)
        existing_item = PlaidItem.query.filter_by(item_id=item_id).first()
        if existing_item:
            existing_item.access_token_enc = encrypt_value(access_token)
            existing_item.is_active = True
            item = existing_item
        else:
            institution_id = (
                metadata.get("institution", {}).get("institution_id")
                if metadata
                else None
            )
            institution_name = (
                metadata.get("institution", {}).get("name") if metadata else None
            )
            item = PlaidItem(
                user_id=user.id,
                profile_id=profile_id,
                access_token_enc=encrypt_value(access_token),
                item_id=item_id,
                institution_id=institution_id,
                institution_name=institution_name,
            )
            db.session.add(item)
            db.session.flush()
        plaid_accounts = fetch_plaid_accounts(access_token)
        accounts_synced = 0
        for pa in plaid_accounts:
            pa_id = (
                pa.get("account_id")
                if isinstance(pa, dict)
                else getattr(pa, "account_id", None)
            )
            pa_name = (
                pa.get("name")
                if isinstance(pa, dict)
                else getattr(pa, "name", "Account")
            )
            pa_type = (
                pa.get("type")
                if isinstance(pa, dict)
                else getattr(pa, "type", "depository")
            )
            pa_subtype = (
                pa.get("subtype")
                if isinstance(pa, dict)
                else getattr(pa, "subtype", None)
            )
            pa_balance = (
                pa.get("balances", {}).get("current", 0)
                if isinstance(pa, dict)
                else getattr(getattr(pa, "balances", None), "current", 0) or 0
            )

            our_type, icon, color = map_plaid_account_type(
                str(pa_type), str(pa_subtype) if pa_subtype else None
            )

            existing_acct = Account.query.filter_by(plaid_account_id=pa_id).first()
            if existing_acct:
                existing_acct.balance = pa_balance or 0
                existing_acct.plaid_item_id = item.id
            else:
                new_acct = Account(
                    profile_id=profile_id,
                    name=pa_name,
                    type=our_type,
                    balance=pa_balance or 0,
                    currency="USD",
                    icon=icon,
                    color=color,
                    plaid_account_id=pa_id,
                    plaid_item_id=item.id,
                )
                db.session.add(new_acct)
            accounts_synced += 1

        db.session.commit()
        transactions_added = _sync_transactions_for_item(item)

        logger.info(
            f"Plaid item linked: {institution_name if not existing_item else item.institution_name}, "
            f"{accounts_synced} accounts, {transactions_added} transactions for profile {profile_id}"
        )
        return (
            jsonify(
                {
                    "item": item.to_dict(),
                    "accounts_synced": accounts_synced,
                    "transactions_added": transactions_added,
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Plaid exchange token error: {str(e)}")
        return jsonify({"error": "Failed to link bank account"}), 500


@app.route("/api/profiles/<int:profile_id>/plaid/items", methods=["GET"])
@require_auth
def get_plaid_items(profile_id):
    user = get_current_user(User)
    profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
    if not profile:
        return jsonify({"error": "Profile not found or access denied"}), 404
    items = PlaidItem.query.filter_by(profile_id=profile_id, is_active=True).all()
    return jsonify([item.to_dict() for item in items]), 200


@app.route("/api/plaid/items/<int:item_id>/sync", methods=["POST"])
@require_auth
def sync_plaid_item(item_id):
    if not PLAID_AVAILABLE:
        return jsonify({"error": "Plaid not configured"}), 503
    user = get_current_user(User)
    item = (
        db.session.query(PlaidItem)
        .join(Profile)
        .filter(PlaidItem.id == item_id, Profile.user_id == user.id)
        .first()
    )
    if not item:
        return jsonify({"error": "Plaid item not found or access denied"}), 404
    try:
        transactions_added = _sync_transactions_for_item(item)
        return (
            jsonify({"transactions_added": transactions_added, "item": item.to_dict()}),
            200,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Plaid sync error for item {item_id}: {str(e)}")
        return jsonify({"error": "Sync failed"}), 500


@app.route("/api/plaid/items/<int:item_id>", methods=["DELETE"])
@require_auth
def disconnect_plaid_item(item_id):
    if not PLAID_AVAILABLE:
        return jsonify({"error": "Plaid not configured"}), 503
    user = get_current_user(User)
    item = (
        db.session.query(PlaidItem)
        .join(Profile)
        .filter(PlaidItem.id == item_id, Profile.user_id == user.id)
        .first()
    )
    if not item:
        return jsonify({"error": "Plaid item not found or access denied"}), 404
    try:
        access_token = decrypt_value(item.access_token_enc)
        try:
            remove_plaid_item(access_token)
        except Exception:
            pass  # Plaid side may already be removed; proceed with local cleanup
        Account.query.filter_by(plaid_item_id=item.id).update(
            {"plaid_account_id": None, "plaid_item_id": None}
        )
        item.is_active = False
        db.session.commit()
        logger.info(f"Plaid item {item_id} disconnected by user {user.id}")
        return jsonify({"message": "Bank account disconnected successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Plaid disconnect error: {str(e)}")
        return jsonify({"error": "Failed to disconnect bank account"}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV") != "production"
    app.run(debug=debug, host="0.0.0.0", port=port)
