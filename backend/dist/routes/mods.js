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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const modsController = __importStar(require("../controllers/mods.controller"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    dest: '/tmp/pz-mod-uploads',
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max file size
    }
});
/**
 * Mods Routes
 * All routes are protected with authentication middleware
 */
// GET /api/mods - Get installed mods
router.get('/', auth_1.auth, modsController.getInstalledModsController);
// POST /api/mods/install - Install a mod (with file upload support)
router.post('/install', auth_1.auth, upload.array('files', 10), modsController.installModController);
// DELETE /api/mods/:modId - Uninstall a mod
router.delete('/:modId', auth_1.auth, modsController.uninstallModController);
// POST /api/mods/update-all - Update all mods (simple response)
router.post('/update-all', auth_1.auth, modsController.updateAllModsController);
// GET /api/mods/update-all-stream - Update all mods with SSE streaming
router.get('/update-all-stream', auth_1.auth, modsController.updateAllModsStreamController);
// GET /api/mods/validate - Validate mod files
router.get('/validate', auth_1.auth, modsController.validateModsController);
exports.default = router;
