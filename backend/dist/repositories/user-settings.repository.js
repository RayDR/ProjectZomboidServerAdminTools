"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSettingsRepository = exports.UserSettingsRepository = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const DEFAULT_SETTINGS = {
    settings: {},
    customColors: {}
};
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
const ensureSchema = async (db) => {
    await run(db, `
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        settings_json TEXT NOT NULL DEFAULT '{}',
        custom_colors_json TEXT NOT NULL DEFAULT '{}',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
};
class UserSettingsRepository {
    async getByUserId(userId) {
        const db = openDatabase();
        try {
            await ensureSchema(db);
            const row = await get(db, 'SELECT settings_json, custom_colors_json FROM user_settings WHERE user_id = ?', [userId]);
            if (!row) {
                return { ...DEFAULT_SETTINGS };
            }
            return {
                settings: this.parseJson(row.settings_json),
                customColors: this.parseJson(row.custom_colors_json)
            };
        }
        finally {
            db.close();
        }
    }
    async saveByUserId(userId, payload) {
        const db = openDatabase();
        try {
            await ensureSchema(db);
            const settingsJson = JSON.stringify(payload.settings || {});
            const customColorsJson = JSON.stringify(payload.customColors || {});
            await run(db, `
          INSERT INTO user_settings (user_id, settings_json, custom_colors_json, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET
            settings_json = excluded.settings_json,
            custom_colors_json = excluded.custom_colors_json,
            updated_at = CURRENT_TIMESTAMP
        `, [userId, settingsJson, customColorsJson]);
        }
        finally {
            db.close();
        }
    }
    parseJson(value, fallback = {}) {
        if (!value)
            return fallback;
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        }
        catch {
            return fallback;
        }
    }
}
exports.UserSettingsRepository = UserSettingsRepository;
exports.userSettingsRepository = new UserSettingsRepository();
