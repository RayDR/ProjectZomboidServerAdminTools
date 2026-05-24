import { instanceManager } from './instance.manager';
import { AppError } from '../utils/errors';
import { Task, taskManager } from './task.manager';
import { sanitizeInstanceName } from '../utils/instanceName';

interface QueueRequest {
  branchId: string;
  name: string;
  gamePort: number;
  rconPort: number;
  force?: boolean;
  allowUnknownBranch?: boolean;
}

interface RetryQueueRequest {
  instanceId: string;
}

interface QueueItem {
  taskId: string;
  type: 'create' | 'retry';
  request: QueueRequest | RetryQueueRequest;
}

class InstanceInstallQueueManager {
  private queue: QueueItem[] = [];
  private processing = false;

  private syncQueuePositions(): void {
    this.queue.forEach((item, index) => {
      taskManager.updateTaskMetadata(item.taskId, {
        queuePosition: index + 1,
        queueState: index === 0 && this.processing ? 'running' : 'queued'
      });
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;
    this.syncQueuePositions();

    while (this.queue.length > 0) {
      const current = this.queue[0];
      const { taskId, request } = current;

      taskManager.updateTaskMetadata(taskId, { queueState: 'running', queuePosition: 1 });
      taskManager.updateTaskStatus(taskId, 'running', 1);
      taskManager.addLog(taskId, '[queue] Installation started.');

      try {
        if (current.type === 'create') {
          const createRequest = request as QueueRequest;
          await instanceManager.createInstanceFromVersion(
            createRequest.branchId,
            createRequest.name,
            createRequest.gamePort,
            createRequest.rconPort,
            createRequest.force,
            Boolean(createRequest.allowUnknownBranch),
            taskId
          );
        } else {
          const retryRequest = request as RetryQueueRequest;
          await instanceManager.retryInstanceInstallation(retryRequest.instanceId, taskId);
        }

        const updated = taskManager.getTask(taskId);
        if (updated && updated.status !== 'success') {
          taskManager.setTaskResult(taskId, updated.result || { success: true });
        }
      } catch (error) {
        const message = error instanceof AppError || error instanceof Error
          ? error.message
          : 'Unknown installation error';

        taskManager.updateTaskStatus(taskId, 'failed', undefined, message);
        taskManager.addLog(taskId, `[queue] Installation failed: ${message}`);
      } finally {
        taskManager.updateTaskMetadata(taskId, { queueState: 'completed', queuePosition: undefined });
        this.queue.shift();
        this.syncQueuePositions();
      }
    }

    this.processing = false;
  }

  public enqueue(request: QueueRequest): { task: Task; queueLength: number } {
    const instanceId = sanitizeInstanceName(request.name).toLowerCase();

    const task = taskManager.createTask(`Create Instance '${request.name}'`, {
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
    taskManager.addLog(task.id, `[queue] Installation queued at position ${this.queue.length}.`);
    void this.processQueue();

    return { task, queueLength: this.queue.length };
  }

  public enqueueRetry(instanceId: string): { task: Task; queueLength: number } {
    const task = taskManager.createTask(`Retry Instance '${instanceId}'`, {
      kind: 'instance_install',
      metadata: {
        instanceId,
        queueState: 'queued',
        retry: true
      }
    });

    this.queue.push({ taskId: task.id, type: 'retry', request: { instanceId } });
    this.syncQueuePositions();
    taskManager.addLog(task.id, `[queue] Retry queued at position ${this.queue.length}.`);
    void this.processQueue();

    return { task, queueLength: this.queue.length };
  }
}

export const instanceInstallQueueManager = new InstanceInstallQueueManager();
