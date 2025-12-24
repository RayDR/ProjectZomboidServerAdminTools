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
exports.updateInstance = exports.addInstance = exports.getInstancesStatus = exports.forceStopInstance = exports.restartInstance = exports.stopInstance = exports.startInstance = exports.getInstanceById = exports.getInstances = exports.saveInstances = exports.loadInstances = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
const INSTANCES_CONFIG_PATH = path.join(__dirname, '../config/instances.json');
/**
 * Load instances configuration
 */
const loadInstances = async () => {
    try {
        const data = await fs.readFile(INSTANCES_CONFIG_PATH, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error(`Failed to load instances configuration: ${error}`);
    }
};
exports.loadInstances = loadInstances;
/**
 * Save instances configuration
 */
const saveInstances = async (config) => {
    try {
        await fs.writeFile(INSTANCES_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    }
    catch (error) {
        throw new Error(`Failed to save instances configuration: ${error}`);
    }
};
exports.saveInstances = saveInstances;
/**
 * Get all server instances
 */
const getInstances = async () => {
    const config = await (0, exports.loadInstances)();
    return config.instances;
};
exports.getInstances = getInstances;
/**
 * Get instance by ID
 */
const getInstanceById = async (id) => {
    const config = await (0, exports.loadInstances)();
    return config.instances.find(i => i.id === id) || null;
};
exports.getInstanceById = getInstanceById;
/**
 * Start an instance
 */
const startInstance = async (instanceId) => {
    const instance = await (0, exports.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance with ID ${instanceId} not found`);
    try {
        await execPromise(`sudo systemctl start ${instance.serviceName}`);
        return `Instance ${instance.name} started`;
    }
    catch (error) {
        throw new Error(`Failed to start instance: ${error}`);
    }
};
exports.startInstance = startInstance;
/**
 * Stop an instance
 */
const stopInstance = async (instanceId) => {
    const instance = await (0, exports.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance with ID ${instanceId} not found`);
    try {
        await execPromise(`sudo systemctl stop ${instance.serviceName}`);
        return `Instance ${instance.name} stopped`;
    }
    catch (error) {
        throw new Error(`Failed to stop instance: ${error}`);
    }
};
exports.stopInstance = stopInstance;
/**
 * Restart an instance
 */
const restartInstance = async (instanceId) => {
    const instance = await (0, exports.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance with ID ${instanceId} not found`);
    try {
        await execPromise(`sudo systemctl restart ${instance.serviceName}`);
        return `Instance ${instance.name} restarted`;
    }
    catch (error) {
        throw new Error(`Failed to restart instance: ${error}`);
    }
};
exports.restartInstance = restartInstance;
/**
 * Force Stop an instance (KILL)
 */
const forceStopInstance = async (instanceId) => {
    const instance = await (0, exports.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance with ID ${instanceId} not found`);
    try {
        await execPromise(`sudo systemctl kill -s SIGKILL ${instance.serviceName}`);
        return `Instance ${instance.name} force stopped`;
    }
    catch (error) {
        throw new Error(`Failed to force stop instance: ${error}`);
    }
};
exports.forceStopInstance = forceStopInstance;
/**
 * Get status of all instances
 */
const getInstancesStatus = async () => {
    const instances = await (0, exports.getInstances)();
    const statusPromises = instances.map(async (instance) => {
        try {
            const { stdout } = await execPromise(`systemctl is-active ${instance.serviceName}`);
            const running = stdout.trim() === 'active';
            let pid = undefined;
            if (running) {
                try {
                    // Get Main PID
                    const { stdout: pidOut } = await execPromise(`systemctl show --property=MainPID --value ${instance.serviceName}`);
                    pid = pidOut.trim();
                    if (pid === '0')
                        pid = undefined;
                }
                catch (e) { /* ignore */ }
            }
            return { ...instance, running, pid };
        }
        catch {
            return { ...instance, running: false };
        }
    });
    return Promise.all(statusPromises);
};
exports.getInstancesStatus = getInstancesStatus;
/**
 * Add a new instance
 */
const addInstance = async (name, pathDir, serviceName) => {
    // Basic validation
    try {
        await fs.access(pathDir);
    }
    catch {
        throw new Error(`Directory ${pathDir} does not accessable`);
    }
    // Attempt to guess config
    // This is basic; in real implementation we might parse .ini
    // For now we assume standard paths based on directory or inputs
    // BUT user asked to "automatically read data".
    // We can look for *.ini in standard locations or inside the dir?
    // Given the setup, INIs are in /home/pzadmin/Zomboid/Server
    // Let's create the instance entry
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newInstance = {
        id,
        name,
        description: `Custom Instance - ${name}`,
        version: "Unknown", // Would need to parse logs or json
        serviceName,
        pzDir: pathDir,
        pzName: `pz${id}`, // Assumption
        logPath: path.join(pathDir, 'logs', 'server.log'),
        maintenanceLogPath: path.join(pathDir, 'logs', 'maintenance.log'),
        iniPath: `/home/pzadmin/Zomboid/Server/pz${id}.ini`, // Assumption
        savePath: `/home/pzadmin/Zomboid/Saves/Multiplayer/pz${id}`,
        db: `/home/pzadmin/Zomboid/db/pz${id}.db`,
        rconPort: 0, // Placeholder
        gamePort: 16261, // Placeholder
        isActive: false
    };
    const config = await (0, exports.loadInstances)();
    config.instances.push(newInstance);
    await (0, exports.saveInstances)(config);
    return newInstance;
};
exports.addInstance = addInstance;
/**
 * Update instance configuration
 */
const updateInstance = async (instanceId, updates) => {
    const config = await (0, exports.loadInstances)();
    const instance = config.instances.find(i => i.id === instanceId);
    if (!instance) {
        throw new Error(`Instance with ID ${instanceId} not found`);
    }
    Object.assign(instance, updates);
    await (0, exports.saveInstances)(config);
    return instance;
};
exports.updateInstance = updateInstance;
