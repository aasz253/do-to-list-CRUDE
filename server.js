const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Kenya Flag Colors
const KENYA_RED = '#BB0000';
const KENYA_GREEN = '#006600';
const KENYA_BLACK = '#000000';
const KENYA_WHITE = '#FFFFFF';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Database setup
const db = new sqlite3.Database('./todos.db', (err) => {
    if (err) console.error('Database error:', err);
    else console.log('Connected to SQLite database');
});

// Initialize tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        due_date DATETIME,
        alarm_enabled INTEGER DEFAULT 1,
        alarm_triggered INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
    
    db.run('PRAGMA table_info(users)', (err, columns) => {
        if (!err && columns && !columns.find(c => c.name === 'token')) {
            db.run('ALTER TABLE users ADD COLUMN token TEXT');
            console.log('Added token column to users table');
        }
    });
    
    db.run('PRAGMA table_info(tasks)', (err, columns) => {
        if (!err && columns) {
            if (!columns.find(c => c.name === 'alarm_enabled')) {
                db.run('ALTER TABLE tasks ADD COLUMN alarm_enabled INTEGER DEFAULT 1');
                console.log('Added alarm_enabled column');
            }
            if (!columns.find(c => c.name === 'alarm_triggered')) {
                db.run('ALTER TABLE tasks ADD COLUMN alarm_triggered INTEGER DEFAULT 0');
                console.log('Added alarm_triggered column');
            }
        }
    });
});

// Simple password hashing
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Auth Middleware
function authenticate(req, res, next) {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    db.get('SELECT id, username FROM users WHERE token = ?', [token], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// REGISTER
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username.trim().length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    
    const hashedPassword = hashPassword(password);
    
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username.trim(), hashedPassword], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        const token = hashPassword(Date.now().toString() + username);
        db.run('UPDATE users SET token = ? WHERE id = ?', [token, this.lastID]);
        res.json({ id: this.lastID, username, token });
    });
});

// LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    const hashedPassword = hashPassword(password);
    
    db.get('SELECT id, username FROM users WHERE username = ? AND password = ?', [username.trim(), hashedPassword], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = hashPassword(Date.now().toString() + username);
        db.run('UPDATE users SET token = ? WHERE id = ?', [token, user.id]);
        res.json({ id: user.id, username: user.username, token });
    });
});

// LOGOUT
app.post('/api/logout', authenticate, (req, res) => {
    db.run('UPDATE users SET token = NULL WHERE id = ?', [req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Logged out successfully' });
    });
});

// CREATE - Add a new task
app.post('/api/tasks', authenticate, (req, res) => {
    const { title, due_date, alarm_enabled } = req.body;
    
    // Validation: Prevent empty tasks
    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Task title cannot be empty' });
    }
    
    const trimmedTitle = title.trim();
    
    // Validate due_date format if provided
    if (due_date) {
        const dateObj = new Date(due_date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid due date format' });
        }
    }
    
    const alarmOn = alarm_enabled !== false ? 1 : 0;
    const createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    db.run('INSERT INTO tasks (user_id, title, due_date, alarm_enabled, created_at) VALUES (?, ?, ?, ?, ?)', 
        [req.user.id, trimmedTitle, due_date || null, alarmOn, createdAt], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                id: this.lastID, 
                title: trimmedTitle, 
                due_date,
                alarm_enabled: alarmOn,
                completed: 0,
                created_at: createdAt
            });
        }
    );
});

// READ - Get all tasks for current user
app.get('/api/tasks', authenticate, (req, res) => {
    db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// READ - Get tasks that are due (for alarm checking)
app.get('/api/tasks/due', authenticate, (req, res) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.all(`SELECT * FROM tasks 
            WHERE user_id = ? 
            AND completed = 0 
            AND alarm_enabled = 1 
            AND alarm_triggered = 0
            AND due_date IS NOT NULL
            AND due_date <= ?`, 
        [req.user.id, now], 
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// READ - Mark task alarm as triggered
app.post('/api/tasks/:id/trigger-alarm', authenticate, (req, res) => {
    const { id } = req.params;
    db.run('UPDATE tasks SET alarm_triggered = 1 WHERE id = ? AND user_id = ?', 
        [id, req.user.id], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Alarm triggered' });
        }
    );
});

// UPDATE - Toggle task completion
app.put('/api/tasks/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { completed, title, due_date } = req.body;
    
    // Validate title if provided
    if (title !== undefined && (!title || !title.trim())) {
        return res.status(400).json({ error: 'Task title cannot be empty' });
    }
    
    // Validate due_date if provided
    if (due_date) {
        const dateObj = new Date(due_date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid due date format' });
        }
    }
    
    let query = 'UPDATE tasks SET ';
    let params = [];
    let updates = [];
    
    if (completed !== undefined) {
        updates.push('completed = ?');
        params.push(completed ? 1 : 0);
    }
    if (title !== undefined) {
        updates.push('title = ?');
        params.push(title.trim());
    }
    if (due_date !== undefined) {
        updates.push('due_date = ?');
        params.push(due_date || null);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    query += updates.join(', ') + ' WHERE id = ? AND user_id = ?';
    params.push(id, req.user.id);
    
    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task updated' });
    });
});

// DELETE - Remove a task
app.delete('/api/tasks/:id', authenticate, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    });
});

// GET USER INFO
app.get('/api/user', authenticate, (req, res) => {
    res.json({ id: req.user.id, username: req.user.username });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Kenya-themed Todo App with Authentication');
});
