"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskManager = void 0;
const crypto = __importStar(require("crypto"));
class TaskManager {
    constructor() {
        this.tasks = new Map();
    }
    createTask(name, options = {}) {
        const task = {
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
    getTask(id) {
        return this.tasks.get(id);
    }
    getAllTasks(query = {}) {
        const activeStatuses = ['pending', 'running'];
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
    updateTaskStatus(id, status, progress, error) {
        const task = this.tasks.get(id);
        if (!task)
            return;
        task.status = status;
        if (progress !== undefined)
            task.progress = progress;
        if (error !== undefined)
            task.error = error;
        task.updatedAt = Date.now();
    }
    addLog(id, log) {
        const task = this.tasks.get(id);
        if (!task)
            return;
        task.logs.push(log);
        // Keep max 1000 lines to prevent memory leak
        if (task.logs.length > 1000) {
            task.logs = task.logs.slice(-1000);
        }
        task.updatedAt = Date.now();
    }
    updateTaskMetadata(id, metadata) {
        const task = this.tasks.get(id);
        if (!task)
            return;
        task.metadata = {
            ...(task.metadata || {}),
            ...metadata
        };
        task.updatedAt = Date.now();
    }
    setTaskResult(id, result) {
        const task = this.tasks.get(id);
        if (!task)
            return;
        task.result = result;
        task.status = 'success';
        task.progress = 100;
        task.updatedAt = Date.now();
    }
}
exports.taskManager = new TaskManager();
