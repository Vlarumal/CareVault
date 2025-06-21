// Base class for operational errors (safe to show to user)
export class OperationalError extends Error {
  status: number;
  details: any;
  isOperational: boolean;

  constructor(message: string, status: number = 500, details: any = {}) {
    super(message);
    this.name = 'OperationalError';
    this.status = status;
    this.details = details;
    this.isOperational = true;
  }
}

// Base class for programmer errors (show generic messages only)
export class ProgrammerError extends Error {
  status: number;
  isOperational: boolean;

  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ProgrammerError';
    this.status = status;
    this.isOperational = false;
  }
}

interface ErrorDetails {
  [key: string]: string | number | boolean | object | undefined;
  status?: number;
}

export class ValidationError extends OperationalError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, details.status || 400, details);
    this.name = 'ValidationError';
  }
}

export class BadRequestError extends ValidationError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, details);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends OperationalError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class InternalServerError extends ProgrammerError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
    this.name = 'InternalServerError';
  }
}

export class ConcurrencyError extends OperationalError {
  constructor(message: string, details: object = {}) {
    super(message, 409, details);
    this.name = 'ConcurrencyError';
  }
}

export class DatabaseError extends ProgrammerError {
  originalError: any;

  constructor(message: string, originalError?: any) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

export class ConflictError extends OperationalError {
  constructor(message: string, details: object = {}) {
    super(message, 409, details);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends OperationalError {
  constructor(public code: string, message?: string) {
    super(message || 'Unauthorized', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends OperationalError {
  constructor(public code: string, message?: string) {
    super(message || 'Forbidden', 403);
    this.name = 'ForbiddenError';
  }
}
