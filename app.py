import os
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables (for local testing, but Render handles this)
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests (good for APIs)

# Database configuration
# Render provides DATABASE_URL automatically
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    # Render uses 'postgres://' but SQLAlchemy requires 'postgresql://'
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///sovswift.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

db = SQLAlchemy(app)

# ============================================
# DATABASE MODELS
# ============================================

class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'message': self.message,
            'created_at': self.created_at.isoformat()
        }

class BlogPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# Create tables (Render handles this automatically, but safe to include)
with app.app_context():
    db.create_all()

# ============================================
# PAGE ROUTES
# ============================================

@app.route('/')
def home():
    # Pass a simple visitor count to the template (just for show)
    # In production, you'd use Redis or a DB counter.
    visitor_count = ContactMessage.query.count() + BlogPost.query.count() + 100
    return render_template('index.html', visitor_count=visitor_count)

# ============================================
# API ROUTES (RESTful)
# ============================================

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """Fetch all blog posts (latest first)"""
    posts = BlogPost.query.order_by(BlogPost.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    """Save contact message to database"""
    data = request.get_json()
    
    # Basic validation
    if not data or not data.get('name') or not data.get('email') or not data.get('message'):
        return jsonify({'error': 'Name, email, and message are required'}), 400
    
    try:
        new_message = ContactMessage(
            name=data['name'].strip(),
            email=data['email'].strip(),
            message=data['message'].strip()
        )
        db.session.add(new_message)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Thank you for reaching out!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error. Please try again.'}), 500

# Admin Dashboard (Bonus Feature)
@app.route('/admin')
def admin_dashboard():
    """Simple admin view - password protected via Render Env Var"""
    # In production, use proper authentication (Flask-Login, etc.)
    # For this demo, we just show a simple message
    return '''
    <h1>SovSwift Admin</h1>
    <p>Set the ADMIN_PASSWORD environment variable on Render to secure this.</p>
    <p>To view messages, you need to build a proper admin panel.</p>
    '''

# ============================================
# RUN THE APP
# ============================================

if __name__ == '__main__':
    # For local testing only
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
