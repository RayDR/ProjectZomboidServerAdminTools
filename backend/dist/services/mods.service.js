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
exports.validateMods = exports.updateAllMods = exports.uninstallMod = exports.installMod = exports.getInstalledMods = void 0;
const fs = __importStar(require("fs/promises"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const env_1 = require("../config/env");
const path = __importStar(require("path"));
const execPromise = (0, util_1.promisify)(child_process_1.exec);
/**
 * Mods Service
 * Handles Workshop mods installation and management
 */
/**
 * Parse the server INI file to get installed mods
 */
const getInstalledMods = async () => {
    try {
        const iniContent = await fs.readFile(env_1.config.pzIniPath, 'utf-8');
        // Extract Mods= and WorkshopItems= lines
        const modsMatch = iniContent.match(/^Mods=(.*)$/m);
        const workshopMatch = iniContent.match(/^WorkshopItems=(.*)$/m);
        if (!modsMatch) {
            return [];
        }
        const modIds = modsMatch[1].split(';').filter(id => id.trim());
        const workshopIds = workshopMatch ? workshopMatch[1].split(';').filter(id => id.trim()) : [];
        // Map mod IDs to workshop IDs
        const mods = modIds.map((id, index) => ({
            id: id.trim(),
            name: id.trim(), // We'll use the ID as name for now
            workshopId: workshopIds[index] || undefined
        }));
        return mods;
    }
    catch (error) {
        throw new Error(`Failed to read installed mods: ${error instanceof Error ? error.message : error}`);
    }
};
exports.getInstalledMods = getInstalledMods;
/**
 * Install a mod from Steam Workshop
 */
const installMod = async (workshopId, modId) => {
    try {
        // Download mod via SteamCMD
        const downloadCommand = `${env_1.config.pzSteamcmdPath} +login anonymous +workshop_download_item 108600 ${workshopId} +quit`;
        await new Promise((resolve, reject) => {
            const process = (0, child_process_1.spawn)('bash', ['-c', downloadCommand], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            let error = '';
            process.stderr.on('data', (data) => {
                error += data.toString();
            });
            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Failed to download mod: ${error}`));
                }
                else {
                    resolve();
                }
            });
            process.on('error', (err) => {
                reject(err);
            });
        });
        // Update server INI file
        const iniContent = await fs.readFile(env_1.config.pzIniPath, 'utf-8');
        let updatedContent = iniContent;
        // Add to Mods= line
        const modsMatch = iniContent.match(/^Mods=(.*)$/m);
        if (modsMatch) {
            const currentMods = modsMatch[1];
            const newMods = currentMods ? `${currentMods};${modId}` : modId;
            updatedContent = updatedContent.replace(/^Mods=.*$/m, `Mods=${newMods}`);
        }
        else {
            updatedContent += `\nMods=${modId}`;
        }
        // Add to WorkshopItems= line
        const workshopMatch = iniContent.match(/^WorkshopItems=(.*)$/m);
        if (workshopMatch) {
            const currentItems = workshopMatch[1];
            const newItems = currentItems ? `${currentItems};${workshopId}` : workshopId;
            updatedContent = updatedContent.replace(/^WorkshopItems=.*$/m, `WorkshopItems=${newItems}`);
        }
        else {
            updatedContent += `\nWorkshopItems=${workshopId}`;
        }
        // Write updated INI
        await fs.writeFile(env_1.config.pzIniPath, updatedContent, 'utf-8');
        return `Mod ${modId} (${workshopId}) installed successfully`;
    }
    catch (error) {
        throw new Error(`Failed to install mod: ${error instanceof Error ? error.message : error}`);
    }
};
exports.installMod = installMod;
/**
 * Uninstall a mod
 */
const uninstallMod = async (modId) => {
    try {
        const iniContent = await fs.readFile(env_1.config.pzIniPath, 'utf-8');
        // Remove from Mods= line
        const modsMatch = iniContent.match(/^Mods=(.*)$/m);
        if (modsMatch) {
            const mods = modsMatch[1].split(';').filter(id => id.trim() !== modId);
            const updatedContent = iniContent.replace(/^Mods=.*$/m, `Mods=${mods.join(';')}`);
            await fs.writeFile(env_1.config.pzIniPath, updatedContent, 'utf-8');
            return `Mod ${modId} uninstalled successfully`;
        }
        throw new Error('Mod not found in configuration');
    }
    catch (error) {
        throw new Error(`Failed to uninstall mod: ${error instanceof Error ? error.message : error}`);
    }
};
exports.uninstallMod = uninstallMod;
/**
 * Update all mods
 */
const updateAllMods = async () => {
    try {
        const mods = await (0, exports.getInstalledMods)();
        const workshopIds = mods
            .map(m => m.workshopId)
            .filter((id) => id !== undefined);
        if (workshopIds.length === 0) {
            return 'No workshop mods to update';
        }
        // Update all workshop items
        const workshopCommands = workshopIds
            .map(id => `+workshop_download_item 108600 ${id}`)
            .join(' ');
        const updateCommand = `${env_1.config.pzSteamcmdPath} +login anonymous ${workshopCommands} +quit`;
        await new Promise((resolve, reject) => {
            const process = (0, child_process_1.spawn)('bash', ['-c', updateCommand], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            let error = '';
            process.stderr.on('data', (data) => {
                error += data.toString();
            });
            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Failed to update mods: ${error}`));
                }
                else {
                    resolve();
                }
            });
            process.on('error', (err) => {
                reject(err);
            });
        });
        return `Updated ${workshopIds.length} mods successfully`;
    }
    catch (error) {
        throw new Error(`Failed to update mods: ${error instanceof Error ? error.message : error}`);
    }
};
exports.updateAllMods = updateAllMods;
/**
 * Validate mod files
 */
const validateMods = async () => {
    try {
        const mods = await (0, exports.getInstalledMods)();
        const workshopPath = path.join(env_1.config.pzSteamcmdPath, '..', 'steamapps', 'workshop', 'content', '108600');
        const invalid = [];
        let valid = 0;
        for (const mod of mods) {
            if (mod.workshopId) {
                const modPath = path.join(workshopPath, mod.workshopId);
                try {
                    await fs.access(modPath);
                    valid++;
                }
                catch {
                    invalid.push(mod.id);
                }
            }
        }
        return { valid, invalid };
    }
    catch (error) {
        throw new Error(`Failed to validate mods: ${error instanceof Error ? error.message : error}`);
    }
};
exports.validateMods = validateMods;
