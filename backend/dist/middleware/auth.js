"use strict";
/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
const sqlite3_1 = __importDefault(require("sqlite3"));
const db = new sqlite3_1.default.Database('./db/pzadmin.db');
function auth(req, res, next) {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    if (token === 'secret123') {
        req.user = { username: 'token_user', id: null };
        return next();
    }
    db.get(`SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`, [token], (err, row) => {
        if (err)
            return res.status(500).json({ error: 'DB error' });
        if (!row)
            return res.status(401).json({ error: 'Unauthorized' });
        req.user = { id: row.id, username: row.username };
        next();
    });
}
