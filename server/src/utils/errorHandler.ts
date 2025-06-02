import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import {
  ValidationError,
  NotFoundError,
  InternalServerError
} from './errors';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle custom error types
  if (err instanceof ValidationError) {
    res.status(err.status).json({
      error: err.message,
      details: err.details
    });
    return;
  }
  
  if (err instanceof NotFoundError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  
  // Handle unexpected errors
  console.error(err.stack);
  const serverError = new InternalServerError();
  res.status(serverError.status).json({ error: serverError.message });
};
