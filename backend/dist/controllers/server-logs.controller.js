"use strict";
/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
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
exports.streamUpdateLogs = exports.streamBackupLogs = exports.streamServerLogs = void 0;
const child_process_1 = require("child_process");
const env_1 = require("../config/env");
/**
 * Stream server operation logs using Server-Sent Events
 * GET /api/server/logs/stream/:operation
 */
const streamServerLogs = (req, res) => {
    const { operation } = req.params;
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const sendLog = (data) => {
        res.write(`data: ${JSON.stringify({ log: data, timestamp: new Date().toISOString() })}\n\n`);
    };
    const sendError = (error) => {
        res.write(`data: ${JSON.stringify({ error, timestamp: new Date().toISOString() })}\n\n`);
    };
    const sendComplete = (success, message) => {
        res.write(`data: ${JSON.stringify({ complete: true, success, message, timestamp: new Date().toISOString() })}\n\n`);
        res.end();
    };
    try {
        let command;
        let args;
        switch (operation) {
            case 'start':
                sendLog('🚀 Starting Project Zomboid server...');
                command = 'sudo';
                args = ['systemctl', 'start', env_1.config.pzService];
                break;
            case 'stop':
                sendLog('🛑 Stopping Project Zomboid server...');
                command = 'sudo';
                args = ['systemctl', 'stop', env_1.config.pzService];
                break;
            case 'restart':
                sendLog('🔄 Restarting Project Zomboid server...');
                command = 'sudo';
                args = ['systemctl', 'restart', env_1.config.pzService];
                break;
            default:
                sendError(`Unknown operation: ${operation}`);
                sendComplete(false, 'Invalid operation');
                return;
        }
        // Execute the command
        const process = (0, child_process_1.spawn)(command, args);
        process.stdout.on('data', (data) => {
            sendLog(data.toString());
        });
        process.stderr.on('data', (data) => {
            sendLog(data.toString());
        });
        process.on('close', async (code) => {
            if (code === 0) {
                sendLog(`✅ Command executed successfully (exit code: ${code})`);
                // Wait a bit for the service to stabilize
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Get journal logs to show what happened
                sendLog('📋 Fetching service logs...');
                const journal = (0, child_process_1.spawn)('sudo', ['journalctl', '-u', env_1.config.pzService, '-n', '20', '--no-pager']);
                journal.stdout.on('data', (data) => {
                    sendLog(data.toString());
                });
                journal.on('close', () => {
                    sendComplete(true, `Server ${operation} completed successfully`);
                });
            }
            else {
                sendError(`Command failed with exit code: ${code}`);
                sendComplete(false, `Server ${operation} failed`);
            }
        });
        process.on('error', (error) => {
            sendError(`Process error: ${error.message}`);
            sendComplete(false, error.message);
        });
        // Handle client disconnect
        req.on('close', () => {
            process.kill();
        });
    }
    catch (error) {
        sendError(`Exception: ${error instanceof Error ? error.message : error}`);
        sendComplete(false, 'Operation failed');
    }
};
exports.streamServerLogs = streamServerLogs;
/**
 * Stream backup operation logs
 * GET /api/server/logs/stream/backup
 */
const streamBackupLogs = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const sendLog = (data) => {
        res.write(`data: ${JSON.stringify({ log: data, timestamp: new Date().toISOString() })}\n\n`);
    };
    const sendComplete = (success, message) => {
        res.write(`data: ${JSON.stringify({ complete: true, success, message, timestamp: new Date().toISOString() })}\n\n`);
        res.end();
    };
    sendLog('💾 Starting backup process...');
    // Import backup function dynamically
    Promise.resolve().then(() => __importStar(require('../services/server.service'))).then(({ createBackup }) => {
        createBackup()
            .then((result) => {
            sendLog(`✅ Backup created: ${result.filename}`);
            sendLog(`📁 Path: ${result.path}`);
            sendLog(`📦 Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
            sendComplete(true, `Backup created successfully: ${result.filename}`);
        })
            .catch((error) => {
            sendLog(`❌ Backup failed: ${error.message}`);
            sendComplete(false, error.message);
        });
    });
};
exports.streamBackupLogs = streamBackupLogs;
/**
 * Stream update operation logs
 * GET /api/server/logs/stream/update
 */
const streamUpdateLogs = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const sendLog = (data) => {
        res.write(`data: ${JSON.stringify({ log: data, timestamp: new Date().toISOString() })}\n\n`);
    };
    const sendComplete = (success, message) => {
        res.write(`data: ${JSON.stringify({ complete: true, success, message, timestamp: new Date().toISOString() })}\n\n`);
        res.end();
    };
    sendLog('📥 Starting SteamCMD update...');
    sendLog(`Command: ${env_1.config.pzSteamcmdPath} +login anonymous +force_install_dir ${env_1.config.pzDir} +app_update 380870 validate +quit`);
    const process = (0, child_process_1.spawn)(env_1.config.pzSteamcmdPath, [
        '+login', 'anonymous',
        '+force_install_dir', env_1.config.pzDir,
        '+app_update', '380870', 'validate',
        '+quit'
    ]);
    process.stdout.on('data', (data) => {
        sendLog(data.toString());
    });
    process.stderr.on('data', (data) => {
        sendLog(data.toString());
    });
    process.on('close', (code) => {
        if (code === 0) {
            sendLog('✅ Update completed successfully');
            sendComplete(true, 'Server updated successfully');
        }
        else {
            sendLog(`❌ Update failed with exit code: ${code}`);
            sendComplete(false, 'Update failed');
        }
    });
    req.on('close', () => {
        process.kill();
    });
};
exports.streamUpdateLogs = streamUpdateLogs;
