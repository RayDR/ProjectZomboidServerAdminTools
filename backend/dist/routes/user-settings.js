"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const user_settings_controller_1 = require("../controllers/user-settings.controller");
const router = (0, express_1.Router)();
router.get('/', auth_1.auth, (req, res) => { void (0, user_settings_controller_1.getUserSettingsController)(req, res); });
router.put('/', auth_1.auth, (req, res) => { void (0, user_settings_controller_1.updateUserSettingsController)(req, res); });
exports.default = router;
