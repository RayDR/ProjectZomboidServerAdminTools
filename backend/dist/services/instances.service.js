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
exports.installLocalMod = exports.removeMod = exports.addMod = exports.getMods = exports.updateInstance = exports.addInstance = exports.getInstancesStatus = exports.forceStopInstance = exports.restartInstance = exports.stopInstance = exports.startInstance = exports.createInstanceFromVersion = exports.getAvailableVersions = exports.getInstanceById = exports.getInstances = exports.saveInstances = exports.loadInstances = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const steamcmd_service_1 = require("./steamcmd.service");
const execFilePromise = (0, util_1.promisify)(child_process_1.execFile);
const INSTANCES_CONFIG_PATH = path.join(__dirname, '../config/instances.json');
const safeSystemctl = async (action, serviceName, extraArgs = []) => {
    if (!/^pzomboid-[a-zA-Z0-9-]+$/.test(serviceName)) {
        throw new Error(`Invalid service name format: ${serviceName}`);
    }
    // Enforce allowlist: ensure the serviceName exists in instances.json
    const config = await (0, exports.loadInstances)();
    const isValidInstance = config.instances.some(i => i.serviceName === serviceName);
    if (!isValidInstance) {
        throw new Error(`Security Violation: Service ${serviceName} is not a registered instance.`);
    }
    return await execFilePromise('sudo', ['/usr/bin/systemctl', action, ...extraArgs, serviceName]);
};
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
 * Detect available PZ server builds from SteamCMD
 */
const getAvailableVersions = async () => {
    const branches = await (0, steamcmd_service_1.getAvailableBuilds)();
    return branches.map(branch => ({
        id: branch.name,
        name: branch.name === 'public' ? 'Stable (public)' : `Beta - ${branch.name}`,
        description: branch.description,
        buildid: branch.buildid
    }));
};
exports.getAvailableVersions = getAvailableVersions;
/**
 * Create a new instance from a selected branch
 */
const createInstanceFromVersion = async (branch, name, gamePort, rconPort) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const serviceName = `pzomboid-${id}`;
    const pzDir = `/opt/pzserver-${id}`;
    const pzName = `pz${id}`;
    try {
        // Run the setup script securely
        await execFilePromise('sudo', [
            'bash',
            '/opt/pzwebadmin/scripts/setup-instance-steamcmd.sh',
            branch,
            name,
            gamePort.toString(),
            rconPort.toString()
        ]);
    }
    catch (error) {
        throw new Error(`Failed to create instance via steamcmd: ${error}`);
    }
    const newInstance = {
        id,
        name,
        description: `Instancia basada en rama ${branch}`,
        version: branch,
        serviceName,
        pzDir,
        pzName,
        logPath: `${pzDir}/logs/server.log`,
        maintenanceLogPath: `${pzDir}/logs/maintenance.log`,
        iniPath: `/home/pzadmin/Zomboid/Server/${pzName}.ini`,
        savePath: `/home/pzadmin/Zomboid/Saves/Multiplayer/${pzName}`,
        db: `/home/pzadmin/Zomboid/db/${pzName}.db`,
        rconPort,
        gamePort,
        isActive: false
    };
    const config = await (0, exports.loadInstances)();
    config.instances.push(newInstance);
    await (0, exports.saveInstances)(config);
    return newInstance;
};
exports.createInstanceFromVersion = createInstanceFromVersion;
/**
 * Start an instance
 */
