interface ErrorDetails {
  [key: string]: string | number | boolean | object | undefined;
  status?: number;
}

export class ValidationError extends Error {
  status: number;
  details: ErrorDetails;

  constructor(message: string, details: ErrorDetails = {}) {
    super(message);
    this.name = 'ValidationError';
    this.status = details.status || 400;
    this.details = details;
  }
}

export class BadRequestError extends ValidationError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, details);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends Error {
  status: number;

  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

export class InternalServerError extends Error {
  status: number;

  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
    this.status = 500;
  }
}

export class ConcurrencyError extends Error {
  status: number;
  details: object;

  constructor(message: string, details: object = {}) {
    super(message);
    this.name = 'ConcurrencyError';
    this.status = 409;
    this.details = details;
  }
}

export class DatabaseError extends Error {
  status: number;
  originalError: any;

  constructor(message: string, originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.status = 500;
    this.originalError = originalError;
  }
}

export class ConflictError extends Error {
  status: number;
  details: object;

  constructor(message: string, details: object = {}) {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  status: number;

  constructor(public code: string, message?: string) {
    super(message || 'Unauthorized');
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

export class ForbiddenError extends Error {
  status: number;

  constructor(public code: string, message?: string) {
    super(message || 'Forbidden');
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}
