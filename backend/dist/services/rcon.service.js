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
exports.runRconCommand = void 0;
exports.sendServerMessage = sendServerMessage;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs/promises"));
const env_1 = require("../config/env");
const instances_service_1 = require("./instances.service");
/**
 * Helper: Extract RCON password from INI file
 */
async function getRconPassword(instance) {
    try {
        const iniContent = await fs.readFile(instance.iniPath, 'utf-8');
        const match = iniContent.match(/RCONPassword=(.*)/);
        if (match && match[1]) {
            return match[1].trim();
        }
        return env_1.config.pzRconPassword; // Fallback
    }
    catch (error) {
        console.warn(`[RCON] Failed to read INI for password, using default: ${error}`);
        return env_1.config.pzRconPassword;
    }
}
/**
 * Sends a broadcast message using mcrcon.
 */
async function sendServerMessage(instanceId, message) {
    const instance = await (0, instances_service_1.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance ${instanceId} not found`);
    const password = await getRconPassword(instance);
    const escaped = message.replace(/"/g, '\\"');
    // Assuming mcrcon is installed and we use it for quick broadcasts
    const cmd = `/usr/local/bin/mcrcon -H ${env_1.config.pzRconHost} -P ${instance.rconPort} -p "${password}" "servermsg \\"${escaped}\\""`;
    (0, child_process_1.exec)(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`[RCON] ❌ Failed to send message to ${instance.name}:`, error.message);
        }
        else {
            console.log(`[RCON] ✅ Message sent to ${instance.name}:`, stdout.trim());
        }
    });
}
/**
 * Run a raw RCON command using Rcon module (TCP).
 */
const runRconCommand = async (instanceId, command) => {
    const instance = await (0, instances_service_1.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance ${instanceId} not found`);
    const password = await getRconPassword(instance);
    return new Promise((resolve, reject) => {
        const Rcon = require('rcon');
        const rcon = new Rcon(env_1.config.pzRconHost, instance.rconPort, password, {
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
            // Sometimes connection refuses if server is down
            reject(new Error(`[RCON] Error: ${err.message}`));
        });
        rcon.on('end', () => {
            // Handle disconnect if no response?
        });
        rcon.connect();
    });
};
exports.runRconCommand = runRconCommand;
