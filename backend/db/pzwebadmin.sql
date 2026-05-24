-- pzwebadmin.sql - SQLite schema for user authentication and audit logs

-- Table to store users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email)
WHERE email IS NOT NULL AND trim(email) <> '';

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
INSERT INTO users (username, email, display_name, password_hash, is_admin, must_change_password) VALUES (
    'admin',
    'admin@local',
    'Administrator',
    '$2b$10$VHvKP0apcXU3KvmSz1D4eOKew98viTjzoTztBdpcxBWuMVWExjP8C',
    1,
    0
);