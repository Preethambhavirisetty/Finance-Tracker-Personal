"""
Document management routes.
"""

from flask import Blueprint, request, jsonify
import base64
from werkzeug.utils import secure_filename
from flask import current_app

from core.database import db
from core.models import User, Profile, Transaction, TransactionDocument
from auth import require_auth, get_current_user

documents_bp = Blueprint('documents', __name__)


@documents_bp.route('/transactions/<int:transaction_id>/documents', methods=['POST'])
@require_auth
def upload_document(transaction_id):
    """Upload a document for a transaction."""
    user = get_current_user(User)
    
    try:
        # Verify transaction ownership
        transaction = db.session.query(Transaction).join(Profile).filter(
            Transaction.id == transaction_id,
            Profile.user_id == user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        data = request.get_json()
        if not data or not data.get('file_data') or not data.get('filename'):
            return jsonify({'error': 'File data and filename required'}), 400
        
        file_data = data.get('file_data')
        filename = secure_filename(data.get('filename'))
        file_type = data.get('file_type', 'application/octet-stream')
        
        # Validate file_data format (must be base64 data URI)
        if not file_data.startswith('data:'):
            return jsonify({'error': 'Invalid file data format'}), 400
        
        # Validate filename
        if not filename or len(filename) > 255:
            return jsonify({'error': 'Invalid filename'}), 400
        
        # Validate file type (allow only safe types)
        allowed_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if file_type not in allowed_types:
            return jsonify({'error': f'File type not allowed. Allowed types: images, PDF, DOC, DOCX'}), 400
        
        try:
            # Extract base64 data and decode to validate
            base64_data = file_data.split(',')[1] if ',' in file_data else file_data
            decoded_data = base64.b64decode(base64_data)
            file_size = len(decoded_data)
        except Exception:
            return jsonify({'error': 'Invalid base64 data'}), 400
        
        # Check file size (3MB max)
        max_size = 3 * 1024 * 1024  # 3MB in bytes
        if file_size > max_size:
            return jsonify({'error': f'File too large. Maximum size is 3MB. Your file: {file_size / (1024*1024):.2f}MB'}), 400
        
        if file_size == 0:
            return jsonify({'error': 'File is empty'}), 400
        
        # Check if user already has too many documents for this transaction (limit to 5)
        existing_docs = TransactionDocument.query.filter_by(transaction_id=transaction_id).count()
        if existing_docs >= 5:
            return jsonify({'error': 'Maximum 5 documents per transaction'}), 400
        
        # Create document record
        document = TransactionDocument(
            transaction_id=transaction_id,
            filename=filename,
            file_data=file_data,
            file_type=file_type,
            file_size=file_size
        )
        
        db.session.add(document)
        db.session.commit()
        
        current_app.logger.info(f"Document uploaded: {filename} ({file_size} bytes) for transaction {transaction_id} by user {user.id}")
        return jsonify(document.to_dict()), 201
    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f"Validation error uploading document: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error uploading document: {str(e)}")
        return jsonify({'error': 'Failed to upload document'}), 500


@documents_bp.route('/documents/<int:document_id>/data', methods=['GET'])
@require_auth
def get_document_data(document_id):
    """Get document data."""
    user = get_current_user(User)
    
    try:
        # Verify document ownership through transaction
        document = db.session.query(TransactionDocument).join(Transaction).join(Profile).filter(
            TransactionDocument.id == document_id,
            Profile.user_id == user.id
        ).first()
        
        if not document:
            return jsonify({'error': 'Document not found or access denied'}), 404
        
        # Validate file_data before sending
        if not document.file_data or not document.file_data.startswith('data:'):
            current_app.logger.error(f"Invalid file data for document {document_id}")
            return jsonify({'error': 'Document data is corrupted'}), 500
        
        current_app.logger.info(f"Document accessed: {document.filename} by user {user.id}")
        
        return jsonify({
            'id': document.id,
            'filename': document.filename,
            'file_data': document.file_data,
            'file_type': document.file_type,
            'file_size': document.file_size
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching document {document_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch document'}), 500


@documents_bp.route('/documents/<int:document_id>', methods=['DELETE'])
@require_auth
def delete_document(document_id):
    """Delete a document."""
    user = get_current_user(User)
    
    try:
        # Verify document ownership through transaction
        document = db.session.query(TransactionDocument).join(Transaction).join(Profile).filter(
            TransactionDocument.id == document_id,
            Profile.user_id == user.id
        ).first()
        
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        db.session.delete(document)
        db.session.commit()
        
        current_app.logger.info(f"Document deleted: {document_id}")
        return jsonify({'message': 'Document deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting document: {str(e)}")
        return jsonify({'error': 'Failed to delete document'}), 500

