from collections import defaultdict
from datetime import datetime, timedelta
from functools import wraps
import re
import time

from flask import jsonify, session

rate_limit_storage = defaultdict(list)
RATE_LIMIT_WINDOW = 300
MAX_LOGIN_ATTEMPTS = 5


def validate_email(email):
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_username(username):
    if not username or len(username) < 3 or len(username) > 80:
        return False, "Username must be between 3 and 80 characters"

    if not re.match(r"^[a-zA-Z0-9_-]+$", username):
        return (
            False,
            "Username can only contain letters, numbers, underscores, and hyphens",
        )

    return True, None


def validate_password(password):
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if len(password) > 128:
        return False, "Password must be less than 128 characters"

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"

    return True, None


def check_rate_limit(
    identifier, max_attempts=MAX_LOGIN_ATTEMPTS, window=RATE_LIMIT_WINDOW
):
    current_time = time.time()
    rate_limit_storage[identifier] = [
        timestamp
        for timestamp in rate_limit_storage[identifier]
        if current_time - timestamp < window
    ]

    if len(rate_limit_storage[identifier]) >= max_attempts:
        oldest_attempt = rate_limit_storage[identifier][0]
        retry_after = int(window - (current_time - oldest_attempt))
        return False, retry_after

    rate_limit_storage[identifier].append(current_time)
    return True, 0


def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401

        if "last_activity" in session:
            last_activity = datetime.fromisoformat(session["last_activity"])
            if datetime.utcnow() - last_activity > timedelta(minutes=30):
                session.clear()
                return jsonify({"error": "Session expired"}), 401

        session["last_activity"] = datetime.utcnow().isoformat()
        return f(*args, **kwargs)

    return decorated_function


def get_current_user(User):
    if "user_id" not in session:
        return None

    return User.query.get(session["user_id"])


def require_profile_ownership(Profile):
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            profile_id = kwargs.get("profile_id")
            if not profile_id:
                return jsonify({"error": "Profile ID required"}), 400

            from flask import g

            user = get_current_user(g.User)
            if not user:
                return jsonify({"error": "Authentication required"}), 401

            profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
            if not profile:
                return jsonify({"error": "Profile not found or access denied"}), 404

            kwargs["profile"] = profile
            return f(*args, **kwargs)

        return decorated_function

    return decorator


def require_transaction_ownership(Transaction, Profile):
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            transaction_id = kwargs.get("transaction_id")
            if not transaction_id:
                return jsonify({"error": "Transaction ID required"}), 400

            from flask import g

            user = get_current_user(g.User)
            if not user:
                return jsonify({"error": "Authentication required"}), 401

            transaction = (
                Transaction.query.join(Profile)
                .filter(Transaction.id == transaction_id, Profile.user_id == user.id)
                .first()
            )
            if not transaction:
                return jsonify({"error": "Transaction not found or access denied"}), 404

            kwargs["transaction"] = transaction
            return f(*args, **kwargs)

        return decorated_function

    return decorator


def sanitize_input(data):
    return data.strip() if isinstance(data, str) else data


def validate_transaction_data(data):
    errors = []

    transaction_type = data.get("type")
    if transaction_type not in ["income", "expense"]:
        errors.append('Type must be either "income" or "expense"')

    try:
        amount = float(data.get("amount"))
        if amount <= 0:
            errors.append("Amount must be greater than 0")
        if amount > 999999999:
            errors.append("Amount is too large")
    except (TypeError, ValueError):
        errors.append("Invalid amount format")

    category = data.get("category")
    if not category or len(category.strip()) == 0:
        errors.append("Category is required")
    elif len(category) > 100:
        errors.append("Category is too long (max 100 characters)")

    if not data.get("date"):
        errors.append("Date is required")

    if len(data.get("description", "")) > 500:
        errors.append("Description is too long (max 500 characters)")

    return errors


def create_session(user_id):
    session.clear()
    session["user_id"] = user_id
    session["last_activity"] = datetime.utcnow().isoformat()
    session["created_at"] = datetime.utcnow().isoformat()
    session.permanent = True
