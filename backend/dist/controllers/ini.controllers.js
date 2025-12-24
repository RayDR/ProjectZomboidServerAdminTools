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
exports.updateIni = exports.getIni = void 0;
const promises_1 = require("fs/promises");
const instances_service_1 = require("../services/instances.service");
/**
 * GET /api/config/ini
 * Reads the Project Zomboid INI configuration file.
 */
const getIni = async (req, res) => {
    try {
        const { instanceId } = req.query;
        if (!instanceId) {
            res.status(400).json({ success: false, error: 'Instance ID required' });
            return;
        }
        const instance = await (0, instances_service_1.getInstanceById)(String(instanceId));
        if (!instance) {
            res.status(404).json({ success: false, error: 'Instance not found' });
            return;
        }
        const iniPath = instance.iniPath;
        console.log(`Reading INI file at: ${iniPath}`);
        const content = await (0, promises_1.readFile)(iniPath, 'utf-8');
        res.json({
            success: true,
            data: { content, path: iniPath }
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to read INI file',
            details: err.message,
        });
    }
};
exports.getIni = getIni;
/**
 * PUT /api/config/ini
 * Updates the Project Zomboid INI file with new content.
 */
const updateIni = async (req, res) => {
    try {
        const { content, instanceId } = req.body;
        if (!instanceId) {
            res.status(400).json({ success: false, error: 'Instance ID required' });
            return;
        }
        if (typeof content !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Invalid content format'
            });
            return;
        }
        const instance = await (0, instances_service_1.getInstanceById)(String(instanceId));
        if (!instance) {
            res.status(404).json({ success: false, error: 'Instance not found' });
            return;
        }
        const iniPath = instance.iniPath;
        await (0, promises_1.writeFile)(iniPath, content);
        res.json({
            success: true,
            message: 'INI file updated successfully'
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update INI file',
            details: err.message,
        });
    }
};
exports.updateIni = updateIni;
