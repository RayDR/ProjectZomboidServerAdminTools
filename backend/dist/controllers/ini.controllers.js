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
const path_1 = require("path");
const env_1 = require("../config/env");
/**
 * GET /api/ini
 * Reads the Project Zomboid INI configuration file.
 */
const getIni = async (_req, res) => {
    try {
        const iniPath = (0, path_1.join)(env_1.config.pzIniPath, `${env_1.config.pzName}.ini`);
        const content = await (0, promises_1.readFile)(iniPath, 'utf-8');
        res.json({ content });
    }
    catch (err) {
        res.status(500).json({
            error: 'Failed to read INI file',
            details: err.message,
        });
    }
};
exports.getIni = getIni;
/**
 * PUT /api/ini
 * Updates the Project Zomboid INI file with new content.
 */
const updateIni = async (req, res) => {
    try {
        const content = req.body.content;
        if (typeof content !== 'string') {
            res.status(400).json({ error: 'Invalid content format' });
            return;
        }
        const iniPath = (0, path_1.join)(env_1.config.pzIniPath, `${env_1.config.pzName}.ini`);
        await (0, promises_1.writeFile)(iniPath, content);
        res.json({ message: 'INI file updated successfully' });
    }
    catch (err) {
        res.status(500).json({
            error: 'Failed to update INI file',
            details: err.message,
        });
    }
};
exports.updateIni = updateIni;
