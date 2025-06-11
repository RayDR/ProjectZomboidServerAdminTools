"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commands_controller_1 = require("../controllers/commands.controller");
const auth_1 = require("../middleware/auth");
/**
 * Async handler wrapper to standardize Express async error handling.
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const router = (0, express_1.Router)();
/**
 * POST /api/commands
 * Protected route to run server-side commands.
 */
router.post('/', auth_1.auth, asyncHandler(commands_controller_1.executeCommand));
exports.default = router;
