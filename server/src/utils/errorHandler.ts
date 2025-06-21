import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import {
  OperationalError,
  ProgrammerError
} from './errors';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Always log full error details for debugging
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  console.error(`Request: ${_req.method} ${_req.originalUrl}`);
  console.error('Headers:', JSON.stringify(_req.headers, null, 2));
  if (_req.body && Object.keys(_req.body).length > 0) {
    console.error('Body:', JSON.stringify(_req.body, null, 2));
  }
  console.error('Stack:', err.stack);

  if (err instanceof OperationalError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details && { details: err.details })
    });
    return;
  }

  if (err instanceof ProgrammerError) {
    if (isDevelopment) {
      res.status(err.status).json({
        error: err.message,
        type: 'ProgrammerError'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  if ('isAxiosError' in err) {
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
    
    if (isDevelopment) {
      res.status(500).json({
        error: 'External API request failed',
        details: errorDetails
      });
    } else {
      res.status(500).json({ error: 'External API request failed' });
    }
    return;
  }

  // Handle all other errors
  if (isDevelopment) {
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
};
