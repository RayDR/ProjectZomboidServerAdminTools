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
const env_1 = require("../config/env");
const fs_1 = require("fs");
const path_1 = require("path");
const router = (0, express_1.Router)();
const startTime = Date.now();
const version = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../package.json'), 'utf-8')).version;
router.get('/', (_req, res) => {
    const uptimeMs = Date.now() - startTime;
    res.json({
        app: 'PZWebAdmin-API',
        status: '✅ Online',
        version,
        server: env_1.config.pzName || 'pzserver',
        poweredBy: 'DomoForge (domoforge.com)',
        environment: process.env.NODE_ENV || 'development',
        startedAt: new Date(startTime).toISOString(),
        uptime: `${Math.floor(uptimeMs / 1000)}s`,
        timestamp: new Date().toISOString(),
        message: '🧠 Everything is operational. Keep surviving!',
    });
});
exports.default = router;
