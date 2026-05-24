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
exports.updateIni = exports.getIni = void 0;
const promises_1 = require("fs/promises");
const path = __importStar(require("path"));
const instance_manager_1 = require("../managers/instance.manager");
const ALLOWED_TYPES = ['ini', 'sandbox', 'spawnpoints', 'spawnregions'];
/**
 * Helper to determine file path based on type
 */
const getFilePath = (baseIniPath, type) => {
    const dir = path.dirname(baseIniPath);
    const ext = path.extname(baseIniPath); // .ini
    const basename = path.basename(baseIniPath, ext); // pzserver
    switch (type) {
        case 'sandbox':
            return path.join(dir, `${basename}_SandboxVars.lua`);
        case 'spawnpoints':
            return path.join(dir, `${basename}_spawnpoints.lua`);
        case 'spawnregions':
            return path.join(dir, `${basename}_spawnregions.lua`);
        case 'ini':
        default:
            return baseIniPath;
    }
};
/**
 * GET /api/config/ini
 * Reads the Project Zomboid INI configuration file or Lua configs.
 */
const getIni = async (req, res) => {
    try {
        const { instanceId, type } = req.query;
        if (!instanceId) {
            res.status(400).json({ success: false, error: 'Instance ID required' });
            return;
        }
        const instance = await instance_manager_1.instanceManager.getInstance(String(instanceId));
        if (!instance) {
            res.status(404).json({ success: false, error: 'Instance not found' });
            return;
        }
        const configType = ALLOWED_TYPES.includes(String(type)) ? String(type) : 'ini';
        const filePath = getFilePath(instance.iniPath, configType);
        const content = await (0, promises_1.readFile)(filePath, 'utf-8');
        res.json({
            success: true,
            data: { content, path: filePath, type: configType }
        });
    }
    catch (err) {
        const error = err;
        // If file doesn't exist, return empty or specific error? 
        // Usually these files should exist if server is initialized.
        res.status(500).json({
            success: false,
            error: 'Failed to read config file',
            details: error.message,
        });
    }
};
exports.getIni = getIni;
/**
 * PUT /api/config/ini
 * Updates the Project Zomboid INI or Lua file with new content.
 */
const updateIni = async (req, res) => {
    try {
        const { content, instanceId, type } = req.body;
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
        const instance = await instance_manager_1.instanceManager.getInstance(String(instanceId));
        if (!instance) {
            res.status(404).json({ success: false, error: 'Instance not found' });
            return;
        }
        const configType = ALLOWED_TYPES.includes(String(type)) ? String(type) : 'ini';
        const filePath = getFilePath(instance.iniPath, configType);
        await (0, promises_1.writeFile)(filePath, content);
        res.json({
            success: true,
            message: `${configType.toUpperCase()} file updated successfully`
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update config file',
            details: err.message,
        });
    }
};
exports.updateIni = updateIni;
