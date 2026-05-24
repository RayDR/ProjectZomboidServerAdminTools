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
exports.loginUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const users_repository_1 = require("../repositories/users.repository");
/**
 * Login controller: validates the admin password against the users table and creates a session token.
 */
const loginUser = async (req, res) => {
    const { username = 'admin', password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }
    const user = await users_repository_1.usersRepository.getAuthUserByUsername(String(username || 'admin').trim() || 'admin');
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const ok = await bcrypt_1.default.compare(String(password), user.password_hash);
    if (!ok) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = crypto_1.default.randomUUID();
    await users_repository_1.usersRepository.createSession(user.id, token);
    return res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.display_name,
            isAdmin: Boolean(user.is_admin),
            mustChangePassword: Boolean(user.must_change_password)
        }
    });
};
exports.loginUser = loginUser;
