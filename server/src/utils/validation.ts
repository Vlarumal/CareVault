import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { BadRequestError } from './errors';
import { sanitizeObject } from './sanitize';
import { Gender, HealthCheckRating } from '../types';

// Reusable schema for safe strings (prevents SQL injection)
const safeStringSchema = (fieldName: string) =>
  z.string().min(1, `${fieldName} is required`)
    .regex(/^[^;'"\\]*$/, `${fieldName} contains invalid characters`);

// Base schema for all entries
const BaseEntrySchema = z.object({
  description: safeStringSchema('Description'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
  specialist: safeStringSchema('Specialist name'),
  diagnosisCodes: z.array(z.string()).optional(),
});

// HealthCheck entry schema
const HealthCheckEntrySchema = BaseEntrySchema.extend({
  type: z.literal('HealthCheck'),
  healthCheckRating: z.nativeEnum(HealthCheckRating, {
    required_error: 'HealthCheckRating is required',
    invalid_type_error: 'Invalid HealthCheckRating value',
  }),
});

// Hospital entry schema
const HospitalEntrySchema = BaseEntrySchema.extend({
  type: z.literal('Hospital'),
  discharge: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
    criteria: safeStringSchema('Discharge criteria'),
  }),
});

// OccupationalHealthcare entry schema
const OccupationalHealthcareEntrySchema = BaseEntrySchema.extend({
  type: z.literal('OccupationalHealthcare'),
  employerName: safeStringSchema('Employer name'),
  sickLeave: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
  }).optional(),
});

// Union schema for all entry types
export const EntrySchema = z.union([
  HealthCheckEntrySchema,
  HospitalEntrySchema,
  OccupationalHealthcareEntrySchema,
]);

// Patient schemas
export const PatientEntrySchema = z.object({
  name: safeStringSchema('Name'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
  ssn: safeStringSchema('SSN'),
  gender: z.nativeEnum(Gender, {
    required_error: 'Gender is required',
    invalid_type_error: 'Invalid gender value',
  }),
  occupation: safeStringSchema('Occupation'),
  entries: z.array(EntrySchema).optional(),
});

export const NonSensitivePatientEntrySchema = PatientEntrySchema.omit({
  ssn: true,
  entries: true
});

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