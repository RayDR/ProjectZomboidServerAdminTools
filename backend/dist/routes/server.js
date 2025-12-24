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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serverController = __importStar(require("../controllers/server.controller"));
const serverLogsController = __importStar(require("../controllers/server-logs.controller"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * Server Control Routes
 * All routes are protected with authentication middleware
 */
// POST /api/server/start - Start the server
router.post('/start', auth_1.auth, serverController.startServerController);
// POST /api/server/stop - Stop the server
router.post('/stop', auth_1.auth, serverController.stopServerController);
// POST /api/server/restart - Restart the server
router.post('/restart', auth_1.auth, serverController.restartServerController);
// GET /api/server/status - Get server status
router.get('/status', auth_1.auth, serverController.getServerStatusController);
// POST /api/server/update - Update the server
router.post('/update', auth_1.auth, serverController.updateServerController);
// Server operation logs streaming (SSE)
router.get('/logs/stream/:operation', auth_1.auth, serverLogsController.streamServerLogs);
router.get('/logs/stream-backup', auth_1.auth, serverLogsController.streamBackupLogs);
router.get('/logs/stream-update', auth_1.auth, serverLogsController.streamUpdateLogs);
// Backup routes
// POST /api/server/backup - Create a new backup
router.post('/backup', auth_1.auth, serverController.createBackupController);
// GET /api/server/backups - List all backups
router.get('/backups', auth_1.auth, serverController.listBackupsController);
// DELETE /api/server/backups/:filename - Delete a backup
router.delete('/backups/:filename', auth_1.auth, serverController.deleteBackupController);
exports.default = router;
