"""
Core module for Finance Tracker application.
Contains configuration, database setup, and models.
"""

from .config import Config
from .database import db, init_db
from .models import (
    User,
    Profile,
    Category,
    Tag,
    Account,
    Budget,
    Transaction,
    TransactionDocument,
    transaction_tags
)

__all__ = [
    'Config',
    'db',
    'init_db',
    'User',
    'Profile',
    'Category',
    'Tag',
    'Account',
    'Budget',
    'Transaction',
    'TransactionDocument',
    'transaction_tags',
]

