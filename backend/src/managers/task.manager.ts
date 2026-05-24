import * as crypto from 'crypto';

export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  progress: number;
  logs: string[];
  result?: any;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

class TaskManager {
  private tasks: Map<string, Task> = new Map();

  public createTask(name: string): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      name,
      status: 'pending',
      progress: 0,
      logs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  public getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
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
