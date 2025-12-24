"use strict";
/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerConfig = exports.getServerName = void 0;
const fs_1 = require("fs");
const SERVER_INI_PATH = '/home/steam/Zomboid/Server/servertest.ini';
const getServerName = async () => {
    try {
        const content = await fs_1.promises.readFile(SERVER_INI_PATH, 'utf-8');
        const lines = content.split('\n');
        // Find PublicName or ServerName
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('PublicName=')) {
                return trimmed.split('=')[1].trim();
            }
            if (trimmed.startsWith('ServerName=')) {
                return trimmed.split('=')[1].trim();
            }
        }
        return 'Project Zomboid Server';
    }
    catch (error) {
        console.error('Error reading server name from INI:', error);
        return 'Project Zomboid Server';
    }
};
exports.getServerName = getServerName;
const getServerConfig = async () => {
    try {
        const serverName = await (0, exports.getServerName)();
        return {
            success: true,
            data: {
                serverName,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message || 'Failed to get server config',
        };
    }
};
exports.getServerConfig = getServerConfig;
