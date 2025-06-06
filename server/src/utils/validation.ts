import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { BadRequestError } from './errors';
import { sanitizeObject } from './sanitize';

export const validate = (schema: z.ZodSchema) => 
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Sanitize input before validation
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }
      
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError('Validation failed', error.issues);
      }
      next(error);
    }
  };