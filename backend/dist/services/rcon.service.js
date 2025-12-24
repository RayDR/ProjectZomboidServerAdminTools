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
exports.runRconCommand = void 0;
exports.sendServerMessage = sendServerMessage;
const child_process_1 = require("child_process");
const env_1 = require("../config/env");
/**
 * Sends a broadcast message using mcrcon.
 */
function sendServerMessage(message) {
    const escaped = message.replace(/"/g, '\\"');
    const cmd = `/usr/local/bin/mcrcon -H ${env_1.config.pzRconHost} -P ${env_1.config.pzRconPort} -p "${env_1.config.pzRconPassword}" "servermsg \\"${escaped}\\""`;
    (0, child_process_1.exec)(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('[RCON] ❌ Failed to send message:', error.message);
        }
        else {
            console.log('[RCON] ✅ Message sent:', stdout.trim());
        }
    });
}
/**
 * Optional fallback: Run a raw RCON command using Rcon module (TCP).
 */
const runRconCommand = (command) => {
    return new Promise((resolve, reject) => {
        const Rcon = require('rcon');
        const rcon = new Rcon(env_1.config.pzRconHost, env_1.config.pzRconPort, env_1.config.pzRconPassword, {
            tcp: true,
            challenge: false,
            timeout: 3000,
        });
        rcon.on('auth', () => rcon.send(command));
        rcon.on('response', (res) => {
            rcon.disconnect();
            resolve(res.trim());
        });
        rcon.on('error', (err) => {
            rcon.disconnect();
            reject(new Error(`[RCON] Error: ${err.message}`));
        });
        rcon.connect();
    });
};
exports.runRconCommand = runRconCommand;
