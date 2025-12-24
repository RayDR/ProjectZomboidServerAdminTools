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
exports.updateInstanceController = exports.addInstanceController = exports.forceStopInstanceController = exports.restartInstanceController = exports.stopInstanceController = exports.startInstanceController = exports.getInstancesController = void 0;
const instancesService = __importStar(require("../services/instances.service"));
/**
 * Get all server instances
 */
const getInstancesController = async (_req, res) => {
    try {
        const instances = await instancesService.getInstancesStatus();
        res.json({ success: true, data: instances });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get instances'
        });
    }
};
exports.getInstancesController = getInstancesController;
/**
 * Start an instance
 */
const startInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const message = await instancesService.startInstance(instanceId);
        res.json({ success: true, message });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to start instance'
        });
    }
};
exports.startInstanceController = startInstanceController;
/**
 * Stop an instance
 */
const stopInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const message = await instancesService.stopInstance(instanceId);
        res.json({ success: true, message });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to stop instance'
        });
    }
};
exports.stopInstanceController = stopInstanceController;
/**
 * Restart an instance
 */
const restartInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const message = await instancesService.restartInstance(instanceId);
        res.json({ success: true, message });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to restart instance'
        });
    }
};
exports.restartInstanceController = restartInstanceController;
/**
 * Force Stop an instance
 */
const forceStopInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const message = await instancesService.forceStopInstance(instanceId);
        res.json({ success: true, message });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to force stop instance'
        });
    }
};
exports.forceStopInstanceController = forceStopInstanceController;
/**
 * Add a new instance
 */
const addInstanceController = async (req, res) => {
    try {
        const { name, path, serviceName } = req.body;
        if (!name || !path || !serviceName) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        const instance = await instancesService.addInstance(name, path, serviceName);
        res.json({ success: true, data: instance });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add instance'
        });
    }
};
exports.addInstanceController = addInstanceController;
/**
 * Update instance configuration
 */
const updateInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const updates = req.body;
        const instance = await instancesService.updateInstance(instanceId, updates);
        res.json({ success: true, data: instance });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update instance'
        });
    }
};
exports.updateInstanceController = updateInstanceController;
