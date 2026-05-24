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
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeModController = exports.uploadModController = exports.addModController = exports.getModsController = exports.updateInstanceController = exports.addInstanceController = exports.deleteInstanceController = exports.getTaskController = exports.forceStopInstanceController = exports.restartInstanceController = exports.stopInstanceController = exports.startInstanceController = exports.getInstancesController = exports.getAvailableVersionsController = exports.getTasksController = exports.retryInstanceInstallController = exports.createInstanceFromVersionController = void 0;
const instance_manager_1 = require("../managers/instance.manager");
const errors_1 = require("../utils/errors");
const task_manager_1 = require("../managers/task.manager");
const instance_install_queue_manager_1 = require("../managers/instance-install-queue.manager");
const handleError = (res, error, defaultMessage) => {
    if (error instanceof errors_1.AppError) {
        res.status(error.status).json({
            success: false,
            error: true,
            code: error.code,
            message: error.message,
            ...(error.conflicts ? { conflicts: error.conflicts } : {})
        });
    }
    else {
        const msg = error instanceof Error ? error.message : defaultMessage;
        res.status(500).json({ success: false, error: true, code: 'INTERNAL_ERROR', message: msg });
    }
};
/**
 * Create instance from selected version
 */
const createInstanceFromVersionController = async (req, res) => {
    try {
        const body = req.body;
        const branchId = body.branchId || body.versionPath;
        const serverPort = Number(body.serverPort ?? body.gamePort);
        const rconPort = Number(body.rconPort);
        const name = (body.name || '').trim();
        if (!branchId || !name || !serverPort || !rconPort) {
            res.status(400).json({ success: false, error: true, code: 'VALIDATION_ERROR', message: 'Faltan campos obligatorios / Missing required fields' });
            return;
        }
        const { task, queueLength } = instance_install_queue_manager_1.instanceInstallQueueManager.enqueue({
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
    }
    catch (error) {
        handleError(res, error, 'Failed to create instance');
    }
};
exports.createInstanceFromVersionController = createInstanceFromVersionController;
const retryInstanceInstallController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        if (!instanceId) {
            res.status(400).json({ success: false, error: true, code: 'VALIDATION_ERROR', message: 'Instance ID is required' });
            return;
        }
        const { task, queueLength } = instance_install_queue_manager_1.instanceInstallQueueManager.enqueueRetry(instanceId);
        res.status(202).json({
            success: true,
            taskId: task.id,
            task,
            queueLength,
            message: queueLength > 1
                ? `Instance retry queued. ${queueLength - 1} task(s) ahead.`
                : 'Instance retry started.'
        });
    }
    catch (error) {
        handleError(res, error, 'Failed to retry instance installation');
    }
};
exports.retryInstanceInstallController = retryInstanceInstallController;
const getTasksController = (req, res) => {
    const kindQuery = typeof req.query.kind === 'string' ? req.query.kind.trim() : '';
    const activeOnly = req.query.activeOnly === 'true';
    const limit = Number(req.query.limit);
    const tasks = task_manager_1.taskManager.getAllTasks({
        kind: kindQuery === 'instance_install' ? 'instance_install' : undefined,
        activeOnly,
        limit: Number.isFinite(limit) ? limit : undefined
    });
    res.json({ success: true, data: tasks });
};
exports.getTasksController = getTasksController;
/**
 * Get available PZ server versions
 */
const getAvailableVersionsController = async (_req, res) => {
    try {
        const versions = await instance_manager_1.instanceManager.getAvailableVersions();
        res.json({ success: true, source: versions.source, data: versions.data });
    }
    catch (error) {
        handleError(res, error, 'Failed to get versions');
    }
};
exports.getAvailableVersionsController = getAvailableVersionsController;
/**
 * Get all server instances
 */
const getInstancesController = async (_req, res) => {
    try {
        const instances = await instance_manager_1.instanceManager.listInstances();
        const activeInstallTasks = task_manager_1.taskManager.getAllTasks({ kind: 'instance_install', activeOnly: true, limit: 200 });
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
    }
    catch (error) {
        handleError(res, error, 'Failed to get instances');
    }
};
exports.getInstancesController = getInstancesController;
/**
 * Start an instance
 */
const startInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const message = await instance_manager_1.instanceManager.performSystemdAction(instanceId, 'start');
        res.json({ success: true, message });
    }
    catch (error) {
        handleError(res, error, 'Failed to start instance');
    }
};
exports.startInstanceController = startInstanceController;
/**
 * Stop an instance
 */
const stopInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const message = await instance_manager_1.instanceManager.performSystemdAction(instanceId, 'stop');
        res.json({ success: true, message });
    }
    catch (error) {
        handleError(res, error, 'Failed to stop instance');
    }
};
exports.stopInstanceController = stopInstanceController;
/**
 * Restart an instance
 */
const restartInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const message = await instance_manager_1.instanceManager.performSystemdAction(instanceId, 'restart');
        res.json({ success: true, message });
    }
    catch (error) {
        handleError(res, error, 'Failed to restart instance');
    }
};
exports.restartInstanceController = restartInstanceController;
/**
 * Force Stop an instance
 */
const forceStopInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const message = await instance_manager_1.instanceManager.performSystemdAction(instanceId, 'kill');
        res.json({ success: true, message });
    }
    catch (error) {
        handleError(res, error, 'Failed to force stop instance');
    }
};
exports.forceStopInstanceController = forceStopInstanceController;
const getTaskController = (req, res) => {
    const { taskId } = req.params;
    const task = task_manager_1.taskManager.getTask(taskId);
    if (!task) {
        res.status(404).json({ success: false, error: true, code: 'NOT_FOUND', message: 'Tarea no encontrada / Task not found' });
        return;
    }
    res.json({ success: true, data: task });
};
exports.getTaskController = getTaskController;
/**
 * Delete an instance
 */
const deleteInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const { createBackup, force } = req.body;
        const forceDelete = force || req.query.force === 'true';
        await instance_manager_1.instanceManager.deleteInstance(instanceId, !!createBackup, forceDelete);
        res.json({ success: true, message: 'Instancia eliminada correctamente / Instance deleted successfully' });
    }
    catch (error) {
        handleError(res, error, 'Failed to delete instance');
    }
};
exports.deleteInstanceController = deleteInstanceController;
/**
 * Add a new instance
 */
const addInstanceController = async (req, res) => {
    try {
        const body = req.body;
        const name = (body.name || '').trim();
        if (body.branchId) {
            const serverPort = Number(body.serverPort ?? body.gamePort);
            const rconPort = Number(body.rconPort);
            if (!name || !serverPort || !rconPort) {
                res.status(400).json({ success: false, error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields' });
                return;
            }
            const { task, queueLength } = instance_install_queue_manager_1.instanceInstallQueueManager.enqueue({
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
        const instance = await instance_manager_1.instanceManager.addInstance(name, path, serviceName, Number(body.gamePort) || 0, Number(body.rconPort) || 0, body.force, pzName, body.iniPath, body.savePath, body.dbPath);
        res.json({ success: true, data: instance });
    }
    catch (error) {
        handleError(res, error, 'Failed to add instance');
    }
};
exports.addInstanceController = addInstanceController;
/**
 * Update instance configuration
 */
const updateInstanceController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const updates = req.body;
        const instance = await instance_manager_1.instanceManager.updateInstance(instanceId, updates);
        res.json({ success: true, data: instance });
    }
    catch (error) {
        handleError(res, error, 'Failed to update instance');
    }
};
exports.updateInstanceController = updateInstanceController;
/**
 * Get Mods
 */
const getModsController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const mods = await instance_manager_1.instanceManager.getMods(instanceId);
        res.json({ success: true, data: mods });
    }
    catch (error) {
        handleError(res, error, 'Failed to get mods');
    }
};
exports.getModsController = getModsController;
/**
 * Add Mod (ID or Workshop)
 */
const addModController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const body = req.body;
        const { modId, workshopId } = body;
        await instance_manager_1.instanceManager.addMod(instanceId, modId, workshopId);
        res.json({ success: true, message: 'Mod added successfully' });
    }
    catch (error) {
        handleError(res, error, 'Failed to add mod');
    }
};
exports.addModController = addModController;
/**
 * Upload Mod File
 */
const uploadModController = async (req, res) => {
    try {
        const { instanceId } = req.params;
        const file = req.file;
        if (!file) {
            res.status(400).json({ success: false, error: true, code: 'VALIDATION_ERROR', message: 'No file uploaded' });
            return;
        }
        await instance_manager_1.instanceManager.installLocalMod(instanceId, file.path, file.originalname);
        res.json({ success: true, message: 'Mod uploaded successfully' });
    }
    catch (error) {
        handleError(res, error, 'Failed to upload mod');
    }
};
exports.uploadModController = uploadModController;
/**
 * Remove Mod
 */
const removeModController = async (req, res) => {
    try {
        const { instanceId, modId } = req.params;
        const { workshopId } = req.query;
        await instance_manager_1.instanceManager.removeMod(instanceId, modId, String(workshopId || ''));
        res.json({ success: true, message: 'Mod removed successfully' });
    }
    catch (error) {
        handleError(res, error, 'Failed to remove mod');
    }
};
exports.removeModController = removeModController;