const startInstance = async (instanceId) => {
    const instance = await (0, exports.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance with ID ${instanceId} not found`);
    try {
        await (0, exports.updateInstance)(instanceId, { shutdownReason: undefined });
        await safeSystemctl('start', instance.serviceName);
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
        await (0, exports.updateInstance)(instanceId, { shutdownReason: 'manual' });
        await safeSystemctl('stop', instance.serviceName);
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
        await safeSystemctl('restart', instance.serviceName);
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
        await safeSystemctl('kill', instance.serviceName, ['-s', 'SIGKILL']);
        return `Instance ${instance.name} force stopped`;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Invalid argument')) {
            return `Instance ${instance.name} force stopped (no process found)`;
        }
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
            const { stdout } = await safeSystemctl('is-active', instance.serviceName);
            const running = stdout.trim() === 'active';
            let pid = undefined;
            if (running) {
                try {
                    const { stdout: pidOut } = await safeSystemctl('show', instance.serviceName, ['--property=MainPID', '--value']);
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
    try {
        await fs.access(pathDir);
    }
    catch {
        throw new Error(`Directory ${pathDir} does not accessable`);
    }
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newInstance = {
        id,
        name,
        description: `Custom Instance - ${name}`,
        version: "Unknown",
        serviceName,
        pzDir: pathDir,
        pzName: `pz${id}`,
        logPath: path.join(pathDir, 'logs', 'server.log'),
        maintenanceLogPath: path.join(pathDir, 'logs', 'maintenance.log'),
        iniPath: `/home/pzadmin/Zomboid/Server/pz${id}.ini`,
        savePath: `/home/pzadmin/Zomboid/Saves/Multiplayer/pz${id}`,
        db: `/home/pzadmin/Zomboid/db/pz${id}.db`,
        rconPort: 0,
        gamePort: 16261,
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
    const instanceIndex = config.instances.findIndex(i => i.id === instanceId);
    if (instanceIndex === -1) {
        throw new Error(`Instance with ID ${instanceId} not found`);
    }
    const updatedInstance = {
        ...config.instances[instanceIndex],
        ...updates,
        lastUpdated: new Date().toISOString()
    };
    config.instances[instanceIndex] = updatedInstance;
    await (0, exports.saveInstances)(config);
    return updatedInstance;
};
exports.updateInstance = updateInstance;
/**
 * Get Mods from INI and Disk
 */
const getMods = async (instanceId) => {
    const instance = await (0, exports.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance ${instanceId} not found`);
    const iniContent = await fs.readFile(instance.iniPath, 'utf-8');
    const modsMatch = iniContent.match(/^Mods=(.*)$/m);
    const workshopMatch = iniContent.match(/^WorkshopItems=(.*)$/m);
    const modsDir = path.join(os.homedir(), 'Zomboid', 'mods');
    let availableMods = [];
    try {
        const files = await fs.readdir(modsDir, { withFileTypes: true });
        availableMods = files
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    }
    catch (e) {
        // Directory might not exist yet
    }
    return {
        mods: modsMatch ? modsMatch[1].split(';').filter(Boolean) : [],
        workshopItems: workshopMatch ? workshopMatch[1].split(';').filter(Boolean) : [],
        availableMods
    };
};
exports.getMods = getMods;
/**
 * Add Mod to INI
 */
const addMod = async (instanceId, modId, workshopId) => {
    const instance = await (0, exports.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance ${instanceId} not found`);
    let iniContent = await fs.readFile(instance.iniPath, 'utf-8');
    if (modId) {
        const modsMatch = iniContent.match(/^Mods=(.*)$/m);
        if (modsMatch) {
            const currentMods = modsMatch[1].split(';').filter(Boolean);
            if (!currentMods.includes(modId)) {
                currentMods.push(modId);
                iniContent = iniContent.replace(/^Mods=.*$/m, `Mods=${currentMods.join(';')}`);
            }
        }
    }
    if (workshopId) {
        const workshopMatch = iniContent.match(/^WorkshopItems=(.*)$/m);
        if (workshopMatch) {
            const currentItems = workshopMatch[1].split(';').filter(Boolean);
            if (!currentItems.includes(workshopId)) {
                currentItems.push(workshopId);
                iniContent = iniContent.replace(/^WorkshopItems=.*$/m, `WorkshopItems=${currentItems.join(';')}`);
            }
        }
    }
    await fs.writeFile(instance.iniPath, iniContent, 'utf-8');
};
exports.addMod = addMod;
/**
 * Remove Mod from INI and Disk
 */
const removeMod = async (instanceId, modId, workshopId) => {
    const instance = await (0, exports.getInstanceById)(instanceId);
    if (!instance)
        throw new Error(`Instance ${instanceId} not found`);
    let iniContent = await fs.readFile(instance.iniPath, 'utf-8');
    let changed = false;
    if (modId) {
        const modsMatch = iniContent.match(/^Mods=(.*)$/m);
        if (modsMatch) {
            let currentMods = modsMatch[1].split(';').filter(Boolean);
            if (currentMods.includes(modId)) {
                currentMods = currentMods.filter(m => m !== modId);
                iniContent = iniContent.replace(/^Mods=.*$/m, `Mods=${currentMods.join(';')}`);
                changed = true;
            }
        }
        const modsDir = path.join(os.homedir(), 'Zomboid', 'mods');
        const modPath = path.join(modsDir, modId);
        try {
            await fs.rm(modPath, { recursive: true, force: true });
        }
        catch (e) { /* ignore */ }
    }
    if (workshopId) {
        const workshopMatch = iniContent.match(/^WorkshopItems=(.*)$/m);
        if (workshopMatch) {
            let currentItems = workshopMatch[1].split(';').filter(Boolean);
            if (currentItems.includes(workshopId)) {
                currentItems = currentItems.filter(i => i !== workshopId);
                iniContent = iniContent.replace(/^WorkshopItems=.*$/m, `WorkshopItems=${currentItems.join(';')}`);
                changed = true;
            }
        }
    }
    if (changed) {
        await fs.writeFile(instance.iniPath, iniContent, 'utf-8');
    }
};
exports.removeMod = removeMod;
/**
 * Upload Mod File
 */
const installLocalMod = async (instanceId, filePath, originalName) => {
    const modsDir = path.join(os.homedir(), 'Zomboid', 'mods');
    await fs.mkdir(modsDir, { recursive: true });
    const destPath = path.join(modsDir, originalName);
    await fs.copyFile(filePath, destPath);
    await fs.unlink(filePath);
    return destPath;
};
exports.installLocalMod = installLocalMod;
