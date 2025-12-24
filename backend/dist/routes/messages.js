"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const messages_controller_1 = require("../controllers/messages.controller");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
/**
 * POST /api/messages
 * Authenticated route to send a server message via RCON.
 */
router.post('/', auth_1.auth, (0, asyncHandler_1.asyncHandler)(messages_controller_1.broadcastMessage));
exports.default = router;
