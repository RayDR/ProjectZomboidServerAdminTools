
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



import { Request, Response } from 'express';
import { instanceManager } from '../managers/instance.manager';
import { AppError } from '../utils/errors';
import { taskManager } from '../managers/task.manager';
import { instanceInstallQueueManager } from '../managers/instance-install-queue.manager';

const handleError = (res: Response, error: unknown, defaultMessage: string) => {
  if (error instanceof AppError) {
    res.status(error.status).json({
      success: false, 
      error: true, 
      code: error.code, 
      message: error.message,
      ...((error as any).conflicts ? { conflicts: (error as any).conflicts } : {})
    });
  } else {
    const msg = error instanceof Error ? error.message : defaultMessage;
    res.status(500).json({ success: false, error: true, code: 'INTERNAL_ERROR', message: msg });
  }
};

/**
 * Create instance from selected version
 */
export const createInstanceFromVersionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as {
      branchId?: string;
      versionPath?: string;
      name?: string;
      serverPort?: number;
      gamePort?: number;
      rconPort?: number;
      force?: boolean;
      allowUnknownBranch?: boolean;
    };

    const branchId = body.branchId || body.versionPath;
    const serverPort = Number(body.serverPort ?? body.gamePort);
    const rconPort = Number(body.rconPort);
    const name = (body.name || '').trim();

    if (!branchId || !name || !serverPort || !rconPort) {
      res.status(400).json({ success: false, error: true, code: 'VALIDATION_ERROR', message: 'Faltan campos obligatorios / Missing required fields' });
      return;
    }

    const { task, queueLength } = instanceInstallQueueManager.enqueue({
      branchId,
      name,
      gamePort: serverPort,
      rconPort,
      force: body.force,
      allowUnknownBranch: Boolean(body.allowUnknownBranch)
    });

    res.status(202).json({
      success: true,
      taskId: task.id,
      task,
      queueLength,
      message: queueLength > 1
        ? `Instance creation queued. ${queueLength - 1} task(s) ahead.`
        : 'Instance creation started.'
    });
  } catch (error) {
    handleError(res, error, 'Failed to create instance');
  }
};

export const retryInstanceInstallController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    if (!instanceId) {
      res.status(400).json({ success: false, error: true, code: 'VALIDATION_ERROR', message: 'Instance ID is required' });
      return;
    }

    const { task, queueLength } = instanceInstallQueueManager.enqueueRetry(instanceId);
    res.status(202).json({
      success: true,
      taskId: task.id,
      task,
      queueLength,
      message: queueLength > 1
        ? `Instance retry queued. ${queueLength - 1} task(s) ahead.`
        : 'Instance retry started.'
    });
  } catch (error) {
    handleError(res, error, 'Failed to retry instance installation');
  }
};

export const getTasksController = (req: Request, res: Response): void => {
  const kindQuery = typeof req.query.kind === 'string' ? req.query.kind.trim() : '';
  const activeOnly = req.query.activeOnly === 'true';
  const limit = Number(req.query.limit);

  const tasks = taskManager.getAllTasks({
    kind: kindQuery === 'instance_install' ? 'instance_install' : undefined,
    activeOnly,
    limit: Number.isFinite(limit) ? limit : undefined
  });

  res.json({ success: true, data: tasks });
};

/**
 * Get available PZ server versions
 */
export const getAvailableVersionsController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const versions = await instanceManager.getAvailableVersions();
    res.json({ success: true, source: versions.source, data: versions.data });
  } catch (error) {
    handleError(res, error, 'Failed to get versions');
  }
};



/**
 * Get all server instances
 */
export const getInstancesController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const instances = await instanceManager.listInstances();
    const activeInstallTasks = taskManager.getAllTasks({ kind: 'instance_install', activeOnly: true, limit: 200 });

    const provisioned = activeInstallTasks
      .filter((task) => task?.metadata?.instanceId)
      .map((task) => {
        const metadata = task.metadata || {};
        const installationStatus = task.status === 'running' ? 'installing' : 'queued';
        const queuePosition = typeof metadata.queuePosition === 'number' ? metadata.queuePosition : 0;
        const instanceId = String(metadata.instanceId || '');

        return {
          id: instanceId,
          name: metadata.instanceName || instanceId,
          description: `Provisioning from branch ${metadata.branchId || 'unknown'}`,
          version: metadata.branchId || 'unknown',
          serviceName: `pzomboid-${instanceId}`,
          pzDir: `/opt/pzserver-${instanceId}`,
          pzName: `pzserver-${instanceId}`,
          logPath: `/opt/pzserver-${instanceId}/logs/server.log`,
          maintenanceLogPath: `/opt/pzserver-${instanceId}/logs/maintenance.log`,
          iniPath: `/home/pzadmin/Zomboid/Server/pzserver-${instanceId}.ini`,
          savePath: `/home/pzadmin/Zomboid/Saves/Multiplayer/pzserver-${instanceId}`,
          db: `/home/pzadmin/Zomboid/db/pzserver-${instanceId}.db`,
          rconPort: Number(metadata.rconPort) || 0,
          gamePort: Number(metadata.gamePort) || 0,
          running: false,
          pid: undefined,
          broken: false,
          installationTaskId: task.id,
          installationStatus,
          installationLocked: true,
          installationProgress: task.progress || 0,
          installationQueuePosition: queuePosition
        };
      })
      .filter((taskInstance) => !instances.some((instance) => instance.id === taskInstance.id));

    res.json({ success: true, data: [...instances, ...provisioned] });
  } catch (error) {
    handleError(res, error, 'Failed to get instances');
  }
};

