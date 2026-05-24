import sqlite3 from 'sqlite3';

export interface PublicUser {
  id: number;
  username: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

interface DbUserRow {
  id: number;
  username: string;
  email: string | null;
  display_name: string | null;
  is_admin: number;
  must_change_password: number;
  created_at: string;
}

interface DbUserAuthRow extends DbUserRow {
  password_hash: string;
}

const DB_PATH = './db/pzadmin.db';

const openDatabase = (): sqlite3.Database => new sqlite3.Database(DB_PATH);

const run = (db: sqlite3.Database, sql: string, params: any[] = []): Promise<void> =>
  new Promise((resolve, reject) => {
    db.run(sql, params, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

const get = <T>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T | undefined> =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row as T | undefined);
    });
  });

const all = <T>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T[]> =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve((rows || []) as T[]);
    });
  });

const normalizeNullableText = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapDbUser = (row: DbUserRow): PublicUser => ({
  id: row.id,
  username: row.username,
  email: row.email,
  displayName: row.display_name,
  isAdmin: Boolean(row.is_admin),
  mustChangePassword: Boolean(row.must_change_password),
  createdAt: row.created_at
});

const columnExists = async (db: sqlite3.Database, tableName: string, columnName: string): Promise<boolean> => {
  const columns = await all<{ name: string }>(db, `PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
};

export const ensureUserSchema = async (): Promise<void> => {
  const db = openDatabase();
  try {
    await run(
      db,
      `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    );

    await run(
      db,
      `
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `
    );

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
    await run(
      db,
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL AND trim(email) <> ''"
    );
    await run(db, 'CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_unique ON sessions(token)');

    await run(db, "UPDATE users SET is_admin = 1 WHERE username = 'admin'");
  } finally {
    db.close();
  }
};

export class UsersRepository {
  public async listUsers(): Promise<PublicUser[]> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      const rows = await all<DbUserRow>(
        db,
        `
          SELECT id, username, email, display_name, is_admin, must_change_password, created_at
          FROM users
          ORDER BY username ASC
        `
      );
      return rows.map(mapDbUser);
    } finally {
      db.close();
    }
  }

  public async getUserById(id: number): Promise<PublicUser | null> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      const row = await get<DbUserRow>(
        db,
        'SELECT id, username, email, display_name, is_admin, must_change_password, created_at FROM users WHERE id = ?',
        [id]
      );
      return row ? mapDbUser(row) : null;
    } finally {
      db.close();
    }
  }

  public async getAuthUserById(id: number): Promise<DbUserAuthRow | null> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      const row = await get<DbUserAuthRow>(
        db,
        `
          SELECT id, username, email, display_name, is_admin, must_change_password, created_at, password_hash
          FROM users
          WHERE id = ?
        `,
        [id]
      );
      return row || null;
    } finally {
      db.close();
    }
  }

  public async getAuthUserByUsername(username: string): Promise<DbUserAuthRow | null> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      const row = await get<DbUserAuthRow>(
        db,
        `
          SELECT id, username, email, display_name, is_admin, must_change_password, created_at, password_hash
          FROM users
          WHERE username = ?
          LIMIT 1
        `,
        [username]
      );
      return row || null;
    } finally {
      db.close();
    }
  }

  public async getUserBySessionToken(token: string): Promise<PublicUser | null> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      const row = await get<DbUserRow>(
        db,
        `
          SELECT u.id, u.username, u.email, u.display_name, u.is_admin, u.must_change_password, u.created_at
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token = ?
          LIMIT 1
        `,
        [token]
      );
      return row ? mapDbUser(row) : null;
    } finally {
      db.close();
    }
  }

  public async createSession(userId: number, token: string): Promise<void> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      await run(db, 'INSERT INTO sessions (user_id, token) VALUES (?, ?)', [userId, token]);
    } finally {
      db.close();
    }
  }

  public async createUser(payload: {
    username: string;
    email: string;
    displayName?: string;
    passwordHash: string;
    isAdmin: boolean;
    mustChangePassword: boolean;
  }): Promise<PublicUser> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      await run(
        db,
        `
          INSERT INTO users (username, email, display_name, password_hash, is_admin, must_change_password)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          payload.username.trim(),
          payload.email.trim(),
          normalizeNullableText(payload.displayName),
          payload.passwordHash,
          payload.isAdmin ? 1 : 0,
          payload.mustChangePassword ? 1 : 0
        ]
      );

      const created = await get<DbUserRow>(
        db,
        `
          SELECT id, username, email, display_name, is_admin, must_change_password, created_at
          FROM users
          WHERE username = ?
          LIMIT 1
        `,
        [payload.username.trim()]
      );

      if (!created) {
        throw new Error('Failed to load created user');
      }

      return mapDbUser(created);
    } finally {
      db.close();
    }
  }

  public async updateUser(
    userId: number,
    payload: {
      username: string;
      email: string;
      displayName?: string;
      isAdmin: boolean;
      mustChangePassword?: boolean;
    }
  ): Promise<PublicUser | null> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      const params: any[] = [
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

      const row = await get<DbUserRow>(
        db,
        'SELECT id, username, email, display_name, is_admin, must_change_password, created_at FROM users WHERE id = ?',
        [userId]
      );

      return row ? mapDbUser(row) : null;
    } finally {
      db.close();
    }
  }

  public async updateUserPassword(userId: number, passwordHash: string, mustChangePassword: boolean): Promise<void> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      await run(
        db,
        'UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?',
        [passwordHash, mustChangePassword ? 1 : 0, userId]
      );
    } finally {
      db.close();
    }
  }

  public async existsByUsername(username: string, excludeUserId?: number): Promise<boolean> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      const params: any[] = [username.trim()];
      let sql = 'SELECT id FROM users WHERE username = ?';
      if (typeof excludeUserId === 'number') {
        sql += ' AND id != ?';
        params.push(excludeUserId);
      }
      sql += ' LIMIT 1';
      const row = await get<{ id: number }>(db, sql, params);
      return Boolean(row);
    } finally {
      db.close();
    }
  }

  public async existsByEmail(email: string, excludeUserId?: number): Promise<boolean> {
    await ensureUserSchema();
    const db = openDatabase();
    try {
      const params: any[] = [email.trim().toLowerCase()];
      let sql = 'SELECT id FROM users WHERE lower(email) = lower(?)';
      if (typeof excludeUserId === 'number') {
        sql += ' AND id != ?';
        params.push(excludeUserId);
      }
      sql += ' LIMIT 1';
      const row = await get<{ id: number }>(db, sql, params);
      return Boolean(row);
    } finally {
      db.close();
    }
  }
}

export const usersRepository = new UsersRepository();