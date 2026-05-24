"use strict";
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
exports.instanceManager = exports.systemdService = exports.instancesRepository = exports.InstanceManager = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const instances_repository_1 = require("../repositories/instances.repository");
const systemd_service_1 = require("../services/systemd.service");
const steamcmd_service_1 = require("../services/steamcmd.service");
const instanceName_1 = require("../utils/instanceName");
const errors_1 = require("../utils/errors");
const paths_1 = require("../config/paths");
const env_1 = require("../config/env");
const task_manager_1 = require("./task.manager");
const execFilePromise = (0, util_1.promisify)(child_process_1.execFile);
const SETUP_SCRIPT_MAX_BUFFER = 32 * 1024 * 1024;
const summarizeSetupOutput = (stderr, stdout) => {
    const merged = `${stderr}\n${stdout}`
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (!merged.length) {
        return 'No diagnostic output captured from setup script.';
    }
    return merged.slice(-6).join(' | ');
};
class InstanceManager {
    async pathExists(targetPath) {
        try {
            await fs.access(targetPath);
            return true;
        }
        catch {
            return false;
        }
    }
    async persistInstance(instance) {
        const instances = await this.repository.readAll();
        const idx = instances.findIndex((i) => i.id === instance.id);
        if (idx >= 0) {
            instances[idx] = instance;
            await this.repository.writeAll(instances);
        }
    }
    async ensureInstanceIni(instance) {
        if (await this.pathExists(instance.iniPath)) {
            return instance;
        }
        const candidates = [
            `/home/pzadmin/Zomboid/Server/${instance.pzName}.ini`,
            `/home/pzadmin/Zomboid/Server/pz${instance.id}.ini`
        ];
        for (const candidate of candidates) {
            if (await this.pathExists(candidate)) {
                const next = {
                    ...instance,
                    iniPath: candidate,
                    pzName: path.basename(candidate, '.ini')
                };
                await this.persistInstance(next);
                console.warn(`[instances] Recovered iniPath for ${instance.id}: ${candidate}`);
                return next;
            }
        }
        await fs.mkdir(path.dirname(instance.iniPath), { recursive: true });
        const defaultIni = [
            `DefaultPort=${instance.gamePort}`,
            `RCONPort=${instance.rconPort}`,
            'RCONPassword=pzadmin',
            `PublicName=${instance.name}`,
            `PublicDescription=Project Zomboid instance ${instance.name}`,
            'Mods=',
            'WorkshopItems='
        ].join('\n');
        await fs.writeFile(instance.iniPath, `${defaultIni}\n`, 'utf-8');
        console.warn(`[instances] Created missing ini for ${instance.id} at ${instance.iniPath}`);
        return instance;
    }
    async parseIniPorts(iniPath) {
        try {
            const iniContent = await fs.readFile(iniPath, 'utf-8');
            const gpMatch = iniContent.match(/^DefaultPort=(\d+)/m);
            const rpMatch = iniContent.match(/^RCONPort=(\d+)/m);
            return {
                gamePort: gpMatch ? parseInt(gpMatch[1], 10) : undefined,
                rconPort: rpMatch ? parseInt(rpMatch[1], 10) : undefined
            };
        }
        catch {
            return {};
        }
    }
    async detectPzNameFromStartup(pathDir) {
        try {
            const startupPath = path.join(pathDir, 'start-server.sh');
            const startup = await fs.readFile(startupPath, 'utf-8');
            const match = startup.match(/-servername\s+([a-zA-Z0-9_-]+)/);
            return match ? match[1] : undefined;
        }
        catch {
            return undefined;
        }
    }
    isSafeDeletePath(targetPath, allowedRoots) {
        if (!targetPath)
            return false;
        const normalized = path.resolve(targetPath);
        return allowedRoots.some((root) => {
            const rootResolved = path.resolve(root);
            return normalized === rootResolved || normalized.startsWith(`${rootResolved}${path.sep}`);
        });
    }
    async safeRemovePath(targetPath, allowedRoots) {
        if (!targetPath)
            return;
        if (!this.isSafeDeletePath(targetPath, allowedRoots)) {
            console.warn(`[instances.delete] Skipping unsafe delete path: ${targetPath}`);
            return;
        }
        try {
            await fs.rm(targetPath, { recursive: true, force: true });
        }
        catch (error) {
            console.warn(`[instances.delete] Failed to remove ${targetPath}: ${error}`);
        }
    }
    constructor(repository, systemd) {
        this.HOME_ROOT = '/home/pzadmin/Zomboid';
        this.repository = repository;
        this.systemd = systemd;
    }
    async listInstances() {
        const instances = await this.repository.readAll();
        const statusPromises = instances.map(async (instance) => {
            let broken = false;
            let brokenReason;
            try {
                if (instance.pzDir) {
                    await fs.access(instance.pzDir);
                }
            }
            catch {
                broken = true;
                brokenReason = 'Instalación incompleta o directorio eliminado.';
            }
            try {
                const { stdout } = await this.systemd.execute('is-active', instance.serviceName);
                const running = stdout.trim() === 'active';
                let pid = undefined;
                if (running) {
                    try {
                        pid = await this.systemd.getProperty(instance.serviceName, 'MainPID');
                        if (pid === '0')
                            pid = undefined;
                    }
                    catch (e) { /* ignore */ }
                }
                return { ...instance, running, pid, broken, brokenReason };
            }
            catch {
                return { ...instance, running: false, broken, brokenReason };
            }
        });
        return Promise.all(statusPromises);
    }
    async getInstance(id) {
        const instance = await this.repository.findByName(id);
        if (!instance) {
            throw new errors_1.NotFoundError(`Instance with ID ${id} not found`);
        }
        return this.ensureInstanceIni(instance);
    }
    async checkPortConflicts(gamePort, rconPort, excludeInstanceId) {
        const instances = await this.listInstances();
        const conflicts = [];
        for (const inst of instances) {
            if (inst.id === excludeInstanceId)
                continue;
            if (inst.gamePort === gamePort)
                conflicts.push(`Game port ${gamePort} is already in use by instance '${inst.name}'.`);
            if (inst.rconPort === rconPort)
                conflicts.push(`RCON port ${rconPort} is already in use by instance '${inst.name}'.`);
            if (inst.gamePort === rconPort)
                conflicts.push(`RCON port ${rconPort} conflicts with game port of instance '${inst.name}'.`);
            if (inst.rconPort === gamePort)
                conflicts.push(`Game port ${gamePort} conflicts with RCON port of instance '${inst.name}'.`);
        }
        return conflicts;
    }
    async createInstanceFromVersion(branchId, name, gamePort, rconPort, force = false, allowUnknownBranch = false, taskId) {
        const id = (0, instanceName_1.sanitizeInstanceName)(name).toLowerCase();
        if (!id)
            throw new errors_1.ValidationError('Invalid instance name');
        if (await this.repository.exists(id)) {
            throw new errors_1.ValidationError(`Instance with ID ${id} already exists`);
        }
        if (!force) {
            const conflicts = await this.checkPortConflicts(gamePort, rconPort);
            if (conflicts.length > 0) {
                throw new errors_1.PortConflictError(conflicts);
            }
        }
        const serviceName = (0, instanceName_1.getServiceName)(name);
        const pzDir = `/opt/pzserver-${id}`;
        const pzName = `pz${id}`;
        const resolvedBranch = await (0, steamcmd_service_1.resolveBranchById)(branchId, { allowUnknown: allowUnknownBranch });
        const steamCmdInfo = await (0, steamcmd_service_1.resolveSteamCmdPath)();
        console.info(`[instances.create] branchId=${branchId}`);
        console.info(`[instances.create] resolvedSteamBranch=${resolvedBranch.steamBranch || '(public)'}`);
        console.info(`[instances.create] installPath=${pzDir}`);
        console.info(`[instances.create] serviceName=${serviceName}`);
        console.info(`[instances.create] steamcmdPath=${steamCmdInfo.path}`);
        console.info(`[instances.create] steamcmdExists=${steamCmdInfo.exists} steamcmdExecutable=${steamCmdInfo.executable}`);
        if (taskId)
            task_manager_1.taskManager.addLog(taskId, `[instances.create] SteamCMD path resolved: ${steamCmdInfo.path}`);
        if (!steamCmdInfo.exists || !steamCmdInfo.executable) {
            if (taskId)
                task_manager_1.taskManager.updateTaskStatus(taskId, 'failed', 0, 'SteamCMD is not installed or executable at the configured path.');
            throw new errors_1.AppError('SteamCMD is not installed or executable at the configured path.', 'STEAMCMD_NOT_FOUND', 500);
        }
        try {
            if (taskId)
                task_manager_1.taskManager.addLog(taskId, `[instances.create] Starting SteamCMD installation process...`);
            if (taskId)
                task_manager_1.taskManager.updateTaskStatus(taskId, 'running', 10);
            await new Promise((resolve, reject) => {
                const child = (0, child_process_1.spawn)('sudo', [
                    '-n',
                    'bash',
                    path.join(paths_1.PZWEBADMIN_ROOT, 'scripts/setup-instance-steamcmd.sh'),
                    branchId,
                    resolvedBranch.steamBranch,
                    name,
                    gamePort.toString(),
                    rconPort.toString(),
                    steamCmdInfo.path
                ], {
                    env: {
                        ...process.env,
                        PZ_TEMPLATE_DIR: env_1.config.pzDir
                    }
                });
                let outputBuffer = '';
                let errorBuffer = '';
                child.stdout.on('data', (data) => {
                    const str = data.toString();
                    outputBuffer += str;
                    if (taskId) {
                        str.split('\n').filter(Boolean).forEach((line) => task_manager_1.taskManager.addLog(taskId, line));
                        // Very rough progress tracking based on steamcmd typical output
                        if (str.includes('downloading'))
                            task_manager_1.taskManager.updateTaskStatus(taskId, 'running', 50);
                        if (str.includes('verifying'))
                            task_manager_1.taskManager.updateTaskStatus(taskId, 'running', 80);
                    }
                });
                child.stderr.on('data', (data) => {
                    const str = data.toString();
                    errorBuffer += str;
                    if (taskId) {
                        str.split('\n').filter(Boolean).forEach((line) => task_manager_1.taskManager.addLog(taskId, `ERROR: ${line}`));
                    }
                });
                child.on('close', (code) => {
                    if (code === 0) {
                        if (taskId) {
                            task_manager_1.taskManager.addLog(taskId, `Installation completed successfully.`);
                            task_manager_1.taskManager.updateTaskStatus(taskId, 'running', 90);
                        }
                        resolve();
                    }
                    else {
                        const combinedOutput = `${errorBuffer}\n${outputBuffer}`.toLowerCase();
                        const details = summarizeSetupOutput(errorBuffer, outputBuffer);
                        if (taskId)
                            task_manager_1.taskManager.addLog(taskId, `[instances.create] setup failed details: ${details}`);
                        if (combinedOutput.includes('permission denied') || combinedOutput.includes('a password is required') || combinedOutput.includes('sudo:')) {
                            reject(new errors_1.AppError('Permission denied while creating instance. Verify sudoers and filesystem permissions.', 'PERMISSION_DENIED', 403));
                        }
                        else {
                            reject(new errors_1.AppError(`SteamCMD installation failed for branch '${branchId}' (exit code ${code}). ${details}`, 'INSTALL_FAILED', 500));
                        }
                    }
                });
                child.on('error', (err) => {
                    reject(new errors_1.AppError(`Failed to start setup script: ${err.message}`, 'INSTALL_FAILED', 500));
                });
            });
        }
        catch (error) {
            if (taskId)
                task_manager_1.taskManager.updateTaskStatus(taskId, 'failed', undefined, error.message);
            throw error;
        }
        const newInstance = {
            id,
            name,
            description: `Instancia basada en rama ${branchId}`,
            version: branchId,
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
        const instances = await this.repository.readAll();
        instances.push(newInstance);
        await this.repository.writeAll(instances);
        if (taskId) {
            task_manager_1.taskManager.addLog(taskId, `Instance registered successfully.`);
            task_manager_1.taskManager.setTaskResult(taskId, newInstance);
        }
        return newInstance;
    }
    async addInstance(name, pathDir, serviceName, gamePort = 0, rconPort = 0, force = false, customPzName, customIniPath, customSavePath, customDbPath) {
        try {
            await fs.access(pathDir);
        }
        catch {
            throw new errors_1.ValidationError(`Directory ${pathDir} is not accessible`);
        }
        const id = (0, instanceName_1.sanitizeInstanceName)(name).toLowerCase();
        if (!id)
            throw new errors_1.ValidationError('Invalid instance name');
        if (await this.repository.exists(id)) {
            throw new errors_1.ValidationError(`Instance with ID ${id} already exists`);
        }
        let detectedPzName = customPzName;
        if (!detectedPzName && customIniPath) {
            detectedPzName = path.basename(customIniPath, '.ini');
        }
        if (!detectedPzName) {
            detectedPzName = await this.detectPzNameFromStartup(pathDir);
        }
        const pzName = detectedPzName || `pz${id}`;
        let resolvedGamePort = gamePort;
        let resolvedRconPort = rconPort;
        const iniPath = customIniPath || `/home/pzadmin/Zomboid/Server/${pzName}.ini`;
        const parsedPorts = await this.parseIniPorts(iniPath);
        if (resolvedGamePort === 0 && parsedPorts.gamePort)
            resolvedGamePort = parsedPorts.gamePort;
        if (resolvedRconPort === 0 && parsedPorts.rconPort)
            resolvedRconPort = parsedPorts.rconPort;
        if (resolvedGamePort === 0)
            resolvedGamePort = 16261;
        if (resolvedRconPort === 0)
            resolvedRconPort = 27015;
        if (!force) {
            const conflicts = await this.checkPortConflicts(resolvedGamePort, resolvedRconPort);
            if (conflicts.length > 0) {
                throw new errors_1.PortConflictError(conflicts);
            }
        }
        const resolvedServiceName = serviceName?.trim() || (0, instanceName_1.getServiceName)(name);
        (0, instanceName_1.assertValidServiceName)(resolvedServiceName);
        const newInstance = {
            id,
            name,
            description: `Custom Instance - ${name}`,
            version: "Unknown",
            serviceName: resolvedServiceName,
            pzDir: pathDir,
            pzName,
            logPath: path.join(pathDir, 'logs', 'server.log'),
            maintenanceLogPath: path.join(pathDir, 'logs', 'maintenance.log'),
            iniPath,
            savePath: customSavePath || `/home/pzadmin/Zomboid/Saves/Multiplayer/${pzName}`,
            db: customDbPath || `/home/pzadmin/Zomboid/db/${pzName}.db`,
            rconPort: resolvedRconPort,
            gamePort: resolvedGamePort,
            isActive: false
        };
        const instances = await this.repository.readAll();
        instances.push(newInstance);
        await this.repository.writeAll(instances);
        return newInstance;
    }
    async updateInstance(instanceId, updates) {
        const instances = await this.repository.readAll();
        const instanceIndex = instances.findIndex(i => i.id === instanceId);
        if (instanceIndex === -1) {
            throw new errors_1.NotFoundError(`Instance with ID ${instanceId} not found`);
        }
        const updatedInstance = {
            ...instances[instanceIndex],
            ...updates,
            lastUpdated: new Date().toISOString()
        };
        instances[instanceIndex] = updatedInstance;
        await this.repository.writeAll(instances);
        return updatedInstance;
    }
    async performSystemdAction(instanceId, action) {
        const instance = await this.getInstance(instanceId);
        if (action === 'start') {
            await this.updateInstance(instanceId, { shutdownReason: undefined });
        }
        else if (action === 'stop') {
            await this.updateInstance(instanceId, { shutdownReason: 'manual' });
        }
        try {
            await this.systemd.execute(action, instance.serviceName);
            return `Instance ${instance.name} ${action} successful`;
        }
        catch (error) {
            if (action === 'kill' && error.message?.includes('Invalid argument')) {
                return `Instance ${instance.name} force stopped (no process found)`;
            }
            throw error;
        }
    }
    async getAvailableVersions() {
        const catalog = await (0, steamcmd_service_1.getAvailableBuilds)();
        return {
            source: catalog.source,
            data: catalog.data
        };
    }
    async getMods(instanceId) {
        const instance = await this.getInstance(instanceId);
        const iniContent = await fs.readFile(instance.iniPath, 'utf-8');
        const modsMatch = iniContent.match(/^Mods=(.*)$/m);
        const workshopMatch = iniContent.match(/^WorkshopItems=(.*)$/m);
        const modsDir = path.join(os.homedir(), 'Zomboid', 'mods');
        let availableMods = [];
        try {
            const files = await fs.readdir(modsDir, { withFileTypes: true });
            availableMods = files.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
        }
        catch (e) { /* directory might not exist */ }
        return {
            mods: modsMatch ? modsMatch[1].split(';').filter(Boolean) : [],
            workshopItems: workshopMatch ? workshopMatch[1].split(';').filter(Boolean) : [],
            availableMods
        };
    }
    async addMod(instanceId, modId, workshopId) {
        const instance = await this.getInstance(instanceId);
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
    }
    async removeMod(instanceId, modId, workshopId) {
        const instance = await this.getInstance(instanceId);
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
            const modPath = path.join(os.homedir(), 'Zomboid', 'mods', modId);
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
    }
    async installLocalMod(instanceId, filePath, originalName) {
        // Only verify instance exists to ensure permissions
        await this.getInstance(instanceId);
        const modsDir = path.join(os.homedir(), 'Zomboid', 'mods');
        await fs.mkdir(modsDir, { recursive: true });
        const destPath = path.join(modsDir, (0, instanceName_1.sanitizeInstanceName)(originalName));
        await fs.copyFile(filePath, destPath);
        await fs.unlink(filePath);
        return destPath;
    }
    async deleteInstance(instanceId, createBackup, force = false) {
        const instances = await this.repository.readAll();
        const instance = instances.find(i => i.id === instanceId);
        if (!instance) {
            if (force)
                return; // If forcing and not found, we're good
            throw new errors_1.NotFoundError(`Instance with ID ${instanceId} not found`);
        }
        // 1. Stop instance if running
        try {
            await this.systemd.execute('stop', instance.serviceName);
        }
        catch (e) {
            // Ignore if not running
        }
        // 2. Backup if requested
        if (createBackup) {
            const backupDir = path.join(paths_1.PZWEBADMIN_ROOT, 'backups');
            await fs.mkdir(backupDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `${instance.id}-${timestamp}.tar.gz`);
            const filesToBackup = [];
            if (await fs.access(instance.iniPath).then(() => true).catch(() => false))
                filesToBackup.push(instance.iniPath);
            if (await fs.access(instance.db).then(() => true).catch(() => false))
                filesToBackup.push(instance.db);
            if (await fs.access(instance.savePath).then(() => true).catch(() => false))
                filesToBackup.push(instance.savePath);
            if (filesToBackup.length > 0) {
                await execFilePromise('tar', ['-czf', backupPath, ...filesToBackup]);
            }
        }
        // 3. Delete files using sudo script first (handles systemd + canonical paths)
        try {
            const scriptPath = path.join(paths_1.PZWEBADMIN_ROOT, 'scripts', 'setup-instance-steamcmd.sh');
            await execFilePromise('sudo', [
                '/bin/bash', scriptPath, '--delete',
                instance.pzDir, instance.serviceName, instance.pzName,
                instance.iniPath || '',
                instance.savePath || '',
                instance.db || ''
            ]);
        }
        catch (e) {
            console.error(`Failed to execute delete script: ${e}`);
        }
        // 4. Deep cleanup in case custom paths were used or script could not delete all artifacts
        await this.safeRemovePath(instance.pzDir, ['/opt']);
        await this.safeRemovePath(instance.iniPath, [path.join(this.HOME_ROOT, 'Server')]);
        await this.safeRemovePath(instance.savePath, [path.join(this.HOME_ROOT, 'Saves')]);
        await this.safeRemovePath(instance.db, [path.join(this.HOME_ROOT, 'db')]);
        if (instance.pzName && /^[a-zA-Z0-9_-]{1,64}$/.test(instance.pzName)) {
            const serverDir = path.join(this.HOME_ROOT, 'Server');
            const cleanupTargets = [
                path.join(serverDir, `${instance.pzName}_SandboxVars.lua`),
                path.join(serverDir, `${instance.pzName}_spawnregions.lua`),
                path.join(serverDir, `${instance.pzName}_spawnpoints.lua`),
                path.join(serverDir, `${instance.pzName}_zombies.ini`)
            ];
            for (const target of cleanupTargets) {
                await this.safeRemovePath(target, [serverDir]);
            }
        }
        // 5. Remove from repository
        const filtered = instances.filter(i => i.id !== instance.id);
        await this.repository.writeAll(filtered);
    }
}
exports.InstanceManager = InstanceManager;
// Export singleton instance
exports.instancesRepository = new instances_repository_1.InstancesRepository();
exports.systemdService = new systemd_service_1.SystemdService(exports.instancesRepository);
exports.instanceManager = new InstanceManager(exports.instancesRepository, exports.systemdService);
