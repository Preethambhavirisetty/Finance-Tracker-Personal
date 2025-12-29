"""
Database models for Finance Tracker application.
"""

from datetime import datetime
from .database import db


# Association table for transaction tags (many-to-many)
transaction_tags = db.Table(
    'transaction_tags',
    db.Column('transaction_id', db.Integer, db.ForeignKey('transactions.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)


class User(db.Model):
    """User model for authentication and user management."""
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
    """Profile model for user financial profiles."""
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


class Category(db.Model):
    """Category model for transaction categorization."""
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profiles.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False, index=True)  # 'income' or 'expense'
    icon = db.Column(db.String(50), default='📁')
    color = db.Column(db.String(7), default='#6B7280')
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'name': self.name,
            'type': self.type,
            'icon': self.icon,
            'color': self.color,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat()
        }


class Tag(db.Model):
    """Tag model for transaction tagging."""
    __tablename__ = 'tags'
    
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profiles.id'), nullable=False, index=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), default='#3B82F6')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'name': self.name,
            'color': self.color,
            'created_at': self.created_at.isoformat()
        }


class Account(db.Model):
    """Account model for financial accounts."""
    __tablename__ = 'accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profiles.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'cash', 'bank', 'credit_card', 'investment'
    balance = db.Column(db.Float, default=0)
    currency = db.Column(db.String(3), default='USD')
    icon = db.Column(db.String(50), default='💰')
    color = db.Column(db.String(7), default='#10B981')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'name': self.name,
            'type': self.type,
            'balance': self.balance,
            'currency': self.currency,
            'icon': self.icon,
            'color': self.color,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Budget(db.Model):
    """Budget model for spending limits."""
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profiles.id'), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True, index=True)
    amount = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), default='monthly')  # 'monthly', 'yearly'
    month = db.Column(db.Integer, nullable=True)  # 1-12
    year = db.Column(db.Integer, nullable=False)
    alert_threshold = db.Column(db.Integer, default=80)  # Alert at 80% usage
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        spent = 0
        if self.category_id:
            # Calculate spent for this category
            category = Category.query.get(self.category_id)
            if category:
                query = Transaction.query.filter_by(
                    profile_id=self.profile_id,
                    category=category.name,
                    type='expense'
                )
                if self.month:
                    query = query.filter(
                        db.extract('month', Transaction.date) == self.month,
                        db.extract('year', Transaction.date) == self.year
                    )
                spent = sum(t.amount for t in query.all())
        else:
            # Total budget - all expenses
            query = Transaction.query.filter_by(
                profile_id=self.profile_id,
                type='expense'
            )
            if self.month:
                query = query.filter(
                    db.extract('month', Transaction.date) == self.month,
                    db.extract('year', Transaction.date) == self.year
                )
            spent = sum(t.amount for t in query.all())
            
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'category_id': self.category_id,
            'amount': self.amount,
            'spent': spent,
            'remaining': self.amount - spent,
            'percentage': (spent / self.amount * 100) if self.amount > 0 else 0,
            'period': self.period,
            'month': self.month,
            'year': self.year,
            'alert_threshold': self.alert_threshold,
            'is_exceeded': spent > self.amount,
            'is_warning': (spent / self.amount * 100) >= self.alert_threshold if self.amount > 0 else False,
            'created_at': self.created_at.isoformat()
        }


class Transaction(db.Model):
    """Transaction model for income and expenses."""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profiles.id'), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=True, index=True)
    type = db.Column(db.String(20), nullable=False, index=True)  # 'income' or 'expense'
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False, index=True)  # Kept for backward compatibility
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, nullable=False, index=True)  # Stores full date and time for each transaction
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    tags = db.relationship('Tag', secondary=transaction_tags, lazy='subquery', backref=db.backref('transactions', lazy=True))

    def to_dict(self):
        # Get documents for this transaction
        documents = TransactionDocument.query.filter_by(transaction_id=self.id).all()
        
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'category_id': self.category_id,
            'account_id': self.account_id,
            'type': self.type,
            'amount': self.amount,
            'category': self.category,
            'description': self.description,
            'date': self.date.isoformat(),
            'tags': [tag.to_dict() for tag in self.tags],
            'documents': [doc.to_dict() for doc in documents],
            'created_at': self.created_at.isoformat()
        }


class TransactionDocument(db.Model):
    """TransactionDocument model for storing receipts and proofs."""
    __tablename__ = 'transaction_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    file_data = db.Column(db.Text, nullable=False)  # Base64 encoded
    file_type = db.Column(db.String(50), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # in bytes
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'filename': self.filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'uploaded_at': self.uploaded_at.isoformat()
        }

