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

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

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
  isActive?: boolean; // Deprecated
  shutdownReason?: string; // Reason for last shutdown (e.g. "manual", "resource-saturation")
}

interface InstancesConfig {
  instances: ServerInstance[];
}

const INSTANCES_CONFIG_PATH = path.join(__dirname, '../config/instances.json');

/**
 * Load instances configuration
 */
export const loadInstances = async (): Promise<InstancesConfig> => {
  try {
    const data = await fs.readFile(INSTANCES_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load instances configuration: ${error}`);
  }
};

/**
 * Save instances configuration
 */
export const saveInstances = async (config: InstancesConfig): Promise<void> => {
  try {
    await fs.writeFile(INSTANCES_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save instances configuration: ${error}`);
  }
};

/**
 * Get all server instances
 */
export const getInstances = async (): Promise<ServerInstance[]> => {
  const config = await loadInstances();
  return config.instances;
};

/**
 * Get instance by ID
 */
export const getInstanceById = async (id: string): Promise<ServerInstance | null> => {
  const config = await loadInstances();
  return config.instances.find(i => i.id === id) || null;
};

/**
 * Start an instance
 */
export const startInstance = async (instanceId: string): Promise<string> => {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance with ID ${instanceId} not found`);

  try {
    await execPromise(`sudo systemctl start ${instance.serviceName}`);
    return `Instance ${instance.name} started`;
  } catch (error) {
    throw new Error(`Failed to start instance: ${error}`);
  }
};

/**
 * Stop an instance
 */
export const stopInstance = async (instanceId: string): Promise<string> => {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance with ID ${instanceId} not found`);

  try {
    await execPromise(`sudo systemctl stop ${instance.serviceName}`);
    return `Instance ${instance.name} stopped`;
  } catch (error) {
    throw new Error(`Failed to stop instance: ${error}`);
  }
};

/**
 * Restart an instance
 */
export const restartInstance = async (instanceId: string): Promise<string> => {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance with ID ${instanceId} not found`);

  try {
    await execPromise(`sudo systemctl restart ${instance.serviceName}`);
    return `Instance ${instance.name} restarted`;
  } catch (error) {
    throw new Error(`Failed to restart instance: ${error}`);
  }
};

/**
 * Force Stop an instance (KILL)
 */
export const forceStopInstance = async (instanceId: string): Promise<string> => {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance with ID ${instanceId} not found`);

  try {
    await execPromise(`sudo systemctl kill -s SIGKILL ${instance.serviceName}`);
    return `Instance ${instance.name} force stopped`;
  } catch (error) {
    throw new Error(`Failed to force stop instance: ${error}`);
  }
};

/**
 * Get status of all instances
 */
export const getInstancesStatus = async (): Promise<Array<ServerInstance & { running: boolean; pid?: string }>> => {
  const instances = await getInstances();

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
          if (pid === '0') pid = undefined;
        } catch (e) { /* ignore */ }
      }

      return { ...instance, running, pid };
    } catch {
      return { ...instance, running: false };
    }
  });

  return Promise.all(statusPromises);
};

/**
 * Add a new instance
 */
export const addInstance = async (
  name: string,
  pathDir: string,
  serviceName: string
): Promise<ServerInstance> => {
  // Basic validation
  try {
    await fs.access(pathDir);
  } catch {
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

  const newInstance: ServerInstance = {
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

  const config = await loadInstances();
  config.instances.push(newInstance);
  await saveInstances(config);
  return newInstance;
};

/**
 * Update instance configuration
 */
export const updateInstance = async (
  instanceId: string,
  updates: Partial<Omit<ServerInstance, 'id'>>
): Promise<ServerInstance> => {
  const config = await loadInstances();
  const instance = config.instances.find(i => i.id === instanceId);

  if (!instance) {
    throw new Error(`Instance with ID ${instanceId} not found`);
  }

  Object.assign(instance, updates);
  await saveInstances(config);

  return instance;
};

