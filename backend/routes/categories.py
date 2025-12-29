"""
Category management routes.
"""

from flask import Blueprint, request, jsonify
from flask import current_app

from core.database import db
from core.models import User, Profile, Category
from auth import require_auth, get_current_user, sanitize_input

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('/profiles/<int:profile_id>/categories', methods=['GET'])
@require_auth
def get_categories(profile_id):
    """Get all categories for a profile."""
    user = get_current_user(User)
    
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        categories = Category.query.filter_by(profile_id=profile_id).order_by(Category.name).all()
        return jsonify([cat.to_dict() for cat in categories]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching categories: {str(e)}")
        return jsonify({'error': 'Failed to fetch categories'}), 500


@categories_bp.route('/profiles/<int:profile_id>/categories', methods=['POST'])
@require_auth
def create_category(profile_id):
    """Create a new category."""
    user = get_current_user(User)
    
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        data = request.get_json()
        name = sanitize_input(data.get('name', ''))
        cat_type = data.get('type', 'expense')
        
        if not name or len(name) < 2:
            return jsonify({'error': 'Category name must be at least 2 characters'}), 400
        
        if cat_type not in ['income', 'expense']:
            return jsonify({'error': 'Type must be income or expense'}), 400
        
        # Check if category already exists
        existing = Category.query.filter_by(profile_id=profile_id, name=name, type=cat_type).first()
        if existing:
            return jsonify({'error': 'Category already exists'}), 400
        
        new_category = Category(
            profile_id=profile_id,
            name=name,
            type=cat_type,
            icon=data.get('icon', '📁'),
            color=data.get('color', '#6B7280'),
            is_default=data.get('is_default', False)
        )
        
        db.session.add(new_category)
        db.session.commit()
        
        current_app.logger.info(f"Category created: {name} for profile {profile_id}")
        return jsonify(new_category.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating category: {str(e)}")
        return jsonify({'error': 'Failed to create category'}), 500


@categories_bp.route('/categories/<int:category_id>', methods=['PUT'])
@require_auth
def update_category(category_id):
    """Update a category."""
    user = get_current_user(User)
    
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        profile = Profile.query.filter_by(id=category.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if 'name' in data:
            category.name = sanitize_input(data['name'])
        if 'icon' in data:
            category.icon = data['icon']
        if 'color' in data:
            category.color = data['color']
        
        db.session.commit()
        return jsonify(category.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating category: {str(e)}")
        return jsonify({'error': 'Failed to update category'}), 500


@categories_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@require_auth
def delete_category(category_id):
    """Delete a category."""
    user = get_current_user(User)
    
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        profile = Profile.query.filter_by(id=category.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(category)
        db.session.commit()
        
        current_app.logger.info(f"Category deleted: {category_id}")
        return jsonify({'message': 'Category deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting category: {str(e)}")
        return jsonify({'error': 'Failed to delete category'}), 500
