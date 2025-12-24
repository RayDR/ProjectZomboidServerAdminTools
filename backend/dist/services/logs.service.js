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
exports.getLogStats = exports.clearLogWithBackup = exports.getRecentPlayersFromLog = exports.readLogFile = void 0;
const child_process_1 = require("child_process");
const env_1 = require("../config/env");
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const execPromise = (0, util_1.promisify)(child_process_1.exec);
/**
 * Read the last N lines from either the main or maintenance log.
 * @param type 'main' or 'maintenance'
 * @param lines number of lines to read
 */
const readLogFile = (type, lines) => {
    let logPath = env_1.config.pzLogPath;
    if (type === 'maintenance') {
        logPath = env_1.config.pzMaintenanceLogPath;
    }
    const baseCommand = `tail -n ${lines} ${logPath}`;
    // If it's an error log, filter with grep
    const command = type === 'errors'
        ? `${baseCommand} | grep -i error`
        : baseCommand;
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (err, stdout, stderr) => {
            if (err && !stdout)
                return reject(stderr || err.message);
            resolve(stdout || '[No matching lines found]');
        });
    });
};
exports.readLogFile = readLogFile;
/**
 * Parses the main server log and returns players that connected within the last hour.
 */
const getRecentPlayersFromLog = async () => {
    const logPath = env_1.config.pzLogPath;
    const fileStream = fs_1.default.createReadStream(logPath, { encoding: 'utf8' });
    const rl = readline_1.default.createInterface({ input: fileStream, crlfDelay: Infinity });
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;
    const players = new Set();
    for await (const line of rl) {
        if (!line.includes('username="'))
            continue;
        // Parse timestamp: example [15-06-25 05:15:30.993]
        const match = line.match(/\[(\d{2})-(\d{2})-(\d{2}) (\d{2}:\d{2}:\d{2})\]/);
        let logTime = now;
        if (match) {
            const [_, mm, dd, yy, time] = match;
            const formatted = `20${yy}/${mm}/${dd} ${time}`;
            const parsed = Date.parse(formatted);
            if (!isNaN(parsed))
                logTime = parsed;
        }
        if (now - logTime < oneHourMs) {
            const nameMatch = line.match(/username="([^"]+)"/);
            if (nameMatch)
                players.add(nameMatch[1]);
        }
    }
    return Array.from(players);
};
exports.getRecentPlayersFromLog = getRecentPlayersFromLog;
/**
 * Clear log file and create backup (only one backup per day)
 * @param type 'main' or 'maintenance'
 */
const clearLogWithBackup = async (type) => {
    const logPath = type === 'main' ? env_1.config.pzLogPath : env_1.config.pzMaintenanceLogPath;
    const logDir = path_1.default.dirname(logPath);
    const logFileName = path_1.default.basename(logPath);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const backupFileName = `${logFileName}.backup-${today}`;
    const backupPath = path_1.default.join(logDir, backupFileName);
    try {
        // Check if log file exists and has content
        const stats = await fs_1.default.promises.stat(logPath);
        if (stats.size === 0) {
            return {
                success: false,
                message: 'Log file is already empty, no backup created'
            };
        }
        // Check if backup for today already exists
        if (fs_1.default.existsSync(backupPath)) {
            // Check if existing backup has content
            const backupStats = await fs_1.default.promises.stat(backupPath);
            if (backupStats.size > 0) {
                return {
                    success: false,
                    message: `Backup already exists for today: ${backupFileName}. Only one backup per day is allowed.`
                };
            }
            else {
                // Existing backup is empty, we can overwrite it
                await fs_1.default.promises.unlink(backupPath);
            }
        }
        // Create backup
        await fs_1.default.promises.copyFile(logPath, backupPath);
        // Verify backup was created and has content
        const backupStats = await fs_1.default.promises.stat(backupPath);
        if (backupStats.size === 0) {
            await fs_1.default.promises.unlink(backupPath);
            return {
                success: false,
                message: 'Backup was empty and has been discarded'
            };
        }
        // Clear original log file
        await fs_1.default.promises.writeFile(logPath, '');
        return {
            success: true,
            message: `Log cleared successfully. Backup created: ${backupFileName}`,
            backup: backupFileName
        };
    }
    catch (error) {
        throw new Error(`Failed to clear log: ${error instanceof Error ? error.message : error}`);
    }
};
exports.clearLogWithBackup = clearLogWithBackup;
/**
 * Get log file size and line count
 */
const getLogStats = async (type) => {
    const logPath = type === 'main' ? env_1.config.pzLogPath : env_1.config.pzMaintenanceLogPath;
    try {
        const stats = await fs_1.default.promises.stat(logPath);
        const { stdout } = await execPromise(`wc -l < ${logPath}`);
        const totalLines = parseInt(stdout.trim()) || 0;
        const formatFileSize = (bytes) => {
            if (bytes === 0)
                return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
        };
        return {
            totalLines,
            fileSize: stats.size,
            fileSizeFormatted: formatFileSize(stats.size)
        };
    }
    catch (error) {
        throw new Error(`Failed to get log stats: ${error instanceof Error ? error.message : error}`);
    }
};
exports.getLogStats = getLogStats;
