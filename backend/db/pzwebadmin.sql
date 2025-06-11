-- pzwebadmin.sql - SQLite schema for user authentication and audit logs

-- Table to store users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table to store login sessions (optional, for future tracking)
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table to log actions performed from the WebAdmin (INI saves, command runs, etc.)
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    detail TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert a default admin user (replace password hash)
-- Password is: admin123
INSERT INTO users (username, password_hash) VALUES (
    'admin',
    '$2b$10$VHvKP0apcXU3KvmSz1D4eOKew98viTjzoTztBdpcxBWuMVWExjP8C'
);