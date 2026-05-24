"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instanceInstallQueueManager = void 0;
const instance_manager_1 = require("./instance.manager");
const errors_1 = require("../utils/errors");
const task_manager_1 = require("./task.manager");
const instanceName_1 = require("../utils/instanceName");
class InstanceInstallQueueManager {
    constructor() {
        this.queue = [];
        this.processing = false;
    }
    syncQueuePositions() {
        this.queue.forEach((item, index) => {
            task_manager_1.taskManager.updateTaskMetadata(item.taskId, {
                queuePosition: index + 1,
                queueState: index === 0 && this.processing ? 'running' : 'queued'
            });
        });
    }
    async processQueue() {
        if (this.processing)
            return;
        this.processing = true;
        this.syncQueuePositions();
        while (this.queue.length > 0) {
            const current = this.queue[0];
            const { taskId, request } = current;
            task_manager_1.taskManager.updateTaskMetadata(taskId, { queueState: 'running', queuePosition: 1 });
            task_manager_1.taskManager.updateTaskStatus(taskId, 'running', 1);
            task_manager_1.taskManager.addLog(taskId, '[queue] Installation started.');
            try {
                if (current.type === 'create') {
                    const createRequest = request;
                    await instance_manager_1.instanceManager.createInstanceFromVersion(createRequest.branchId, createRequest.name, createRequest.gamePort, createRequest.rconPort, createRequest.force, Boolean(createRequest.allowUnknownBranch), taskId);
                }
                else {
                    const retryRequest = request;
                    await instance_manager_1.instanceManager.retryInstanceInstallation(retryRequest.instanceId, taskId);
                }
                const updated = task_manager_1.taskManager.getTask(taskId);
                if (updated && updated.status !== 'success') {
                    task_manager_1.taskManager.setTaskResult(taskId, updated.result || { success: true });
                }
            }
            catch (error) {
                const message = error instanceof errors_1.AppError || error instanceof Error
                    ? error.message
                    : 'Unknown installation error';
                task_manager_1.taskManager.updateTaskStatus(taskId, 'failed', undefined, message);
                task_manager_1.taskManager.addLog(taskId, `[queue] Installation failed: ${message}`);
            }
            finally {
                task_manager_1.taskManager.updateTaskMetadata(taskId, { queueState: 'completed', queuePosition: undefined });
                this.queue.shift();
                this.syncQueuePositions();
            }
        }
        this.processing = false;
    }
    enqueue(request) {
        const instanceId = (0, instanceName_1.sanitizeInstanceName)(request.name).toLowerCase();
        const task = task_manager_1.taskManager.createTask(`Create Instance '${request.name}'`, {
            kind: 'instance_install',
            metadata: {
                instanceId,
                instanceName: request.name,
                branchId: request.branchId,
                gamePort: request.gamePort,
                rconPort: request.rconPort,
                queueState: 'queued'
            }
        });
        this.queue.push({ taskId: task.id, type: 'create', request });
        this.syncQueuePositions();
        task_manager_1.taskManager.addLog(task.id, `[queue] Installation queued at position ${this.queue.length}.`);
        void this.processQueue();
        return { task, queueLength: this.queue.length };
    }
    enqueueRetry(instanceId) {
        const task = task_manager_1.taskManager.createTask(`Retry Instance '${instanceId}'`, {
            kind: 'instance_install',
            metadata: {
                instanceId,
                queueState: 'queued',
                retry: true
            }
        });
        this.queue.push({ taskId: task.id, type: 'retry', request: { instanceId } });
        this.syncQueuePositions();
        task_manager_1.taskManager.addLog(task.id, `[queue] Retry queued at position ${this.queue.length}.`);
        void this.processQueue();
        return { task, queueLength: this.queue.length };
    }
}
exports.instanceInstallQueueManager = new InstanceInstallQueueManager();
