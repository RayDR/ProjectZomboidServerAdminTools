"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortConflictError = exports.SystemCommandError = exports.PermissionError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, code, status = 500) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.status = status;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(message) {
        super(message, 'NOT_FOUND', 404);
    }
}
exports.NotFoundError = NotFoundError;
class PermissionError extends AppError {
    constructor(message) {
        super(message, 'PERMISSION_DENIED', 403);
    }
}
exports.PermissionError = PermissionError;
class SystemCommandError extends AppError {
    constructor(message, details) {
        super(message, 'SYSTEM_COMMAND_ERROR', 500);
        this.details = details;
    }
}
exports.SystemCommandError = SystemCommandError;
class PortConflictError extends AppError {
    constructor(conflicts) {
        super('Port Conflict Detected', 'PORT_CONFLICT', 409);
        this.conflicts = conflicts;
    }
}
exports.PortConflictError = PortConflictError;
