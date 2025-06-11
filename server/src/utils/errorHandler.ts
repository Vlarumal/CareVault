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
  
  if ('isAxiosError' in err) {
    // Use a minimal interface to avoid axios dependency
    const axiosError = err as any;
    let errorDetails: any = {
      message: axiosError.message,
      severity: 'high',
      context: {
        request: {
          method: axiosError.config?.method,
          url: axiosError.config?.url,
          headers: axiosError.config?.headers,
          data: axiosError.config?.data
        }
      }
    };
    
    if (axiosError.response) {
      errorDetails.context.response = {
        status: axiosError.response.status,
        headers: axiosError.response.headers,
        data: axiosError.response.data
      };
    }
    
    console.error('Axios error metadata:', errorDetails);
    res.status(500).json({
      error: 'External API request failed',
      details: errorDetails
    });
    return;
  }
  
  console.error('Unexpected error:', err);
  console.error('Error stack:', err.stack);
  const serverError = new InternalServerError();
  res.status(serverError.status).json({ error: serverError.message });
};
