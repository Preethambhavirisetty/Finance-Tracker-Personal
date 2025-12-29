"""
Tag management routes.
"""

from flask import Blueprint, request, jsonify
from flask import current_app

from core.database import db
from core.models import User, Profile, Tag
from auth import require_auth, get_current_user, sanitize_input

tags_bp = Blueprint('tags', __name__)


@tags_bp.route('/profiles/<int:profile_id>/tags', methods=['GET'])
@require_auth
def get_tags(profile_id):
    """Get all tags for a profile."""
    user = get_current_user(User)
    
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        tags = Tag.query.filter_by(profile_id=profile_id).order_by(Tag.name).all()
        return jsonify([tag.to_dict() for tag in tags]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching tags: {str(e)}")
        return jsonify({'error': 'Failed to fetch tags'}), 500


@tags_bp.route('/profiles/<int:profile_id>/tags', methods=['POST'])
@require_auth
def create_tag(profile_id):
    """Create a new tag."""
    user = get_current_user(User)
    
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        data = request.get_json()
        name = sanitize_input(data.get('name', ''))
        
        if not name or len(name) < 2:
            return jsonify({'error': 'Tag name must be at least 2 characters'}), 400
        
        # Check if tag already exists
        existing = Tag.query.filter_by(profile_id=profile_id, name=name).first()
        if existing:
            return jsonify({'error': 'Tag already exists'}), 400
        
        new_tag = Tag(
            profile_id=profile_id,
            name=name,
            color=data.get('color', '#3B82F6')
        )
        
        db.session.add(new_tag)
        db.session.commit()
        
        current_app.logger.info(f"Tag created: {name} for profile {profile_id}")
        return jsonify(new_tag.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating tag: {str(e)}")
        return jsonify({'error': 'Failed to create tag'}), 500


@tags_bp.route('/tags/<int:tag_id>', methods=['DELETE'])
@require_auth
def delete_tag(tag_id):
    """Delete a tag."""
    user = get_current_user(User)
    
    try:
        tag = Tag.query.get(tag_id)
        if not tag:
            return jsonify({'error': 'Tag not found'}), 404
        
        profile = Profile.query.filter_by(id=tag.profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(tag)
        db.session.commit()
        
        current_app.logger.info(f"Tag deleted: {tag_id}")
        return jsonify({'message': 'Tag deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting tag: {str(e)}")
        return jsonify({'error': 'Failed to delete tag'}), 500
