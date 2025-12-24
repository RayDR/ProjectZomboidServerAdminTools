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
exports.validateModsController = exports.updateAllModsController = exports.uninstallModController = exports.installModController = exports.getInstalledModsController = void 0;
const modsService = __importStar(require("../services/mods.service"));
/**
 * Get installed mods
 */
const getInstalledModsController = async (_req, res) => {
    try {
        const mods = await modsService.getInstalledMods();
        res.json({ success: true, data: mods });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get installed mods'
        });
    }
};
exports.getInstalledModsController = getInstalledModsController;
/**
 * Install a mod
 */
const installModController = async (req, res) => {
    try {
        const { workshopId, modId } = req.body;
        if (!workshopId || !modId) {
            res.status(400).json({
                success: false,
                error: 'workshopId and modId are required'
            });
            return;
        }
        const result = await modsService.installMod(workshopId, modId);
        res.json({ success: true, message: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to install mod'
        });
    }
};
exports.installModController = installModController;
/**
 * Uninstall a mod
 */
const uninstallModController = async (req, res) => {
    try {
        const { modId } = req.params;
        if (!modId) {
            res.status(400).json({
                success: false,
                error: 'modId is required'
            });
            return;
        }
        const result = await modsService.uninstallMod(modId);
        res.json({ success: true, message: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to uninstall mod'
        });
    }
};
exports.uninstallModController = uninstallModController;
/**
 * Update all mods
 */
const updateAllModsController = async (_req, res) => {
    try {
        const result = await modsService.updateAllMods();
        res.json({ success: true, message: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update mods'
        });
    }
};
exports.updateAllModsController = updateAllModsController;
/**
 * Validate mods
 */
const validateModsController = async (_req, res) => {
    try {
        const result = await modsService.validateMods();
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to validate mods'
        });
    }
};
exports.validateModsController = validateModsController;
