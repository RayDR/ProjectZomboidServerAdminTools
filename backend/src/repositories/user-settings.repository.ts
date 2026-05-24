import sqlite3 from 'sqlite3';

export interface StoredUserSettings {
  settings: Record<string, any>;
  customColors: Record<string, string>;
}

const DEFAULT_SETTINGS: StoredUserSettings = {
  settings: {},
  customColors: {}
};

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

const ensureSchema = async (db: sqlite3.Database): Promise<void> => {
  await run(
    db,
    `
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        settings_json TEXT NOT NULL DEFAULT '{}',
        custom_colors_json TEXT NOT NULL DEFAULT '{}',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `
  );
};

export class UserSettingsRepository {
  public async getByUserId(userId: number): Promise<StoredUserSettings> {
    const db = openDatabase();
    try {
      await ensureSchema(db);
      const row = await get<{ settings_json: string; custom_colors_json: string }>(
        db,
        'SELECT settings_json, custom_colors_json FROM user_settings WHERE user_id = ?',
        [userId]
      );

      if (!row) {
        return { ...DEFAULT_SETTINGS };
      }

      return {
        settings: this.parseJson(row.settings_json),
        customColors: this.parseJson(row.custom_colors_json)
      };
    } finally {
      db.close();
    }
  }

  public async saveByUserId(userId: number, payload: StoredUserSettings): Promise<void> {
    const db = openDatabase();
    try {
      await ensureSchema(db);
      const settingsJson = JSON.stringify(payload.settings || {});
      const customColorsJson = JSON.stringify(payload.customColors || {});
      await run(
        db,
        `
          INSERT INTO user_settings (user_id, settings_json, custom_colors_json, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET
            settings_json = excluded.settings_json,
            custom_colors_json = excluded.custom_colors_json,
            updated_at = CURRENT_TIMESTAMP
        `,
        [userId, settingsJson, customColorsJson]
      );
    } finally {
      db.close();
    }
  }

  private parseJson<T>(value: string | null | undefined, fallback: T = {} as T): T {
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
}

export const userSettingsRepository = new UserSettingsRepository();
