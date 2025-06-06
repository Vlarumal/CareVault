export class ValidationError extends Error {
  status: number;
  details: object;

  constructor(message: string, details: object) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.details = details;
  }
}

export class BadRequestError extends ValidationError {
  constructor(message: string, details: object) {
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
