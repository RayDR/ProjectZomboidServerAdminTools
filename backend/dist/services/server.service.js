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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBackup = exports.listBackups = exports.createBackup = exports.updateServer = exports.getServerStatus = exports.restartServer = exports.stopServer = exports.startServer = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const env_1 = require("../config/env");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
const archiver_1 = __importDefault(require("archiver"));
const execPromise = (0, util_1.promisify)(child_process_1.exec);
/**
 * Server Control Service
 * Handles all server operations without bash script dependencies
 */
/**
 * Start the Project Zomboid server
 */
const startServer = async () => {
    try {
        const { stdout, stderr } = await execPromise(`sudo systemctl start ${env_1.config.pzService}`);
        // Wait a few seconds to check if it actually started
        await new Promise(resolve => setTimeout(resolve, 3000));
        const status = await (0, exports.getServerStatus)();
        if (!status.running) {
            throw new Error('Server failed to start');
        }
        return 'Server started successfully';
    }
    catch (error) {
        throw new Error(`Failed to start server: ${error instanceof Error ? error.message : error}`);
    }
};
exports.startServer = startServer;
/**
 * Stop the Project Zomboid server
 */
const stopServer = async () => {
    try {
        const { stdout, stderr } = await execPromise(`sudo systemctl stop ${env_1.config.pzService}`);
        // Wait for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 5000));
        return 'Server stopped successfully';
    }
    catch (error) {
        throw new Error(`Failed to stop server: ${error instanceof Error ? error.message : error}`);
    }
};
exports.stopServer = stopServer;
/**
 * Restart the Project Zomboid server
 */
const restartServer = async () => {
    try {
        const { stdout, stderr } = await execPromise(`sudo systemctl restart ${env_1.config.pzService}`);
        // Wait for restart
        await new Promise(resolve => setTimeout(resolve, 5000));
        const status = await (0, exports.getServerStatus)();
        if (!status.running) {
            throw new Error('Server failed to restart');
        }
        return 'Server restarted successfully';
    }
    catch (error) {
        throw new Error(`Failed to restart server: ${error instanceof Error ? error.message : error}`);
    }
};
exports.restartServer = restartServer;
/**
 * Get detailed server status
 */
const getServerStatus = async () => {
    try {
        // Check if systemd service is active
        const { stdout: serviceStatus } = await execPromise(`systemctl is-active ${env_1.config.pzService}`).catch(() => ({ stdout: 'inactive' }));
        const isServiceActive = serviceStatus.trim() === 'active';
        if (!isServiceActive) {
            return {
                running: false,
                uptime: null,
                pid: null,
                memory: null,
                status: 'stopped'
            };
        }
        // Get PID from systemd (more reliable than pgrep)
        const { stdout: pidOutput } = await execPromise(`systemctl show ${env_1.config.pzService} --property=MainPID --value`);
        const pid = parseInt(pidOutput.trim());
        if (!pid || pid === 0) {
            return {
                running: false,
                uptime: null,
                pid: null,
                memory: null,
                status: 'stopped'
            };
        }
        // Get process details
        const { stdout: psOutput } = await execPromise(`ps -p ${pid} -o etime=,rss= 2>/dev/null || echo ""`);
        const [uptime, rss] = psOutput.trim().split(/\s+/);
        const memoryMB = rss ? Math.round(parseInt(rss) / 1024) : null;
        return {
            running: true,
            uptime: uptime || null,
            pid,
            memory: memoryMB ? `${memoryMB} MB` : null,
            status: 'running'
        };
    }
    catch (error) {
        return {
            running: false,
            uptime: null,
            pid: null,
            memory: null,
            status: 'unknown'
        };
    }
};
exports.getServerStatus = getServerStatus;
/**
 * Update the Project Zomboid server via SteamCMD
 */
const updateServer = async () => {
    return new Promise((resolve, reject) => {
        const updateCommand = `${env_1.config.pzSteamcmdPath} +login anonymous +force_install_dir ${env_1.config.pzDir} +app_update 380870 validate +quit`;
        const process = (0, child_process_1.spawn)('bash', ['-c', updateCommand], {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        let output = '';
        let error = '';
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        process.stderr.on('data', (data) => {
            error += data.toString();
        });
        process.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Update failed with code ${code}: ${error}`));
            }
            else {
                resolve('Server updated successfully');
            }
        });
        process.on('error', (err) => {
            reject(new Error(`Failed to execute update: ${err.message}`));
        });
    });
};
exports.updateServer = updateServer;
/**
 * Create a backup of the server files
 */
const createBackup = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = '/opt/pzserver/backups';
    const filename = `pzserver-backup-${timestamp}.zip`;
    const backupPath = path.join(backupDir, filename);
    try {
        // Ensure backup directory exists
        await fs.mkdir(backupDir, { recursive: true });
        // Create zip archive
        const output = (0, fs_1.createWriteStream)(backupPath);
        const archive = (0, archiver_1.default)('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        return new Promise((resolve, reject) => {
            output.on('close', async () => {
                const stats = await fs.stat(backupPath);
                resolve({
                    filename,
                    path: backupPath,
                    size: stats.size,
                    timestamp: new Date().toISOString()
                });
            });
            archive.on('error', (err) => {
                reject(new Error(`Backup failed: ${err.message}`));
            });
            archive.pipe(output);
            // Add server files to archive
            const serverName = env_1.config.pzName;
            const savePath = `/home/pzadmin/Zomboid/Server/${serverName}`;
            // Add save files
            archive.directory(savePath, 'Saves');
            // Add server configuration
            archive.file(env_1.config.pzIniPath, { name: `${serverName}.ini` });
            // Finalize the archive
            archive.finalize();
        });
    }
    catch (error) {
        throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : error}`);
    }
};
exports.createBackup = createBackup;
/**
 * List all available backups
 */
const listBackups = async () => {
    const backupDir = '/opt/pzserver/backups';
    try {
        const files = await fs.readdir(backupDir);
        const backupFiles = files.filter(f => f.endsWith('.zip'));
        const backups = await Promise.all(backupFiles.map(async (filename) => {
            const filePath = path.join(backupDir, filename);
            const stats = await fs.stat(filePath);
            return {
                filename,
                path: filePath,
                size: stats.size,
                sizeFormatted: formatBytes(stats.size),
                created: stats.mtime,
                createdFormatted: stats.mtime.toISOString()
            };
        }));
        // Sort by date, newest first
        return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    }
    catch (error) {
        throw new Error(`Failed to list backups: ${error instanceof Error ? error.message : error}`);
    }
};
exports.listBackups = listBackups;
/**
 * Delete a backup file
 */
const deleteBackup = async (filename) => {
    const backupDir = '/opt/pzserver/backups';
    const backupPath = path.join(backupDir, filename);
    try {
        // Validate filename to prevent directory traversal
        if (filename.includes('..') || filename.includes('/')) {
            throw new Error('Invalid filename');
        }
        if (!filename.endsWith('.zip')) {
            throw new Error('Only .zip files can be deleted');
        }
        await fs.unlink(backupPath);
        return `Backup ${filename} deleted successfully`;
    }
    catch (error) {
        throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : error}`);
    }
};
exports.deleteBackup = deleteBackup;
/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
