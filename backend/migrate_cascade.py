"""
Migration script to add CASCADE delete to transaction_documents foreign key
Run this once to update the existing database constraint
"""
from app import app, db
from sqlalchemy import text

def migrate():
    with app.app_context():
        try:
            print("🔄 Updating database constraint...")
            
            # Drop the existing foreign key constraint
            db.session.execute(text("""
                ALTER TABLE transaction_documents 
                DROP CONSTRAINT IF EXISTS transaction_documents_transaction_id_fkey;
            """))
            
            # Add the new constraint with CASCADE delete
            db.session.execute(text("""
                ALTER TABLE transaction_documents 
                ADD CONSTRAINT transaction_documents_transaction_id_fkey 
                FOREIGN KEY (transaction_id) 
                REFERENCES transactions(id) 
                ON DELETE CASCADE;
            """))
            
            db.session.commit()
            print("✅ Database constraint updated successfully!")
            print("   Documents will now be automatically deleted when parent transaction is deleted.")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error updating constraint: {str(e)}")
            print("   The constraint may already be correct or there might be data issues.")
            return False
        
        return True

if __name__ == "__main__":
    print("=" * 60)
    print("Finance Tracker - Database Migration")
    print("Adding CASCADE delete to transaction_documents")
    print("=" * 60)
    print()
    
    success = migrate()
    
    print()
    if success:
        print("✨ Migration completed successfully!")
    else:
        print("⚠️  Migration failed. Check the error above.")
    print()

