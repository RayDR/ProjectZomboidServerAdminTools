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
const os_1 = __importDefault(require("os"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const instances_service_1 = require("../services/instances.service");
const router = (0, express_1.Router)();
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
router.get('/', async (_req, res) => {
    const memory = checkMemory();
    const dbStatus = await checkDatabase();
    const instances = await (0, instances_service_1.getInstancesStatus)();
    const runningCount = instances.filter(i => i.running).length;
    res.json({
        system: 'Online',
        instancesRunning: runningCount,
        totalInstances: instances.length,
        components: {
            memory,
            database: dbStatus,
        },
        checkedAt: new Date().toISOString(),
    });
});
exports.default = router;
