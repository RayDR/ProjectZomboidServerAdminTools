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
exports.deleteBackupController = exports.listBackupsController = exports.createBackupController = exports.updateServerController = exports.getServerStatusController = exports.restartServerController = exports.stopServerController = exports.startServerController = void 0;
const serverService = __importStar(require("../services/server.service"));
/**
 * Start the server
 */
const startServerController = async (_req, res) => {
    try {
        const result = await serverService.startServer();
        res.json({ success: true, message: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to start server'
        });
    }
};
exports.startServerController = startServerController;
/**
 * Stop the server
 */
const stopServerController = async (_req, res) => {
    try {
        const result = await serverService.stopServer();
        res.json({ success: true, message: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to stop server'
        });
    }
};
exports.stopServerController = stopServerController;
/**
 * Restart the server
 */
const restartServerController = async (_req, res) => {
    try {
        const result = await serverService.restartServer();
        res.json({ success: true, message: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to restart server'
        });
    }
};
exports.restartServerController = restartServerController;
/**
 * Get server status
 */
const getServerStatusController = async (_req, res) => {
    try {
        const status = await serverService.getServerStatus();
        res.json({ success: true, data: status });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get server status'
        });
    }
};
exports.getServerStatusController = getServerStatusController;
/**
 * Update the server
 */
const updateServerController = async (_req, res) => {
    try {
        const result = await serverService.updateServer();
        res.json({ success: true, message: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update server'
        });
    }
};
exports.updateServerController = updateServerController;
/**
 * Create a backup
 */
const createBackupController = async (_req, res) => {
    try {
        const backup = await serverService.createBackup();
        res.json({ success: true, data: backup });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create backup'
        });
    }
};
exports.createBackupController = createBackupController;
/**
 * List all backups
 */
const listBackupsController = async (_req, res) => {
    try {
        const backups = await serverService.listBackups();
        res.json({ success: true, data: backups });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list backups'
        });
    }
};
exports.listBackupsController = listBackupsController;
/**
 * Delete a backup
 */
const deleteBackupController = async (req, res) => {
    try {
        const { filename } = req.params;
        if (!filename) {
            res.status(400).json({
                success: false,
                error: 'Filename is required'
            });
            return;
        }
        const result = await serverService.deleteBackup(filename);
        res.json({ success: true, message: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete backup'
        });
    }
};
exports.deleteBackupController = deleteBackupController;
