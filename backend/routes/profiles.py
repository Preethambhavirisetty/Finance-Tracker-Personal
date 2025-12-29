"""
Profile management routes.
"""

from flask import Blueprint, request, jsonify
from flask import current_app

from core.database import db
from core.models import User, Profile
from auth import require_auth, get_current_user, sanitize_input

profiles_bp = Blueprint('profiles', __name__)


@profiles_bp.route('/profiles', methods=['GET'])
@require_auth
def get_profiles():
    """Get all profiles for current user."""
    user = get_current_user(User)
    profiles = Profile.query.filter_by(user_id=user.id).order_by(Profile.created_at.desc()).all()
    return jsonify([profile.to_dict() for profile in profiles]), 200


@profiles_bp.route('/profiles', methods=['POST'])
@require_auth
def create_profile():
    """Create a new profile."""
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

        current_app.logger.info(f"Profile created: {name} for user {user.id}")
        return jsonify(new_profile.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating profile: {str(e)}")
        return jsonify({'error': 'Failed to create profile'}), 500


@profiles_bp.route('/profiles/<int:profile_id>', methods=['PUT'])
@require_auth
def update_profile(profile_id):
    """Update a profile."""
    user = get_current_user(User)
    
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found or access denied'}), 404
        
        data = request.get_json()
        name = sanitize_input(data.get('name', ''))
        
        if not name or len(name.strip()) == 0:
            return jsonify({'error': 'Profile name is required'}), 400
        
        if len(name) > 100:
            return jsonify({'error': 'Profile name is too long (max 100 characters)'}), 400
        
        profile.name = name
        db.session.commit()
        
        current_app.logger.info(f"Profile updated: {name} for user {user.id}")
        return jsonify(profile.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@profiles_bp.route('/profiles/<int:profile_id>', methods=['DELETE'])
@require_auth
def delete_profile(profile_id):
    """Delete a profile."""
    user = get_current_user(User)
    
    try:
        # Optimized query with ownership check
        profile = Profile.query.filter_by(id=profile_id, user_id=user.id).first()
        
        if not profile:
            return jsonify({'error': 'Profile not found or access denied'}), 404

        db.session.delete(profile)
        db.session.commit()

        current_app.logger.info(f"Profile deleted: {profile_id} by user {user.id}")
        return jsonify({'message': 'Profile deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting profile: {str(e)}")
        return jsonify({'error': 'Failed to delete profile'}), 500
