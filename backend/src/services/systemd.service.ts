import { execFile } from 'child_process';
import { promisify } from 'util';
import { assertValidServiceName } from '../utils/instanceName';
import { SystemCommandError, ValidationError, AppError } from '../utils/errors';
import { InstancesRepository } from '../repositories/instances.repository';
import { isWindows, windowsSystemdUnsupportedMessage } from '../utils/platform';

const execFilePromise = promisify(execFile);

export type SystemdAction = 'start' | 'stop' | 'restart' | 'status' | 'is-active' | 'kill';

const ALLOWED_ACTIONS: Set<SystemdAction> = new Set(['start', 'stop', 'restart', 'status', 'is-active', 'kill']);

export class SystemdService {
  private repository: InstancesRepository;

  constructor(repository: InstancesRepository) {
    this.repository = repository;
  }

  private isSudoPermissionError(error: any): boolean {
    const stderr = String(error?.stderr || '').toLowerCase();
    return stderr.includes('a password is required') || stderr.includes('passwordless sudo') || stderr.includes('sorry, try again');
  }

  private isUnitNotFoundError(error: any): boolean {
    const text = `${String(error?.stderr || '')} ${String(error?.stdout || '')}`.toLowerCase();
    return text.includes('could not be found') || text.includes('unit ') && text.includes('not found');
  }

  private ensureSupportedPlatform(): void {
    if (isWindows) {
      throw new AppError(windowsSystemdUnsupportedMessage, 'PLATFORM_UNSUPPORTED', 501);
    }
  }

  /**
   * Safely execute a systemctl command.
   */
  public async execute(action: SystemdAction, serviceName: string, extraArgs: string[] = []): Promise<{ stdout: string; stderr: string }> {
    this.ensureSupportedPlatform();

    if (!ALLOWED_ACTIONS.has(action)) {
      throw new ValidationError(`Invalid systemd action: ${action}`);
    }

    // 1. Strict regex validation for serviceName
    assertValidServiceName(serviceName);

    // 2. Validate against active instances (repository)
    const instances = await this.repository.readAll();
    const isValidInstance = instances.some(i => i.serviceName === serviceName);
    
    if (!isValidInstance) {
      throw new ValidationError(`Security Violation: Service ${serviceName} is not a registered instance.`);
    }

    try {
      const args = ['-n', '/usr/bin/systemctl', action, ...extraArgs, serviceName];
      return await execFilePromise('sudo', args);
    } catch (error: any) {
      if (this.isSudoPermissionError(error)) {
        try {
          // Fallback for environments where backend user can call systemctl directly.
          return await execFilePromise('/usr/bin/systemctl', [action, ...extraArgs, serviceName]);
        } catch {
          throw new AppError(
            'The backend user does not have permission to manage systemd. Run: sudo /opt/pzwebadmin/scripts/setup-sudoers.sh',
            'PERMISSION_DENIED_SYSTEMD',
            403
          );
        }
      }
      if (this.isUnitNotFoundError(error)) {
        throw new AppError(`Systemd service ${serviceName}.service was not found.`, 'SERVICE_NOT_FOUND', 404);
      }
      throw new SystemCommandError(`systemctl ${action} failed for ${serviceName}`, error);
    }
  }

  public async getProperty(serviceName: string, property: string): Promise<string> {
    this.ensureSupportedPlatform();

    assertValidServiceName(serviceName);
    try {
      const args = ['-n', '/usr/bin/systemctl', 'show', serviceName, `--property=${property}`, '--value'];
      const { stdout } = await execFilePromise('sudo', args);
      return stdout.trim();
    } catch (error: any) {
      if (this.isSudoPermissionError(error)) {
        try {
          const { stdout } = await execFilePromise('/usr/bin/systemctl', ['show', serviceName, `--property=${property}`, '--value']);
          return stdout.trim();
        } catch {
          throw new AppError(
            'The backend user does not have permission to inspect systemd. Run: sudo /opt/pzwebadmin/scripts/setup-sudoers.sh',
            'PERMISSION_DENIED_SYSTEMD',
            403
          );
        }
      }
      if (this.isUnitNotFoundError(error)) {
        throw new AppError(`Systemd service ${serviceName}.service was not found.`, 'SERVICE_NOT_FOUND', 404);
      }
      throw new SystemCommandError(`Failed to get property ${property} for ${serviceName}`, error);
    }
  }
}