/**
 * Start an instance
 */
export const startInstanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    const message = await instanceManager.performSystemdAction(instanceId, 'start');
    res.json({ success: true, message });
  } catch (error) {
    handleError(res, error, 'Failed to start instance');
  }
};

/**
 * Stop an instance
 */
export const stopInstanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    const message = await instanceManager.performSystemdAction(instanceId, 'stop');
    res.json({ success: true, message });
  } catch (error) {
    handleError(res, error, 'Failed to stop instance');
  }
};

/**
 * Restart an instance
 */
export const restartInstanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    const message = await instanceManager.performSystemdAction(instanceId, 'restart');
    res.json({ success: true, message });
  } catch (error) {
    handleError(res, error, 'Failed to restart instance');
  }
};

/**
 * Force Stop an instance
 */
export const forceStopInstanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    const message = await instanceManager.performSystemdAction(instanceId, 'kill');
    res.json({ success: true, message });
  } catch (error) {
    handleError(res, error, 'Failed to force stop instance');
  }
};

export const getTaskController = (req: Request, res: Response): void => {
  const { taskId } = req.params as { taskId: string };
  const task = taskManager.getTask(taskId);
  if (!task) {
    res.status(404).json({ success: false, error: true, code: 'NOT_FOUND', message: 'Tarea no encontrada / Task not found' });
    return;
  }
  res.json({ success: true, data: task });
};

/**
 * Delete an instance
 */
export const deleteInstanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    const { createBackup, force } = req.body as { createBackup: boolean, force?: boolean };
    const forceDelete = force || req.query.force === 'true';
    await instanceManager.deleteInstance(instanceId, !!createBackup, forceDelete);
    res.json({ success: true, message: 'Instancia eliminada correctamente / Instance deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete instance');
  }
};

/**
 * Add a new instance
 */
export const addInstanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as {
      name?: string;
      path?: string;
      serviceName?: string;
      iniPath?: string;
      savePath?: string;
      dbPath?: string;
      pzName?: string;
      force?: boolean;
      branchId?: string;
      serverPort?: number;
      gamePort?: number;
      rconPort?: number;
      allowUnknownBranch?: boolean;
    };

    const name = (body.name || '').trim();

    if (body.branchId) {
      const serverPort = Number(body.serverPort ?? body.gamePort);
      const rconPort = Number(body.rconPort);

      if (!name || !serverPort || !rconPort) {
        res.status(400).json({ success: false, error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields' });
        return;
      }

      const { task, queueLength } = instanceInstallQueueManager.enqueue({
        branchId: body.branchId,
        name,
        gamePort: serverPort,
        rconPort,
        force: body.force,
        allowUnknownBranch: Boolean(body.allowUnknownBranch)
      });

      res.status(202).json({
        success: true,
        taskId: task.id,
        task,
        queueLength,
        message: queueLength > 1
          ? `Instance creation queued. ${queueLength - 1} task(s) ahead.`
          : 'Instance creation started.'
      });
      return;
    }

    const path = body.path;
    const serviceName = (body.serviceName || '').trim();
    const pzName = body.pzName;
    if (!name || !path) {
      res.status(400).json({ success: false, error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields' });
      return;
    }

    const instance = await instanceManager.addInstance(
      name,
      path,
      serviceName,
      Number(body.gamePort) || 0,
      Number(body.rconPort) || 0,
      body.force,
      pzName,
      body.iniPath,
      body.savePath,
      body.dbPath
    );
    res.json({ success: true, data: instance });
  } catch (error) {
    handleError(res, error, 'Failed to add instance');
  }
};


/**
 * Update instance configuration
 */
export const updateInstanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    const updates = req.body;
    const instance = await instanceManager.updateInstance(instanceId, updates);
    res.json({ success: true, data: instance });
  } catch (error) {
    handleError(res, error, 'Failed to update instance');
  }
};

/**
 * Get Mods
 */
export const getModsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    const mods = await instanceManager.getMods(instanceId);
    res.json({ success: true, data: mods });
  } catch (error) {
    handleError(res, error, 'Failed to get mods');
  }
};

/**
 * Add Mod (ID or Workshop)
 */
export const addModController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    const body = req.body as { modId?: string; workshopId?: string };
    const { modId, workshopId } = body;
    await instanceManager.addMod(instanceId, modId, workshopId);
    res.json({ success: true, message: 'Mod added successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to add mod');
  }
};

/**
 * Upload Mod File
 */
export const uploadModController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params as { instanceId: string };
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: true, code: 'VALIDATION_ERROR', message: 'No file uploaded' });
      return;
    }
    await instanceManager.installLocalMod(instanceId, file.path, file.originalname);
    res.json({ success: true, message: 'Mod uploaded successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to upload mod');
  }
};
/**
 * Remove Mod
 */
export const removeModController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId, modId } = req.params as { instanceId: string; modId: string };
    const { workshopId } = req.query as { workshopId?: string };
    await instanceManager.removeMod(instanceId, modId, String(workshopId || ''));
    res.json({ success: true, message: 'Mod removed successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to remove mod');
  }
};
