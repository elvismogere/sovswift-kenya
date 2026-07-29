import os
from datetime import datetime
from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash, render_template_string
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///sovswift.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
app.config['ADMIN_PASSWORD'] = os.environ.get('ADMIN_PASSWORD', 'DCP_Admin_2027_Kenya')

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

with app.app_context():
    db.create_all()

# ============================================
# ROUTES
# ============================================

@app.route('/')
def home():
    visitor_count = ContactMessage.query.count() + BlogPost.query.count() + 100
    return render_template('index.html', visitor_count=visitor_count)

@app.route('/api/posts', methods=['GET'])
def get_posts():
    posts = BlogPost.query.order_by(BlogPost.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email') or not data.get('message'):
        return jsonify({'error': 'All fields required'}), 400
    try:
        new_msg = ContactMessage(
            name=data['name'].strip(),
            email=data['email'].strip(),
            message=data['message'].strip()
        )
        db.session.add(new_msg)
        db.session.commit()
        return jsonify({'success': True}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

# ============================================
# ADMIN ROUTES (FIXED)
# ============================================

ADMIN_LOGIN_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login - SovSwift</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 1rem;
        }
        .login-box {
            background: white;
            padding: 2.5rem 2rem;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.12);
            width: 100%;
            max-width: 380px;
            text-align: center;
        }
        .login-box h1 {
            color: #1a4d2e;
            font-size: 2rem;
            margin-bottom: 0.25rem;
        }
        .login-box .subtitle {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
        }
        .login-box input {
            width: 100%;
            padding: 0.8rem 1rem;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 1rem;
            margin-bottom: 1rem;
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
            transition: border-color 0.3s;
        }
        .login-box input:focus {
            outline: none;
            border-color: #1a4d2e;
        }
        .login-box button {
            background: #1a4d2e;
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 50px;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
            font-size: 1rem;
            font-family: 'Inter', sans-serif;
            transition: background 0.3s;
        }
        .login-box button:hover {
            background: #0f3a22;
        }
        .flash-error {
            color: #b71c1c;
            background: #fde8e8;
            padding: 0.6rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }
        .flash-success {
            color: #155724;
            background: #d4edda;
            padding: 0.6rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }
        .logo-icon {
            font-size: 2.5rem;
            color: #1a4d2e;
            margin-bottom: 0.5rem;
        }
        .footer-note {
            margin-top: 1.5rem;
            font-size: 0.7rem;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="login-box">
        <div class="logo-icon"><i class="fas fa-lock"></i></div>
        <h1>SovSwift</h1>
        <p class="subtitle">Admin Access</p>
        {% with messages = get_flashed_messages(with_categories=true) %}
            {% for category, message in messages %}
                <div class="flash-{{ category }}">{{ message }}</div>
            {% endfor %}
        {% endwith %}
        <form method="POST">
            <input type="password" name="password" placeholder="Enter admin password" required autofocus>
            <button type="submit"><i class="fas fa-sign-in-alt"></i> Login</button>
        </form>
        <div class="footer-note">DCP • 2027</div>
    </div>
</body>
</html>
'''

@app.route('/admin', methods=['GET', 'POST'])
def admin_login():
    if session.get('logged_in'):
        return redirect(url_for('admin_dashboard'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        if password == app.config['ADMIN_PASSWORD']:
            session['logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid password. Please try again.', 'error')
    
    return render_template_string(ADMIN_LOGIN_TEMPLATE)

@app.route('/admin/dashboard')
def admin_dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('admin_login'))
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    posts = BlogPost.query.order_by(BlogPost.created_at.desc()).all()
    return render_template('admin.html', messages=messages, posts=posts)

@app.route('/admin/posts', methods=['POST'])
def create_post():
    if not session.get('logged_in'):
        return redirect(url_for('admin_login'))
    title = request.form.get('title')
    content = request.form.get('content')
    if title and content:
        new_post = BlogPost(title=title, content=content)
        db.session.add(new_post)
        db.session.commit()
        flash('Post published successfully!', 'success')
    else:
        flash('Title and content required.', 'error')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/posts/delete/<int:post_id>', methods=['POST'])
def delete_post(post_id):
    if not session.get('logged_in'):
        return redirect(url_for('admin_login'))
    post = BlogPost.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    flash('Post deleted.', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/logout')
def admin_logout():
    session.clear()
    flash('Logged out successfully.', 'success')
    return redirect(url_for('admin_login'))

# ============================================
# RUN
# ============================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
