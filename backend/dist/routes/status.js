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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*!
 * MIT License
 *
 * Copyright (c) 2025 DomoForge (domoforge.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */
const express_1 = require("express");
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
/**
 * Get system memory usage.
 */
const checkMemory = () => {
    const total = os_1.default.totalmem();
    const free = os_1.default.freemem();
    const used = total - free;
    return {
        total,
        free,
        used,
        usagePercent: parseFloat(((used / total) * 100).toFixed(2)),
    };
};
/**
 * Check SQLite database connection and simple query.
 */
const checkDatabase = () => {
    return new Promise((resolve) => {
        const db = new sqlite3_1.default.Database('./db/pzadmin.db', (err) => {
            if (err)
                return resolve({ ok: false, error: err.message });
            db.get('SELECT 1', [], (queryErr) => {
                db.close();
                if (queryErr)
                    return resolve({ ok: false, error: queryErr.message });
                resolve({ ok: true });
            });
        });
    });
};
/**
 * Check if the Project Zomboid process is running.
 */
const checkZomboidProcess = () => {
    return new Promise((resolve) => {
        (0, child_process_1.exec)('pgrep -f ProjectZomboid64', (err, stdout) => {
            resolve(!!stdout.trim());
        });
    });
};
/**
 * (Optional) Use custom pzenv script to get more detailed server status.
 */
const checkZomboidWithPzenv = () => {
    return new Promise((resolve) => {
        const fullCommand = `bash -c "source ${env_1.config.pzEnvScript} && systemctl status $PZ_SERVICE"`;
        (0, child_process_1.exec)(fullCommand, (err, stdout, stderr) => {
            if (err)
                return resolve(`Error: ${stderr || err.message}`);
            resolve(stdout.trim());
        });
    });
};
/**
 * GET /api/status
 * Returns health and component checks of the server.
 */
router.get('/', async (_req, res) => {
    const memory = checkMemory();
    const dbStatus = await checkDatabase();
    const zomboidRunning = await checkZomboidProcess();
    const altStatus = env_1.config.pzEnvScript ? await checkZomboidWithPzenv() : null;
    res.json({
        serverName: env_1.config.pzName,
        version: 'Build 41.78.16',
        status: '🧠 Online',
        zomboidRunning,
        players: {
            online: 0,
            max: 32
        },
        components: {
            memory,
            database: dbStatus,
            zomboidProcess: zomboidRunning ? '🟢 running' : '🔴 not running',
            alternativeStatus: altStatus || 'disabled',
        },
        checkedAt: new Date().toISOString(),
    });
});
exports.default = router;
