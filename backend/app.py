from flask import Flask, request, session, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import psycopg2
import psycopg2.extras
import os

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'helpdesk-pro-secure-key-2026')

# ---------- CORS ----------
# Allow requests from the frontend container/domain
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
CORS(app, supports_credentials=True, origins=[FRONTEND_URL])

# ---------- Database ----------
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
    conn.cursor_factory = psycopg2.extras.RealDictCursor
    return conn

def init_db():
    try:
        conn = get_db()
        cur = conn.cursor()
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

# ---------- Auth Decorator ----------
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

# ---------- Auth Routes ----------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')

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
        return jsonify({
            'user': {
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'full_name': user['full_name']
            }
        }), 200

    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '')
    password = generate_password_hash(data.get('password', ''))
    full_name = data.get('full_name', 'User')

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            'INSERT INTO users (username, password, full_name) VALUES (%s, %s, %s)',
            (username, password, full_name)
        )
        conn.commit()
        return jsonify({'message': 'Registration successful'}), 201
    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({'error': 'Username already exists'}), 409
    finally:
        cur.close()
        conn.close()

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200

@app.route('/api/me', methods=['GET'])
@login_required
def me():
    return jsonify({
        'user': {
            'id': session['user_id'],
            'username': session['username'],
            'role': session['role'],
            'full_name': session['full_name']
        }
    }), 200

# ---------- Ticket Routes ----------
@app.route('/api/tickets', methods=['GET'])
@login_required
def get_tickets():
    conn = get_db()
    cur = conn.cursor()

    if session['role'] in ['admin', 'support']:
        cur.execute('''
            SELECT t.*, u.full_name as creator_name
            FROM tickets t JOIN users u ON t.created_by = u.id
            ORDER BY t.created_at DESC
        ''')
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

    # Convert datetime objects to strings for JSON serialisation
    ticket_list = []
    for t in tickets:
        row = dict(t)
        row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M') if row['created_at'] else None
        row['updated_at'] = row['updated_at'].strftime('%Y-%m-%d %H:%M') if row['updated_at'] else None
        ticket_list.append(row)

    stats = {
        'total': len(ticket_list),
        'open': sum(1 for t in ticket_list if t['status'] == 'Open'),
        'in_progress': sum(1 for t in ticket_list if t['status'] == 'In Progress'),
        'resolved': sum(1 for t in ticket_list if t['status'] == 'Resolved')
    }

    return jsonify({'tickets': ticket_list, 'stats': stats}), 200

@app.route('/api/tickets', methods=['POST'])
@login_required
def create_ticket():
    data = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO tickets (title, description, category, priority, created_by) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (data['title'], data['description'], data.get('category', 'General'),
         data.get('priority', 'Medium'), session['user_id'])
    )
    new_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Ticket created', 'ticket_id': new_id}), 201

@app.route('/api/tickets/<int:ticket_id>', methods=['GET'])
@login_required
def get_ticket(ticket_id):
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
        return jsonify({'error': 'Ticket not found'}), 404

    row = dict(ticket)
    row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M') if row['created_at'] else None
    row['updated_at'] = row['updated_at'].strftime('%Y-%m-%d %H:%M') if row['updated_at'] else None

    return jsonify({'ticket': row}), 200

@app.route('/api/tickets/<int:ticket_id>', methods=['PUT'])
@login_required
def update_ticket(ticket_id):
    if session['role'] not in ['admin', 'support']:
        return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json()
    status = data.get('status')
    priority = data.get('priority')

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        'UPDATE tickets SET status = %s, priority = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s',
        (status, priority, ticket_id)
    )
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'message': f'Ticket #{ticket_id} updated successfully'}), 200

# ---------- Health ----------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

# ---------- Init ----------
try:
    init_db()
except Exception as e:
    print(f"Init skipped: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
