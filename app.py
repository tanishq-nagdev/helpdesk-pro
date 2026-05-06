from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import psycopg2
import psycopg2.extras
import os

app = Flask(__name__)
# Secret key for session management
app.secret_key = os.environ.get('SECRET_KEY', 'helpdesk-pro-secure-key-2026')

# ---------- Database Setup (AWS RDS PostgreSQL) ----------
# These variables should be set in AWS Elastic Beanstalk Environment Properties
DB_HOST = os.environ.get('DB_HOST', 'helpdesk-db.cvoymkeyimfo.eu-north-1.rds.amazonaws.com')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASS = os.environ.get('DB_PASS', 'hjhjhjhj')
DB_NAME = os.environ.get('DB_NAME', 'helpdesk')
DB_PORT = os.environ.get('DB_PORT', '5432')

def get_db():
    conn = psycopg2.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        dbname=DB_NAME,
        port=DB_PORT
    )
    # Allows accessing columns by name (like SQLite's row_factory)
    conn.cursor_factory = psycopg2.extras.DictCursor
    return conn

def init_db():
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Create Tables using PostgreSQL syntax (SERIAL for auto-increment)
        cur.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'employee',
                full_name VARCHAR(100) NOT NULL DEFAULT 'User'
            );

            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(50) NOT NULL DEFAULT 'General',
                status VARCHAR(20) NOT NULL DEFAULT 'Open',
                priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
                created_by INTEGER NOT NULL REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')

        # Seed default users if they don't exist
        cur.execute("SELECT id FROM users WHERE username='admin'")
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO users (username, password, role, full_name) VALUES (%s, %s, 'admin', 'IT Administrator')",
                ('admin', generate_password_hash('admin123'))
            )
            cur.execute(
                "INSERT INTO users (username, password, role, full_name) VALUES (%s, %s, 'support', 'IT Support Team')",
                ('tech', generate_password_hash('tech123'))
            )
            cur.execute(
                "INSERT INTO users (username, password, role, full_name) VALUES (%s, %s, 'employee', 'John Smith')",
                ('john', generate_password_hash('john123'))
            )
            conn.commit()
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Database initialization error: {e}")

# ---------- Auth Decorators ----------
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
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
        cur = conn.cursor()
        cur.execute('SELECT * FROM users WHERE username = %s', (username,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            session['full_name'] = user['full_name']
            return redirect(url_for('dashboard'))
        flash('Invalid username or password.', 'danger')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])
        full_name = request.form.get('full_name', 'User')
        
        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute('INSERT INTO users (username, password, full_name) VALUES (%s, %s, %s)',
                         (username, password, full_name))
            conn.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except psycopg2.IntegrityError:
            conn.rollback()
            flash('Username already exists.', 'danger')
        finally:
            cur.close()
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
    cur = conn.cursor()
    
    if session['role'] in ['admin', 'support']:
        cur.execute('''
            SELECT t.*, u.full_name as creator_name
            FROM tickets t JOIN users u ON t.created_by = u.id
            ORDER BY t.created_at DESC
        ''')
        tickets = cur.fetchall()
    else:
        cur.execute('''
            SELECT t.*, u.full_name as creator_name
            FROM tickets t JOIN users u ON t.created_by = u.id
            WHERE t.created_by = %s
            ORDER BY t.created_at DESC
        ''', (session['user_id'],))
        tickets = cur.fetchall()
        
    cur.close()
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
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO tickets (title, description, category, priority, created_by) VALUES (%s, %s, %s, %s, %s)",
            (request.form['title'], request.form['description'], request.form['category'], request.form['priority'], session['user_id'])
        )
        conn.commit()
        cur.close()
        conn.close()
        flash('Ticket submitted successfully!', 'success')
        return redirect(url_for('dashboard'))
    return render_template('new_ticket.html')

@app.route('/ticket/<int:ticket_id>')
@login_required
def view_ticket(ticket_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        SELECT t.*, u.full_name as creator_name 
        FROM tickets t JOIN users u ON t.created_by = u.id 
        WHERE t.id = %s
    ''', (ticket_id,))
    ticket = cur.fetchone()
    cur.close()
    conn.close()
    
    if not ticket:
        return redirect(url_for('dashboard'))
    return render_template('view_ticket.html', ticket=ticket)

@app.route('/ticket/<int:ticket_id>/update', methods=['POST'])
@login_required
def update_ticket(ticket_id):
    status = request.form.get('status')
    priority = request.form.get('priority')
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('UPDATE tickets SET status = %s, priority = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s', 
                 (status, priority, ticket_id))
    conn.commit()
    cur.close()
    conn.close()
    
    flash(f'Ticket #{ticket_id} updated successfully!', 'success')
    return redirect(url_for('view_ticket', ticket_id=ticket_id))

@app.route('/health')
def health():
    return {'status': 'healthy'}, 200

# ---------- App Init ----------
# Wrap in try/except so it doesn't crash during pipeline build if DB is unreachable
try:
    init_db()
except:
    pass

if __name__ == '__main__':
    # Cloud Requirement: AWS Elastic Beanstalk expects traffic on Port 8080
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
