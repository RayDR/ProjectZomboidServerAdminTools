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
const execFilePromise = (0, util_1.promisify)(child_process_1.execFile);
const SETUP_SCRIPT_MAX_BUFFER = 32 * 1024 * 1024;
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
    constructor(repository, systemd) {
        this.repository = repository;
        this.systemd = systemd;
    }
    async listInstances() {
        const instances = await this.repository.readAll();
        const statusPromises = instances.map(async (instance) => {
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
                return { ...instance, running, pid };
            }
            catch {
                return { ...instance, running: false };
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
    async createInstanceFromVersion(branchId, name, gamePort, rconPort, force = false, allowUnknownBranch = false) {
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
        if (!steamCmdInfo.exists || !steamCmdInfo.executable) {
            throw new errors_1.AppError('SteamCMD is not installed or executable at the configured path.', 'STEAMCMD_NOT_FOUND', 500);
        }
        try {
            await execFilePromise('sudo', [
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
                // SteamCMD can emit large progress output on first installs.
                maxBuffer: SETUP_SCRIPT_MAX_BUFFER
            });
        }
        catch (error) {
            const stderr = String(error?.stderr || '');
            const stdout = String(error?.stdout || '');
            const combinedOutput = `${stderr}\n${stdout}`.toLowerCase();
            const message = String(error?.message || '').toLowerCase();
            if (combinedOutput.includes('permission denied') || combinedOutput.includes('a password is required') || message.includes('sudo')) {
                throw new errors_1.AppError('Permission denied while creating instance. Verify sudoers and filesystem permissions.', 'PERMISSION_DENIED', 403);
            }
            if (message.includes('maxbuffer') || message.includes('stdout maxbuffer') || message.includes('stderr maxbuffer')) {
                throw new errors_1.AppError('SteamCMD output exceeded process buffer while creating the instance. Increase backend buffer or reduce SteamCMD verbosity.', 'INSTALL_FAILED', 500);
            }
            throw new errors_1.AppError(`SteamCMD installation failed for branch '${branchId}'.`, 'INSTALL_FAILED', 500);
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
        return newInstance;
    }
    async addInstance(name, pathDir, serviceName, gamePort = 16261, rconPort = 0, force = false) {
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
        if (!force) {
            const conflicts = await this.checkPortConflicts(gamePort, rconPort);
            if (conflicts.length > 0) {
                throw new errors_1.PortConflictError(conflicts);
            }
        }
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
            rconPort,
            gamePort,
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
    async deleteInstance(instanceId, createBackup) {
        const instance = await this.getInstance(instanceId);
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
        // 3. Delete files safely
        try {
            if (instance.pzDir && instance.pzDir.startsWith('/opt/pzserver-')) {
                await execFilePromise('sudo', ['/bin/rm', '-rf', instance.pzDir]);
            }
        }
        catch (e) {
            console.error(`Failed to delete pzDir: ${e}`);
        }
        try {
            await fs.rm(instance.iniPath, { force: true });
        }
        catch (e) { }
        try {
            await fs.rm(instance.db, { force: true });
        }
        catch (e) { }
        try {
            await fs.rm(instance.savePath, { recursive: true, force: true });
        }
        catch (e) { }
        // 4. Clean systemd
        try {
            await execFilePromise('sudo', ['-n', '/usr/bin/systemctl', 'disable', instance.serviceName]);
            await execFilePromise('sudo', ['-n', '/bin/rm', '-f', `/etc/systemd/system/${instance.serviceName}.service`]);
            await execFilePromise('sudo', ['-n', '/usr/bin/systemctl', 'daemon-reload']);
        }
        catch (e) {
            console.error(`Failed to clean systemd service: ${e}`);
        }
        // 5. Remove from repository
        const instances = await this.repository.readAll();
        const filtered = instances.filter(i => i.id !== instance.id);
        await this.repository.writeAll(filtered);
    }
}
exports.InstanceManager = InstanceManager;
// Export singleton instance
exports.instancesRepository = new instances_repository_1.InstancesRepository();
exports.systemdService = new systemd_service_1.SystemdService(exports.instancesRepository);
exports.instanceManager = new InstanceManager(exports.instancesRepository, exports.systemdService);
