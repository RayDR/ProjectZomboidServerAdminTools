"use strict";
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
    // Solo un ejemplo. Si usas req.user, deberías definir un tipo personalizado.
    res.json({ message: 'Authenticated', user: req.user });
}));
exports.default = router;
