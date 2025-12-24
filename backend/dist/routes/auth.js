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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_controller_1 = require("../controllers/auth.controller");
/**
 * Async handler wrapper to standardize Express async error handling.
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const router = (0, express_1.Router)();
/**
 * POST /api/login
 * Public route to log in and receive a token.
 */
router.post('/login', asyncHandler(auth_controller_1.loginUser));
/**
 * GET /api/profile
 * Protected route to test authentication.
 */
router.get('/profile', auth_1.auth, asyncHandler(async (req, res) => {
    res.json({ message: 'Authenticated', user: req.user });
}));
exports.default = router;
