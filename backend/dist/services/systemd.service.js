"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemdService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const instanceName_1 = require("../utils/instanceName");
const errors_1 = require("../utils/errors");
const platform_1 = require("../utils/platform");
const execFilePromise = (0, util_1.promisify)(child_process_1.execFile);
const ALLOWED_ACTIONS = new Set(['start', 'stop', 'restart', 'status', 'is-active', 'kill']);
class SystemdService {
    constructor(repository) {
        this.repository = repository;
    }
    isSudoPermissionError(error) {
        const stderr = String(error?.stderr || '').toLowerCase();
        return stderr.includes('a password is required') || stderr.includes('passwordless sudo') || stderr.includes('sorry, try again');
    }
    isUnitNotFoundError(error) {
        const text = `${String(error?.stderr || '')} ${String(error?.stdout || '')}`.toLowerCase();
        return text.includes('could not be found') || text.includes('unit ') && text.includes('not found');
    }
    ensureSupportedPlatform() {
        if (platform_1.isWindows) {
            throw new errors_1.AppError(platform_1.windowsSystemdUnsupportedMessage, 'PLATFORM_UNSUPPORTED', 501);
        }
    }
    /**
     * Safely execute a systemctl command.
     */
    async execute(action, serviceName, extraArgs = []) {
        this.ensureSupportedPlatform();
        if (!ALLOWED_ACTIONS.has(action)) {
            throw new errors_1.ValidationError(`Invalid systemd action: ${action}`);
        }
        // 1. Strict regex validation for serviceName
        (0, instanceName_1.assertValidServiceName)(serviceName);
        // 2. Validate against active instances (repository)
        const instances = await this.repository.readAll();
        const isValidInstance = instances.some(i => i.serviceName === serviceName);
        if (!isValidInstance) {
            throw new errors_1.ValidationError(`Security Violation: Service ${serviceName} is not a registered instance.`);
        }
        try {
            const args = ['-n', '/usr/bin/systemctl', action, ...extraArgs, serviceName];
            return await execFilePromise('sudo', args);
        }
        catch (error) {
            if (this.isSudoPermissionError(error)) {
                try {
                    // Fallback for environments where backend user can call systemctl directly.
                    return await execFilePromise('/usr/bin/systemctl', [action, ...extraArgs, serviceName]);
                }
                catch {
                    throw new errors_1.AppError('The backend user does not have permission to manage systemd. Run: sudo /opt/pzwebadmin/scripts/setup-sudoers.sh', 'PERMISSION_DENIED_SYSTEMD', 403);
                }
            }
            if (this.isUnitNotFoundError(error)) {
                throw new errors_1.AppError(`Systemd service ${serviceName}.service was not found.`, 'SERVICE_NOT_FOUND', 404);
            }
            throw new errors_1.SystemCommandError(`systemctl ${action} failed for ${serviceName}`, error);
        }
    }
    async getProperty(serviceName, property) {
        this.ensureSupportedPlatform();
        (0, instanceName_1.assertValidServiceName)(serviceName);
        try {
            const args = ['-n', '/usr/bin/systemctl', 'show', serviceName, `--property=${property}`, '--value'];
            const { stdout } = await execFilePromise('sudo', args);
            return stdout.trim();
        }
        catch (error) {
            if (this.isSudoPermissionError(error)) {
                try {
                    const { stdout } = await execFilePromise('/usr/bin/systemctl', ['show', serviceName, `--property=${property}`, '--value']);
                    return stdout.trim();
                }
                catch {
                    throw new errors_1.AppError('The backend user does not have permission to inspect systemd. Run: sudo /opt/pzwebadmin/scripts/setup-sudoers.sh', 'PERMISSION_DENIED_SYSTEMD', 403);
                }
            }
            if (this.isUnitNotFoundError(error)) {
                throw new errors_1.AppError(`Systemd service ${serviceName}.service was not found.`, 'SERVICE_NOT_FOUND', 404);
            }
            throw new errors_1.SystemCommandError(`Failed to get property ${property} for ${serviceName}`, error);
        }
    }
}
exports.SystemdService = SystemdService;
