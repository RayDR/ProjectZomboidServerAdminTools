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
exports.streamLogsController = exports.getPlayersFromLogs = exports.getLog = void 0;
const logs_service_1 = require("../services/logs.service");
const logs_service_2 = require("../services/logs.service");
const getLog = async (req, res) => {
    const allowedTypes = ['main', 'maintenance', 'errors'];
    const { type = 'main', lines = 500, instanceId } = req.query;
    if (!instanceId) {
        res.status(400).json({ success: false, error: 'Instance ID is required' });
        return;
    }
    const logType = allowedTypes.includes(type)
        ? type
        : 'main';
    try {
        const content = await (0, logs_service_1.readLogFile)(String(instanceId), logType, Number(lines));
        res.json({
            success: true,
            data: {
                content,
                type: logType,
                lines: content.split('\n').length
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to read log file',
            details: error instanceof Error ? error.message : error,
        });
    }
};
exports.getLog = getLog;
const getPlayersFromLogs = async (req, res) => {
    try {
        const { instanceId } = req.query;
        if (!instanceId) {
            res.status(400).json({ error: 'Instance ID required' });
            return;
        }
        const players = await (0, logs_service_2.getRecentPlayersFromLog)(String(instanceId));
        res.json({ players });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to read recent players from logs',
            details: error instanceof Error ? error.message : error,
        });
    }
};
exports.getPlayersFromLogs = getPlayersFromLogs;
const streamLogsController = (req, res) => {
    const { instanceId } = req.query;
    Promise.resolve().then(() => __importStar(require('../services/logs.service'))).then(service => {
        service.streamLog(String(instanceId), res);
    });
};
exports.streamLogsController = streamLogsController;
