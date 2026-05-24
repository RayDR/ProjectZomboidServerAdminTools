import * as crypto from 'crypto';

export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';
export type TaskKind = 'generic' | 'instance_install';

export interface TaskQuery {
  kind?: TaskKind;
  activeOnly?: boolean;
  limit?: number;
}

export interface TaskCreationOptions {
  kind?: TaskKind;
  metadata?: Record<string, any>;
}

export interface Task {
  id: string;
  name: string;
  kind: TaskKind;
  status: TaskStatus;
  progress: number;
  logs: string[];
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

class TaskManager {
  private tasks: Map<string, Task> = new Map();

  public createTask(name: string, options: TaskCreationOptions = {}): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      name,
      kind: options.kind || 'generic',
      status: 'pending',
      progress: 0,
      logs: [],
      metadata: options.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  public getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  public getAllTasks(query: TaskQuery = {}): Task[] {
    const activeStatuses: TaskStatus[] = ['pending', 'running'];

    let tasks = Array.from(this.tasks.values());
    if (query.kind) {
      tasks = tasks.filter((task) => task.kind === query.kind);
    }
    if (query.activeOnly) {
      tasks = tasks.filter((task) => activeStatuses.includes(task.status));
    }

    tasks = tasks.sort((a, b) => b.createdAt - a.createdAt);
    if (query.limit && query.limit > 0) {
      tasks = tasks.slice(0, query.limit);
    }
    return tasks;
  }

  public updateTaskStatus(id: string, status: TaskStatus, progress?: number, error?: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    
    task.status = status;
    if (progress !== undefined) task.progress = progress;
    if (error !== undefined) task.error = error;
    task.updatedAt = Date.now();
  }

  public addLog(id: string, log: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    
    task.logs.push(log);
    // Keep max 1000 lines to prevent memory leak
    if (task.logs.length > 1000) {
      task.logs = task.logs.slice(-1000);
    }
    task.updatedAt = Date.now();
  }

  public updateTaskMetadata(id: string, metadata: Record<string, any>): void {
    const task = this.tasks.get(id);
    if (!task) return;

    task.metadata = {
      ...(task.metadata || {}),
      ...metadata
    };
    task.updatedAt = Date.now();
  }

  public setTaskResult(id: string, result: any): void {
    const task = this.tasks.get(id);
    if (!task) return;
    
    task.result = result;
    task.status = 'success';
    task.progress = 100;
    task.updatedAt = Date.now();
  }
}

export const taskManager = new TaskManager();
