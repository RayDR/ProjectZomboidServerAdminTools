export class AppError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string, status: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

export class PermissionError extends AppError {
  constructor(message: string) {
    super(message, 'PERMISSION_DENIED', 403);
  }
}

export class SystemCommandError extends AppError {
  constructor(message: string, public readonly details?: any) {
    super(message, 'SYSTEM_COMMAND_ERROR', 500);
  }
}

export class PortConflictError extends AppError {
  public conflicts: string[];
  constructor(conflicts: string[]) {
    super('Port Conflict Detected', 'PORT_CONFLICT', 409);
    this.conflicts = conflicts;
  }
}
