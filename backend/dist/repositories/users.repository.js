"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRepository = exports.UsersRepository = exports.ensureUserSchema = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const DB_PATH = './db/pzadmin.db';
const openDatabase = () => new sqlite3_1.default.Database(DB_PATH);
const run = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, (error) => {
        if (error) {
            reject(error);
            return;
        }
        resolve();
    });
});
const get = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(row);
    });
});
const all = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
        if (error) {
            reject(error);
            return;
        }
        resolve((rows || []));
    });
});
const normalizeNullableText = (value) => {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};
const mapDbUser = (row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    isAdmin: Boolean(row.is_admin),
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at
});
const columnExists = async (db, tableName, columnName) => {
    const columns = await all(db, `PRAGMA table_info(${tableName})`);
    return columns.some((column) => column.name === columnName);
};
const ensureUserSchema = async () => {
    const db = openDatabase();
    try {
        await run(db, `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
        await run(db, `
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
        if (!(await columnExists(db, 'users', 'email'))) {
            await run(db, 'ALTER TABLE users ADD COLUMN email TEXT');
        }
        if (!(await columnExists(db, 'users', 'display_name'))) {
            await run(db, 'ALTER TABLE users ADD COLUMN display_name TEXT');
        }
        if (!(await columnExists(db, 'users', 'is_admin'))) {
            await run(db, 'ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
        }
        if (!(await columnExists(db, 'users', 'must_change_password'))) {
            await run(db, 'ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0');
        }
        await run(db, 'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username)');
        await run(db, "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL AND trim(email) <> ''");
        await run(db, 'CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_unique ON sessions(token)');
        await run(db, "UPDATE users SET is_admin = 1 WHERE username = 'admin'");
    }
    finally {
        db.close();
    }
};
exports.ensureUserSchema = ensureUserSchema;
class UsersRepository {
    async listUsers() {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            const rows = await all(db, `
          SELECT id, username, email, display_name, is_admin, must_change_password, created_at
          FROM users
          ORDER BY username ASC
        `);
            return rows.map(mapDbUser);
        }
        finally {
            db.close();
        }
    }
    async getUserById(id) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            const row = await get(db, 'SELECT id, username, email, display_name, is_admin, must_change_password, created_at FROM users WHERE id = ?', [id]);
            return row ? mapDbUser(row) : null;
        }
        finally {
            db.close();
        }
    }
    async getAuthUserById(id) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            const row = await get(db, `
          SELECT id, username, email, display_name, is_admin, must_change_password, created_at, password_hash
          FROM users
          WHERE id = ?
        `, [id]);
            return row || null;
        }
        finally {
            db.close();
        }
    }
    async getAuthUserByUsername(username) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            const row = await get(db, `
          SELECT id, username, email, display_name, is_admin, must_change_password, created_at, password_hash
          FROM users
          WHERE username = ?
          LIMIT 1
        `, [username]);
            return row || null;
        }
        finally {
            db.close();
        }
    }
    async getUserBySessionToken(token) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            const row = await get(db, `
          SELECT u.id, u.username, u.email, u.display_name, u.is_admin, u.must_change_password, u.created_at
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token = ?
          LIMIT 1
        `, [token]);
            return row ? mapDbUser(row) : null;
        }
        finally {
            db.close();
        }
    }
    async createSession(userId, token) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            await run(db, 'INSERT INTO sessions (user_id, token) VALUES (?, ?)', [userId, token]);
        }
        finally {
            db.close();
        }
    }
    async createUser(payload) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            await run(db, `
          INSERT INTO users (username, email, display_name, password_hash, is_admin, must_change_password)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
                payload.username.trim(),
                payload.email.trim(),
                normalizeNullableText(payload.displayName),
                payload.passwordHash,
                payload.isAdmin ? 1 : 0,
                payload.mustChangePassword ? 1 : 0
            ]);
            const created = await get(db, `
          SELECT id, username, email, display_name, is_admin, must_change_password, created_at
          FROM users
          WHERE username = ?
          LIMIT 1
        `, [payload.username.trim()]);
            if (!created) {
                throw new Error('Failed to load created user');
            }
            return mapDbUser(created);
        }
        finally {
            db.close();
        }
    }
    async updateUser(userId, payload) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            const params = [
                payload.username.trim(),
                payload.email.trim(),
                normalizeNullableText(payload.displayName),
                payload.isAdmin ? 1 : 0
            ];
            let sql = `
        UPDATE users
        SET username = ?, email = ?, display_name = ?, is_admin = ?
      `;
            if (typeof payload.mustChangePassword === 'boolean') {
                sql += ', must_change_password = ?';
                params.push(payload.mustChangePassword ? 1 : 0);
            }
            sql += ' WHERE id = ?';
            params.push(userId);
            await run(db, sql, params);
            const row = await get(db, 'SELECT id, username, email, display_name, is_admin, must_change_password, created_at FROM users WHERE id = ?', [userId]);
            return row ? mapDbUser(row) : null;
        }
        finally {
            db.close();
        }
    }
    async updateUserPassword(userId, passwordHash, mustChangePassword) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            await run(db, 'UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?', [passwordHash, mustChangePassword ? 1 : 0, userId]);
        }
        finally {
            db.close();
        }
    }
    async existsByUsername(username, excludeUserId) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            const params = [username.trim()];
            let sql = 'SELECT id FROM users WHERE username = ?';
            if (typeof excludeUserId === 'number') {
                sql += ' AND id != ?';
                params.push(excludeUserId);
            }
            sql += ' LIMIT 1';
            const row = await get(db, sql, params);
            return Boolean(row);
        }
        finally {
            db.close();
        }
    }
    async existsByEmail(email, excludeUserId) {
        await (0, exports.ensureUserSchema)();
        const db = openDatabase();
        try {
            const params = [email.trim().toLowerCase()];
            let sql = 'SELECT id FROM users WHERE lower(email) = lower(?)';
            if (typeof excludeUserId === 'number') {
                sql += ' AND id != ?';
                params.push(excludeUserId);
            }
            sql += ' LIMIT 1';
            const row = await get(db, sql, params);
            return Boolean(row);
        }
        finally {
            db.close();
        }
    }
}
exports.UsersRepository = UsersRepository;
exports.usersRepository = new UsersRepository();
