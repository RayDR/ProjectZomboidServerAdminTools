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
const logs_service_1 = require("../services/logs.service");
const router = (0, express_1.Router)();
// GET /api/logs/server - Get server log
router.get('/server', auth_1.auth, async (req, res) => {
    const { lines = 500, instanceId } = req.query;
    if (!instanceId) {
        res.status(400).json({ success: false, error: 'Instance ID is required' });
        return;
    }
    try {
        const content = await (0, logs_service_1.readLogFile)(String(instanceId), 'main', Number(lines));
        res.json({
            success: true,
            data: {
                content,
                type: 'server',
                lines: content.split('\n').length
            }
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to read server log',
            details: err.message
        });
    }
});
// GET /api/logs/maintenance - Get maintenance log
router.get('/maintenance', auth_1.auth, async (req, res) => {
    const { lines = 500, instanceId } = req.query;
    if (!instanceId) {
        res.status(400).json({ success: false, error: 'Instance ID is required' });
        return;
    }
    try {
        const content = await (0, logs_service_1.readLogFile)(String(instanceId), 'maintenance', Number(lines));
        res.json({
            success: true,
            data: {
                content,
                type: 'maintenance',
                lines: content.split('\n').length
            }
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to read maintenance log',
            details: err.message
        });
    }
});
// Legacy endpoint for backwards compatibility (Updated to require instanceId)
router.get('/', auth_1.auth, async (req, res) => {
    const allowedTypes = ['main', 'maintenance', 'errors'];
    const { type = 'main', lines = 100, instanceId } = req.query;
    if (!instanceId) {
        res.status(400).json({ success: false, error: 'Instance ID is required' });
        return;
    }
    const logType = allowedTypes.includes(type)
        ? type
        : 'main';
    try {
        const log = await (0, logs_service_1.readLogFile)(String(instanceId), logType, Number(lines));
        res.json({ log });
    }
    catch (err) {
        res.status(500).json({
            error: 'Failed to read log file',
            details: err.message
        });
    }
});
// POST /api/logs/clear - Clear log file with backup
router.post('/clear', auth_1.auth, async (req, res) => {
    const { type = 'main', instanceId } = req.body;
    if (!instanceId) {
        res.status(400).json({ success: false, error: 'Instance ID is required' });
        return;
    }
    if (!['main', 'maintenance'].includes(type)) {
        res.status(400).json({
            success: false,
            error: 'Invalid log type. Must be "main" or "maintenance"'
        });
        return;
    }
    try {
        const result = await (0, logs_service_1.clearLogWithBackup)(instanceId, type);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to clear log',
            details: err.message
        });
    }
});
// GET /api/logs/stats - Get log statistics
router.get('/stats', auth_1.auth, async (req, res) => {
    const { type = 'main', instanceId } = req.query;
    if (!instanceId) {
        res.status(400).json({ success: false, error: 'Instance ID is required' });
        return;
    }
    if (!['main', 'maintenance'].includes(type)) {
        res.status(400).json({
            success: false,
            error: 'Invalid log type'
        });
        return;
    }
    try {
        const stats = await (0, logs_service_1.getLogStats)(String(instanceId), type);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to get log stats',
            details: err.message
        });
    }
});
exports.default = router;
