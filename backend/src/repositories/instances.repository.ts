import * as fs from 'fs/promises';
import * as path from 'path';
import { PZ_INSTANCES_ROOT, DEFAULT_INSTANCES_CONFIG_PATH } from '../config/paths';
import { ValidationError } from '../utils/errors';
import { validateInstanceName, assertValidServiceName } from '../utils/instanceName';

export interface ServerInstance {
  id: string;
  name: string;
  description: string;
  version: string;
  serviceName: string;
  pzDir: string;
  pzName: string;
  logPath: string;
  maintenanceLogPath: string;
  iniPath: string;
  savePath: string;
  db: string;
  rconPort: number;
  gamePort: number;
  isActive?: boolean;
  shutdownReason?: string;
}

export interface InstancesConfig {
  instances: ServerInstance[];
}

export class InstancesRepository {
  private configPath: string;

  constructor(configPath: string = DEFAULT_INSTANCES_CONFIG_PATH) {
    this.configPath = configPath;
  }

  public async readAll(): Promise<ServerInstance[]> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(data) as InstancesConfig;
      
      // Validate schema on load and filter out invalid ones
      return parsed.instances.filter(this.validateSchema);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to load instances configuration: ${error.message}`);
    }
  }

  public async writeAll(instances: ServerInstance[]): Promise<void> {
    this.preventDuplicates(instances);
    const config: InstancesConfig = { instances };
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  public async findByName(name: string): Promise<ServerInstance | null> {
    const instances = await this.readAll();
    return instances.find(i => i.name === name || i.id === name) || null;
  }

  public async exists(name: string): Promise<boolean> {
    const instance = await this.findByName(name);
    return instance !== null;
  }

  private validateSchema(instance: ServerInstance): boolean {
    try {
      if (!instance.name || !validateInstanceName(instance.id)) return false;
      assertValidServiceName(instance.serviceName);

      if (typeof instance.gamePort !== 'number' || instance.gamePort <= 0 || instance.gamePort > 65535) return false;
      if (typeof instance.rconPort !== 'number' || instance.rconPort <= 0 || instance.rconPort > 65535) return false;

      // Ensure path is within PZ_INSTANCES_ROOT
      const resolvedPath = path.resolve(instance.pzDir);
      if (!resolvedPath.startsWith(PZ_INSTANCES_ROOT)) return false;

      return true;
    } catch (e) {
      return false; // Validation error means invalid schema
    }
  }

  private preventDuplicates(instances: ServerInstance[]): void {
    const names = new Set<string>();
    const serviceNames = new Set<string>();
    const ports = new Set<number>();

    for (const instance of instances) {
      if (names.has(instance.id)) throw new ValidationError(`Duplicate instance ID found: ${instance.id}`);
      if (serviceNames.has(instance.serviceName)) throw new ValidationError(`Duplicate serviceName found: ${instance.serviceName}`);
      if (ports.has(instance.gamePort)) throw new ValidationError(`Duplicate gamePort found: ${instance.gamePort}`);
      if (ports.has(instance.rconPort)) throw new ValidationError(`Duplicate rconPort found: ${instance.rconPort}`);

      names.add(instance.id);
      serviceNames.add(instance.serviceName);
      ports.add(instance.gamePort);
      ports.add(instance.rconPort);
    }
  }
}
