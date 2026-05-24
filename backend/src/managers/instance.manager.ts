import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { InstancesRepository, ServerInstance } from '../repositories/instances.repository';
import { SystemdService, SystemdAction } from '../services/systemd.service';
import { getAvailableBuilds, resolveBranchById, resolveSteamCmdPath } from '../services/steamcmd.service';
import { getServiceName, sanitizeInstanceName, assertValidServiceName } from '../utils/instanceName';
import { AppError, NotFoundError, ValidationError, PortConflictError } from '../utils/errors';
import { PZWEBADMIN_ROOT } from '../config/paths';
import { config } from '../config/env';
import { taskManager } from './task.manager';
import { isWindows, windowsProvisioningUnsupportedMessage } from '../utils/platform';

const execFilePromise = promisify(execFile);
const SETUP_SCRIPT_MAX_BUFFER = 32 * 1024 * 1024;

const summarizeSetupOutput = (stderr: string, stdout: string): string => {
  const merged = `${stderr}\n${stdout}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!merged.length) {
    return 'No diagnostic output captured from setup script.';
  }

  return merged.slice(-6).join(' | ');
};

export class InstanceManager {
  private repository: InstancesRepository;
  private systemd: SystemdService;

  private readonly HOME_ROOT = '/home/pzadmin/Zomboid';

  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  private async persistInstance(instance: ServerInstance): Promise<void> {
    const instances = await this.repository.readAll();
    const idx = instances.findIndex((i) => i.id === instance.id);
    if (idx >= 0) {
      instances[idx] = instance;
      await this.repository.writeAll(instances);
    }
  }

  private async ensureInstanceIni(instance: ServerInstance): Promise<ServerInstance> {
    if (await this.pathExists(instance.iniPath)) {
      return instance;
    }

    const candidates = [
      `/home/pzadmin/Zomboid/Server/${instance.pzName}.ini`,
      `/home/pzadmin/Zomboid/Server/pzserver-${instance.id}.ini`,
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

  private async parseIniPorts(iniPath: string): Promise<{ gamePort?: number; rconPort?: number }> {
    try {
      const iniContent = await fs.readFile(iniPath, 'utf-8');
      const gpMatch = iniContent.match(/^DefaultPort=(\d+)/m);
      const rpMatch = iniContent.match(/^RCONPort=(\d+)/m);
      return {
        gamePort: gpMatch ? parseInt(gpMatch[1], 10) : undefined,
        rconPort: rpMatch ? parseInt(rpMatch[1], 10) : undefined
      };
    } catch {
      return {};
    }
  }

  private async detectPzNameFromStartup(pathDir: string): Promise<string | undefined> {
    try {
      const startupPath = path.join(pathDir, 'start-server.sh');
      const startup = await fs.readFile(startupPath, 'utf-8');
      const match = startup.match(/-servername\s+([a-zA-Z0-9_-]+)/);
      return match ? match[1] : undefined;
    } catch {
      return undefined;
    }
  }

  private isSafeDeletePath(targetPath: string, allowedRoots: string[]): boolean {
    if (!targetPath) return false;
    const normalized = path.resolve(targetPath);
    return allowedRoots.some((root) => {
      const rootResolved = path.resolve(root);
      return normalized === rootResolved || normalized.startsWith(`${rootResolved}${path.sep}`);
    });
  }

  private async safeRemovePath(targetPath: string, allowedRoots: string[]): Promise<void> {
    if (!targetPath) return;
    if (!this.isSafeDeletePath(targetPath, allowedRoots)) {
      console.warn(`[instances.delete] Skipping unsafe delete path: ${targetPath}`);
      return;
    }
    try {
      await fs.rm(targetPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[instances.delete] Failed to remove ${targetPath}: ${error}`);
    }
  }

  constructor(repository: InstancesRepository, systemd: SystemdService) {
    this.repository = repository;
    this.systemd = systemd;
  }

  private getWindowsPidPath(instance: ServerInstance): string {
    return path.join(instance.pzDir, 'logs', 'pzwebadmin.pid');
  }

  private async readWindowsPid(instance: ServerInstance): Promise<string | undefined> {
    try {
      const pid = (await fs.readFile(this.getWindowsPidPath(instance), 'utf-8')).trim();
      return pid || undefined;
    } catch {
      return undefined;
    }
  }

  private async writeWindowsPid(instance: ServerInstance, pid: number): Promise<void> {
    await fs.mkdir(path.join(instance.pzDir, 'logs'), { recursive: true });
    await fs.writeFile(this.getWindowsPidPath(instance), String(pid), 'utf-8');
  }

  private async clearWindowsPid(instance: ServerInstance): Promise<void> {
    try {
      await fs.rm(this.getWindowsPidPath(instance), { force: true });
    } catch {
      // ignore
    }
  }

  private async isPidAlive(pid: string): Promise<boolean> {
    try {
      process.kill(Number(pid), 0);
      return true;
    } catch {
      return false;
    }
  }

  private async getWindowsStartScript(instance: ServerInstance): Promise<string> {
    const candidates = [
      path.join(instance.pzDir, 'StartServer64.bat'),
      path.join(instance.pzDir, 'ProjectZomboidServer.bat'),
      path.join(instance.pzDir, 'start-server.bat')
    ];

    for (const candidate of candidates) {
      if (await this.pathExists(candidate)) {
        return candidate;
      }
    }

    throw new AppError(
      `Windows start script not found in ${instance.pzDir}. Expected one of: StartServer64.bat, ProjectZomboidServer.bat, start-server.bat.`,
      'START_SCRIPT_NOT_FOUND',
      400
    );
  }

  private async performWindowsAction(instance: ServerInstance, action: SystemdAction): Promise<string> {
    if (action === 'status' || action === 'is-active') {
      const pid = await this.readWindowsPid(instance);
      const running = pid ? await this.isPidAlive(pid) : false;
      if (!running && pid) {
        await this.clearWindowsPid(instance);
      }
      return running ? 'active' : 'inactive';
    }

    if (action === 'start') {
      const currentPid = await this.readWindowsPid(instance);
      if (currentPid && await this.isPidAlive(currentPid)) {
        return `Instance ${instance.name} already running`;
      }

      const scriptPath = await this.getWindowsStartScript(instance);
      const args = ['/c', scriptPath, '-servername', instance.pzName, '-adminpassword', config.pzRconPassword || 'pzadmin'];
      const child = spawn('cmd.exe', args, {
        cwd: instance.pzDir,
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      if (!child.pid) {
        throw new AppError('Unable to determine spawned process PID on Windows.', 'START_FAILED', 500);
      }
      await this.writeWindowsPid(instance, child.pid);
      return `Instance ${instance.name} start successful`;
    }

    if (action === 'stop' || action === 'kill') {
      const pid = await this.readWindowsPid(instance);
      if (!pid || !(await this.isPidAlive(pid))) {
        await this.clearWindowsPid(instance);
        return `Instance ${instance.name} force stopped (no process found)`;
      }

      await execFilePromise('taskkill', ['/PID', String(pid), '/T', '/F']);
      await this.clearWindowsPid(instance);
      return `Instance ${instance.name} ${action} successful`;
    }

    if (action === 'restart') {
      await this.performWindowsAction(instance, 'stop');
      return this.performWindowsAction(instance, 'start');
    }

    throw new AppError(`Unsupported Windows action: ${action}`, 'UNSUPPORTED_ACTION', 400);
  }

  private async getProcessUsage(pid: string): Promise<{ processCpuPercent?: number; processMemoryBytes?: number }> {
    if (isWindows) {
      try {
        const psScript = `(Get-Process -Id ${pid} | Select-Object CPU,WorkingSet64 | ConvertTo-Json -Compress)`;
        const { stdout } = await execFilePromise('powershell', ['-NoProfile', '-Command', psScript]);
        const data = JSON.parse(String(stdout || '{}')) as { CPU?: number; WorkingSet64?: number };
        return {
          processCpuPercent: typeof data.CPU === 'number' ? data.CPU : undefined,
          processMemoryBytes: typeof data.WorkingSet64 === 'number' ? data.WorkingSet64 : undefined
        };
      } catch {
        return {};
      }
    }

    try {
      const { stdout } = await execFilePromise('ps', ['-p', pid, '-o', '%cpu=,rss=']);
      const parts = String(stdout || '').trim().split(/\s+/);
      if (parts.length < 2) {
        return {};
      }

      const cpu = Number(parts[0]);
      const rssKb = Number(parts[1]);

      return {
        processCpuPercent: Number.isFinite(cpu) ? cpu : undefined,
        processMemoryBytes: Number.isFinite(rssKb) ? rssKb * 1024 : undefined
      };
    } catch {
      return {};
    }
  }

  private ensureProvisioningPlatform(): void {
    if (isWindows) {
      throw new AppError(windowsProvisioningUnsupportedMessage, 'PLATFORM_UNSUPPORTED', 501);
    }
  }

  public async listInstances(): Promise<Array<ServerInstance & { running: boolean; pid?: string; broken?: boolean; brokenReason?: string; processCpuPercent?: number; processMemoryBytes?: number }>> {
    const instances = await this.repository.readAll();

    const statusPromises = instances.map(async (instance) => {
      let broken = false;
      let brokenReason;
      try {
        if (instance.pzDir) {
          await fs.access(instance.pzDir);
        }
      } catch {
        broken = true;
        brokenReason = 'Instalación incompleta o directorio eliminado.';
      }

      try {
        const running = isWindows
          ? (await this.performWindowsAction(instance, 'is-active')).trim() === 'active'
          : (await this.systemd.execute('is-active', instance.serviceName)).stdout.trim() === 'active';

        let pid: string | undefined = undefined;
        let processUsage: { processCpuPercent?: number; processMemoryBytes?: number } = {};
        if (running) {
          try {
            pid = isWindows
              ? await this.readWindowsPid(instance)
              : await this.systemd.getProperty(instance.serviceName, 'MainPID');
            if (pid === '0') pid = undefined;
            if (pid) {
              processUsage = await this.getProcessUsage(pid);
            }
          } catch (e) { /* ignore */ }
        }

        return { ...instance, running, pid, broken, brokenReason, ...processUsage };
      } catch {
        return { ...instance, running: false, broken, brokenReason };
      }
    });

    return Promise.all(statusPromises);
  }

  public async getInstance(id: string): Promise<ServerInstance> {
    const instance = await this.repository.findByName(id);
    if (!instance) {
      throw new NotFoundError(`Instance with ID ${id} not found`);
    }
    return this.ensureInstanceIni(instance);
  }

  public async checkPortConflicts(gamePort: number, rconPort: number, excludeInstanceId?: string): Promise<string[]> {
    const instances = await this.listInstances();
    const conflicts: string[] = [];
    for (const inst of instances) {
      if (inst.id === excludeInstanceId) continue;
      if (inst.gamePort === gamePort) conflicts.push(`Game port ${gamePort} is already in use by instance '${inst.name}'.`);
      if (inst.gamePort === rconPort) conflicts.push(`RCON port ${rconPort} conflicts with game port of instance '${inst.name}'.`);
      if (inst.rconPort === gamePort) conflicts.push(`Game port ${gamePort} conflicts with RCON port of instance '${inst.name}'.`);
    }
    return conflicts;
  }

  private async getRunningPortConflicts(gamePort: number, rconPort: number, excludeInstanceId?: string): Promise<string[]> {
    const instances = await this.listInstances();
    const conflicts: string[] = [];

    for (const inst of instances) {
      if (inst.id === excludeInstanceId) continue;
      if (!inst.running) continue;

      if (inst.gamePort === gamePort) {
        conflicts.push(`No se puede iniciar porque la instancia '${inst.name}' ya usa el puerto de juego ${gamePort}.`);
      }
      if (inst.gamePort === rconPort) {
        conflicts.push(`No se puede iniciar porque el puerto RCON ${rconPort} choca con el puerto de juego de '${inst.name}'.`);
      }
      if (inst.rconPort === gamePort) {
        conflicts.push(`No se puede iniciar porque el puerto de juego ${gamePort} choca con el puerto RCON de '${inst.name}'.`);
      }
    }

    return conflicts;
  }

  public async createInstanceFromVersion(branchId: string, name: string, gamePort: number, rconPort: number, force: boolean = false, allowUnknownBranch: boolean = false, taskId?: string): Promise<ServerInstance> {
    this.ensureProvisioningPlatform();

    const id = sanitizeInstanceName(name).toLowerCase();
    if (!id) throw new ValidationError('Nombre de instancia inválido / Invalid instance name');
    
    if (await this.repository.exists(id)) {
      throw new ValidationError(`La instancia con ID ${id} ya existe / Instance with ID ${id} already exists`);
    }

    const serviceName = getServiceName(name);
    const pzDir = `/opt/pzserver-${id}`;
    const pzName = `pzserver-${id}`;

    const newInstance: ServerInstance = {
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
      isActive: false,
      isLocked: false,
      installationTaskId: taskId,
      installationStatus: taskId ? 'running' : undefined,
      installationLastError: undefined,
      shutdownReason: taskId ? 'installation_pending' : undefined,
    };

    // Persist placeholder early so failed installs can be retried later.
    const existingInstances = await this.repository.readAll();
    if (!existingInstances.some((inst) => inst.id === id)) {
      existingInstances.push(newInstance);
      await this.repository.writeAll(existingInstances);
    }

    const resolvedBranch = await resolveBranchById(branchId, { allowUnknown: allowUnknownBranch });
    const steamCmdInfo = await resolveSteamCmdPath();

    const conflictWarnings = await this.checkPortConflicts(gamePort, rconPort);

    console.info(`[instances.create] branchId=${branchId}`);
    console.info(`[instances.create] resolvedSteamBranch=${resolvedBranch.steamBranch || '(public)'}`);
    console.info(`[instances.create] installPath=${pzDir}`);
    console.info(`[instances.create] serviceName=${serviceName}`);
    console.info(`[instances.create] steamcmdPath=${steamCmdInfo.path}`);
    console.info(`[instances.create] steamcmdExists=${steamCmdInfo.exists} steamcmdExecutable=${steamCmdInfo.executable}`);
    if (conflictWarnings.length > 0) {
      console.warn(`[instances.create] Port warnings for ${name}: ${conflictWarnings.join(' | ')}`);
      if (taskId) {
        taskManager.addLog(taskId, `[warn] ${conflictWarnings.join(' | ')}`);
      }
    }
    if (taskId) taskManager.addLog(taskId, `[instances.create] SteamCMD path resolved: ${steamCmdInfo.path}`);

    if (!steamCmdInfo.exists || !steamCmdInfo.executable) {
      if (taskId) taskManager.updateTaskStatus(taskId, 'failed', 0, 'SteamCMD no está instalado o no es ejecutable en la ruta configurada / SteamCMD is not installed or executable at the configured path.');
      throw new AppError('SteamCMD no está instalado o no es ejecutable en la ruta configurada / SteamCMD is not installed or executable at the configured path.', 'STEAMCMD_NOT_FOUND', 500);
    }

    try {
      if (taskId) taskManager.addLog(taskId, `[instances.create] Starting SteamCMD installation process...`);
      if (taskId) taskManager.updateTaskStatus(taskId, 'running', 10);

      await new Promise<void>((resolve, reject) => {
        const child = spawn('sudo', [
          '-n',
          'bash', 
          path.join(PZWEBADMIN_ROOT, 'scripts/setup-instance-steamcmd.sh'),
          branchId,
          resolvedBranch.steamBranch,
          name,
          gamePort.toString(),
          rconPort.toString(),
          steamCmdInfo.path
        ], {
          env: {
            ...process.env,
            PZ_TEMPLATE_DIR: config.pzDir
          }
        });

        let outputBuffer = '';
        let errorBuffer = '';

        child.stdout.on('data', (data) => {
          const str = data.toString();
          outputBuffer += str;
          if (taskId) {
            str.split('\n').filter(Boolean).forEach((line: string) => taskManager.addLog(taskId, line));
            // Very rough progress tracking based on steamcmd typical output
            if (str.includes('downloading')) taskManager.updateTaskStatus(taskId, 'running', 50);
            if (str.includes('verifying')) taskManager.updateTaskStatus(taskId, 'running', 80);
          }
        });

        child.stderr.on('data', (data) => {
          const str = data.toString();
          errorBuffer += str;
          if (taskId) {
            str.split('\n').filter(Boolean).forEach((line: string) => taskManager.addLog(taskId, `ERROR: ${line}`));
          }
        });

        child.on('close', (code) => {
          if (code === 0) {
            if (taskId) {
              taskManager.addLog(taskId, `Installation completed successfully.`);
              taskManager.updateTaskStatus(taskId, 'running', 90);
            }
            resolve();
          } else {
            const combinedOutput = `${errorBuffer}\n${outputBuffer}`.toLowerCase();
            const details = summarizeSetupOutput(errorBuffer, outputBuffer);
            if (taskId) taskManager.addLog(taskId, `[instances.create] setup failed details: ${details}`);
            if (combinedOutput.includes('permission denied') || combinedOutput.includes('a password is required') || combinedOutput.includes('sudo:')) {
              reject(new AppError('Permiso denegado al crear la instancia. Verifica sudoers y permisos del sistema de archivos / Permission denied while creating instance. Verify sudoers and filesystem permissions.', 'PERMISSION_DENIED', 403));
            } else {
              reject(new AppError(`La instalación con SteamCMD falló para la rama '${branchId}' (código ${code}). ${details}`, 'INSTALL_FAILED', 500));
            }
          }
        });

        child.on('error', (err) => {
          reject(new AppError(`No se pudo iniciar el script de instalación / Failed to start setup script: ${err.message}`, 'INSTALL_FAILED', 500));
        });
      });
    } catch (error: any) {
      await this.updateInstance(id, {
        installationTaskId: taskId,
        installationStatus: 'failed',
        installationLastError: error.message,
        shutdownReason: 'installation_failed'
      } as any);
      if (taskId) taskManager.updateTaskStatus(taskId, 'failed', undefined, error.message);
      throw error;
    }

    await this.updateInstance(id, {
      installationTaskId: taskId,
      installationStatus: taskId ? 'success' : undefined,
      installationLastError: undefined,
      shutdownReason: undefined
    } as any);
    
    if (taskId) {
      taskManager.addLog(taskId, `Instance registered successfully.`);
      taskManager.setTaskResult(taskId, newInstance);
    }

    return newInstance;
  }

  public async addInstance(
    name: string,
    pathDir: string,
    serviceName: string,
    gamePort: number = 0,
    rconPort: number = 0,
    force: boolean = false,
    customPzName?: string,
    customIniPath?: string,
    customSavePath?: string,
    customDbPath?: string
  ): Promise<ServerInstance> {
    try {
      await fs.access(pathDir);
    } catch {
      throw new ValidationError(`El directorio ${pathDir} no es accesible / Directory ${pathDir} is not accessible`);
    }

    const id = sanitizeInstanceName(name).toLowerCase();
    if (!id) throw new ValidationError('Nombre de instancia inválido / Invalid instance name');

    if (await this.repository.exists(id)) {
      throw new ValidationError(`La instancia con ID ${id} ya existe / Instance with ID ${id} already exists`);
    }

    let detectedPzName = customPzName;
    if (!detectedPzName && customIniPath) {
      detectedPzName = path.basename(customIniPath, '.ini');
    }
    if (!detectedPzName) {
      detectedPzName = await this.detectPzNameFromStartup(pathDir);
    }

    const pzName = detectedPzName || `pzserver-${id}`;
    let resolvedGamePort = gamePort;
    let resolvedRconPort = rconPort;
    const iniPath = customIniPath || `/home/pzadmin/Zomboid/Server/${pzName}.ini`;
    const parsedPorts = await this.parseIniPorts(iniPath);
    if (resolvedGamePort === 0 && parsedPorts.gamePort) resolvedGamePort = parsedPorts.gamePort;
    if (resolvedRconPort === 0 && parsedPorts.rconPort) resolvedRconPort = parsedPorts.rconPort;
    if (resolvedGamePort === 0) resolvedGamePort = 16261;
    if (resolvedRconPort === 0) resolvedRconPort = 27015;

    if (!force) {
      const conflicts = await this.checkPortConflicts(resolvedGamePort, resolvedRconPort);
      if (conflicts.length > 0) {
        throw new PortConflictError(conflicts.map((conflict) => conflict.replace(/^/, '')));
      }
    }

    const resolvedServiceName = serviceName?.trim() || getServiceName(name);
    assertValidServiceName(resolvedServiceName);

    const newInstance: ServerInstance = {
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
      isActive: false,
      isLocked: false
    };

    const instances = await this.repository.readAll();
    instances.push(newInstance);
    await this.repository.writeAll(instances);

    return newInstance;
  }

  public async retryInstanceInstallation(instanceId: string, taskId?: string): Promise<ServerInstance> {
    this.ensureProvisioningPlatform();

    const instances = await this.listInstances();
    const listedInstance = instances.find((item) => item.id === instanceId);
    if (!listedInstance) {
      throw new NotFoundError(`Instance with ID ${instanceId} not found`);
    }

    if (listedInstance.running) {
      throw new AppError('Retry installation is not allowed while the instance is running.', 'RETRY_NOT_ALLOWED', 409);
    }

    const hasFailedInstall = listedInstance.installationStatus === 'failed' || listedInstance.shutdownReason === 'installation_failed';
    const isBroken = Boolean(listedInstance.broken);
    if (!hasFailedInstall && !isBroken) {
      throw new AppError('Retry installation is only allowed for failed or broken instances.', 'RETRY_NOT_ALLOWED', 409);
    }

    const instance = await this.getInstance(instanceId);
    const branchId = instance.version || 'public';
    const resolvedBranch = await resolveBranchById(branchId, { allowUnknown: true });
    const steamCmdInfo = await resolveSteamCmdPath();

    await this.updateInstance(instanceId, {
      installationTaskId: taskId,
      installationStatus: taskId ? 'running' : undefined,
      installationLastError: undefined,
      shutdownReason: 'installation_retry'
    } as any);

    try {
      if (taskId) taskManager.addLog(taskId, `[instances.retry] Re-running installation for ${instance.name}...`);
      if (taskId) taskManager.updateTaskStatus(taskId, 'running', 10);

      await new Promise<void>((resolve, reject) => {
        const child = spawn('sudo', [
          '-n',
          'bash',
          path.join(PZWEBADMIN_ROOT, 'scripts/setup-instance-steamcmd.sh'),
          branchId,
          resolvedBranch.steamBranch,
          instance.name,
          String(instance.gamePort),
          String(instance.rconPort),
          steamCmdInfo.path
        ], {
          env: {
            ...process.env,
            PZ_TEMPLATE_DIR: config.pzDir
          }
        });

        let outputBuffer = '';
        let errorBuffer = '';

        child.stdout.on('data', (data) => {
          const str = data.toString();
          outputBuffer += str;
          if (taskId) {
            str.split('\n').filter(Boolean).forEach((line: string) => taskManager.addLog(taskId, line));
          }
        });

        child.stderr.on('data', (data) => {
          const str = data.toString();
          errorBuffer += str;
          if (taskId) {
            str.split('\n').filter(Boolean).forEach((line: string) => taskManager.addLog(taskId, `ERROR: ${line}`));
          }
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            const details = summarizeSetupOutput(errorBuffer, outputBuffer);
            reject(new AppError(`La reinstalación falló para '${branchId}' (código ${code}). ${details}`, 'INSTALL_FAILED', 500));
          }
        });

        child.on('error', (err) => {
          reject(new AppError(`No se pudo iniciar el script de reinstalación: ${err.message}`, 'INSTALL_FAILED', 500));
        });
      });

      await this.updateInstance(instanceId, {
        installationTaskId: taskId,
        installationStatus: taskId ? 'success' : undefined,
        installationLastError: undefined,
        shutdownReason: undefined
      } as any);
    } catch (error: any) {
      await this.updateInstance(instanceId, {
        installationTaskId: taskId,
        installationStatus: 'failed',
        installationLastError: error.message,
        shutdownReason: 'installation_failed'
      } as any);
      if (taskId) taskManager.updateTaskStatus(taskId, 'failed', undefined, error.message);
      throw error;
    }

    const refreshed = await this.getInstance(instanceId);
    if (taskId) {
      taskManager.setTaskResult(taskId, refreshed);
    }
    return refreshed;
  }

  public async updateInstance(instanceId: string, updates: Partial<Omit<ServerInstance, 'id' | 'serviceName' | 'pzDir' | 'pzName'>>): Promise<ServerInstance> {
    const instances = await this.repository.readAll();
    const instanceIndex = instances.findIndex(i => i.id === instanceId);

    if (instanceIndex === -1) {
      throw new NotFoundError(`Instance with ID ${instanceId} not found`);
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

  public async performSystemdAction(instanceId: string, action: SystemdAction): Promise<string> {
    const instance = await this.getInstance(instanceId);
    
    if (action === 'start') {
      const portConflicts = await this.getRunningPortConflicts(instance.gamePort, instance.rconPort, instanceId);
      if (portConflicts.length > 0) {
        throw new PortConflictError(portConflicts);
      }
      await this.updateInstance(instanceId, { shutdownReason: undefined });
    } else if (action === 'stop') {
      await this.updateInstance(instanceId, { shutdownReason: 'manual' });
    }

    try {
      if (isWindows) {
        return await this.performWindowsAction(instance, action);
      }

      await this.systemd.execute(action, instance.serviceName);
      return `Instance ${instance.name} ${action} successful`;
    } catch (error: any) {
      if (action === 'kill' && error.message?.includes('Invalid argument')) {
        return `Instance ${instance.name} force stopped (no process found)`;
      }
      throw error;
    }
  }

  public async getAvailableVersions() {
    const catalog = await getAvailableBuilds();
    return {
      source: catalog.source,
      data: catalog.data
    };
  }

  public async getMods(instanceId: string) {
    const instance = await this.getInstance(instanceId);
    const iniContent = await fs.readFile(instance.iniPath, 'utf-8');
    const modsMatch = iniContent.match(/^Mods=(.*)$/m);
    const workshopMatch = iniContent.match(/^WorkshopItems=(.*)$/m);

    const modsDir = path.join(os.homedir(), 'Zomboid', 'mods');
    let availableMods: string[] = [];
    try {
      const files = await fs.readdir(modsDir, { withFileTypes: true });
      availableMods = files.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
    } catch (e) { /* directory might not exist */ }

    return {
      mods: modsMatch ? modsMatch[1].split(';').filter(Boolean) : [],
      workshopItems: workshopMatch ? workshopMatch[1].split(';').filter(Boolean) : [],
      availableMods
    };
  }

  public async addMod(instanceId: string, modId?: string, workshopId?: string): Promise<void> {
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

  public async removeMod(instanceId: string, modId?: string, workshopId?: string): Promise<void> {
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
      try { await fs.rm(modPath, { recursive: true, force: true }); } catch (e) { /* ignore */ }
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

  public async installLocalMod(instanceId: string, filePath: string, originalName: string): Promise<string> {
    // Only verify instance exists to ensure permissions
    await this.getInstance(instanceId); 
    const modsDir = path.join(os.homedir(), 'Zomboid', 'mods');
    await fs.mkdir(modsDir, { recursive: true });

    const destPath = path.join(modsDir, sanitizeInstanceName(originalName));
    await fs.copyFile(filePath, destPath);
    await fs.unlink(filePath);
    return destPath;
  }

  public async deleteInstance(instanceId: string, createBackup: boolean, force: boolean = false): Promise<void> {
    this.ensureProvisioningPlatform();

    const instances = await this.repository.readAll();
    const instance = instances.find(i => i.id === instanceId);
    
    if (!instance) {
      if (force) return; // If forcing and not found, we're good
      throw new NotFoundError(`Instance with ID ${instanceId} not found`);
    }

    if (instance.isLocked) {
      throw new AppError('Instance is locked and cannot be deleted until unlocked.', 'INSTANCE_LOCKED', 423);
    }
    
    // 1. Stop instance if running
    try {
      await this.systemd.execute('stop', instance.serviceName);
    } catch (e) {
      // Ignore if not running
    }

    // 2. Backup if requested
    if (createBackup) {
      const backupDir = path.join(PZWEBADMIN_ROOT, 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `${instance.id}-${timestamp}.tar.gz`);
      
      const filesToBackup = [];
      if (await fs.access(instance.iniPath).then(()=>true).catch(()=>false)) filesToBackup.push(instance.iniPath);
      if (await fs.access(instance.db).then(()=>true).catch(()=>false)) filesToBackup.push(instance.db);
      if (await fs.access(instance.savePath).then(()=>true).catch(()=>false)) filesToBackup.push(instance.savePath);
      
      if (filesToBackup.length > 0) {
        await execFilePromise('tar', ['-czf', backupPath, ...filesToBackup]);
      }
    }

    // 3. Delete files using sudo script first (handles systemd + canonical paths)
    try {
      const scriptPath = path.join(PZWEBADMIN_ROOT, 'scripts', 'setup-instance-steamcmd.sh');
      await execFilePromise('sudo', [
        '/bin/bash', scriptPath, '--delete',
        instance.pzDir, instance.serviceName, instance.pzName,
        instance.iniPath || '',
        instance.savePath || '',
        instance.db || ''
      ]);
    } catch (e) {
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

// Export singleton instance
export const instancesRepository = new InstancesRepository();
export const systemdService = new SystemdService(instancesRepository);
export const instanceManager = new InstanceManager(instancesRepository, systemdService);
