from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from functools import wraps
from datetime import datetime

app = Flask(__name__)
# Using a more secure way to fetch the secret key for production
app.secret_key = os.environ.get('SECRET_KEY', 'helpdesk-pro-secure-key-2026')

# ---------- Database Setup ----------
# Using the local directory to mimic your localhost setup
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_DIR = os.path.join(BASE_DIR, 'data')
DB_PATH = os.path.join(DB_DIR, 'helpdesk.db')

def get_db():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'employee',
            full_name TEXT NOT NULL DEFAULT 'User'
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'General',
            status TEXT NOT NULL DEFAULT 'Open',
            priority TEXT NOT NULL DEFAULT 'Medium',
            created_by INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
    ''')

    # Seed default users if they don't exist
    existing = conn.execute("SELECT id FROM users WHERE username='admin'").fetchone()
    if not existing:
        conn.execute(
            "INSERT INTO users (username, password, role, full_name) VALUES (?, ?, 'admin', 'IT Administrator')",
            ('admin', generate_password_hash('admin123'))
        )
        conn.execute("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, 'support', 'IT Support Team')",
                     ('tech', generate_password_hash('tech123')))
        conn.execute("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, 'employee', 'John Smith')",
                     ('john', generate_password_hash('john123')))
        conn.commit()
    conn.close()

# ---------- Auth Decorators ----------
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def support_or_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        if session.get('role') not in ['admin', 'support']:
            flash('IT Support access required.', 'danger')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated

# ---------- Routes ----------
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = get_db()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            session['full_name'] = user['full_name']
            return redirect(url_for('dashboard'))
        flash('Invalid username or password.', 'danger')
    return render_template('login.html')

# RESTORED: The missing register route that caused the 500 error
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])
        full_name = request.form.get('full_name', 'User')
        
        conn = get_db()
        try:
            conn.execute('INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)',
                         (username, password, full_name))
            conn.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Username already exists.', 'danger')
        finally:
            conn.close()
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    conn = get_db()
    if session['role'] in ['admin', 'support']:
        tickets = conn.execute('''
            SELECT t.*, u.full_name as creator_name
            FROM tickets t JOIN users u ON t.created_by = u.id
            ORDER BY t.created_at DESC
        ''').fetchall()
    else:
        tickets = conn.execute('''
            SELECT t.*, u.full_name as creator_name
            FROM tickets t JOIN users u ON t.created_by = u.id
            WHERE t.created_by = ?
            ORDER BY t.created_at DESC
        ''', (session['user_id'],)).fetchall()
    conn.close()
    
    stats = {
        'total': len(tickets),
        'open': sum(1 for t in tickets if t['status'] == 'Open'),
        'in_progress': sum(1 for t in tickets if t['status'] == 'In Progress'),
        'resolved': sum(1 for t in tickets if t['status'] == 'Resolved')
    }
    return render_template('dashboard.html', tickets=tickets, stats=stats)

@app.route('/ticket/new', methods=['GET', 'POST'])
@login_required
def new_ticket():
    if request.method == 'POST':
        conn = get_db()
        conn.execute(
            "INSERT INTO tickets (title, description, category, priority, created_by) VALUES (?, ?, ?, ?, ?)",
            (request.form['title'], request.form['description'], request.form['category'], request.form['priority'], session['user_id'])
        )
        conn.commit()
        conn.close()
        flash('Ticket submitted successfully!', 'success')
        return redirect(url_for('dashboard'))
    return render_template('new_ticket.html')

@app.route('/ticket/<int:ticket_id>')
@login_required
def view_ticket(ticket_id):
    conn = get_db()
    ticket = conn.execute('SELECT t.*, u.full_name as creator_name FROM tickets t JOIN users u ON t.created_by = u.id WHERE t.id = ?', (ticket_id,)).fetchone()
    conn.close()
    if not ticket:
        return redirect(url_for('dashboard'))
    return render_template('view_ticket.html', ticket=ticket)

# RESTORED: The missing update route that caused the view_ticket crash
@app.route('/ticket/<int:ticket_id>/update', methods=['POST'])
@login_required
def update_ticket(ticket_id):
    status = request.form.get('status')
    priority = request.form.get('priority')
    
    conn = get_db()
    conn.execute('UPDATE tickets SET status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                 (status, priority, ticket_id))
    conn.commit()
    conn.close()
    
    flash(f'Ticket #{ticket_id} updated successfully!', 'success')
    return redirect(url_for('view_ticket', ticket_id=ticket_id))

@app.route('/health')
def health():
    return {'status': 'healthy'}, 200

# ---------- App Init ----------
init_db()

if __name__ == '__main__':
    # Cloud Requirement: AWS Elastic Beanstalk expects traffic on Port 8080
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
