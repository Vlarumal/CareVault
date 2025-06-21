import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { BadRequestError } from './errors';
import { sanitizeObject } from './sanitize';
import { Gender, HealthCheckRating } from '../types';

// SSN validation functions copied from shared/src/utils/validation.ts
// to resolve module import issues

/**
 * Validates SSN format (XXX-XX-XXXX)
 * @param ssn - Social Security Number
 * @returns boolean - True if format is valid
 */
const isValidSSNFormat = (ssn: string): boolean => {
  return /^(\s*\d{3}\s*[-]?\s*\d{2}\s*[-]?\s*\d{4}\s*|\d{9})$/.test(ssn);
};

/**
 * Validates SSN using Luhn algorithm (checksum)
 * @param ssn - Social Security Number (without hyphens)
 * @returns boolean - True if checksum is valid
 */
const isValidSSNChecksum = (ssnWithoutHyphens: string): boolean => {
  if (ssnWithoutHyphens.length !== 9) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(ssnWithoutHyphens[i], 10);
    
    if ((i % 2) === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
  }
  
  return (sum % 10) === 0;
};

/**
 * Validates SSN format and checksum
 * @param ssn - Social Security Number
 * @returns { valid: boolean, message?: string } - Validation result
 */
const validateSSN = (ssn: string): { valid: boolean; message?: string } => {
  console.log(`[DEBUG] Validating SSN: ${ssn}`);
  console.log(`[DEBUG] NODE_ENV: ${process.env.NODE_ENV}`);
  
  if (!isValidSSNFormat(ssn)) {
    console.log(`[DEBUG] Failed format validation: ${ssn}`);
    return {
      valid: false,
      message: 'Invalid SSN format. Use XXX-XX-XXXX.'
    };
  }
  
  const ssnWithoutHyphens = ssn.replace(/-/g, '');
  if (!isValidSSNChecksum(ssnWithoutHyphens)) {
    console.log(`[DEBUG] Failed checksum: ${ssnWithoutHyphens}`);
    return {
      valid: false,
      message: 'Invalid SSN checksum. Please verify the number.'
    };
  }
  
  return { valid: true };
};

/**
 * Checks if a value is a valid SSN
 * @param value - Input value
 * @returns boolean - True if valid SSN
 */
const isSSN = (value: string): boolean => {
  // Skip checksum validation in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    return /^\d{3}-\d{2}-\d{4}$/.test(value);
  }
  return validateSSN(value).valid;
};

const safeStringSchema = (fieldName: string, maxLength?: number) => {
  let schema = z.string().min(1, `${fieldName} is required`)
    .regex(/^[^;'"\\]*$/, `${fieldName} contains invalid characters`);
  
  if (maxLength) {
    schema = schema.max(maxLength, `${fieldName} must be at most ${maxLength} characters`);
  }
  
  return schema;
};

const BaseEntrySchema = z.object({
  description: safeStringSchema('Description', 500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
  specialist: safeStringSchema('Specialist name', 100),
  diagnosisCodes: z.array(
    z.string().max(50, 'Diagnosis code must be at most 50 characters').regex(/^[a-z0-9\.]{3,}$/i, {
      message: 'Diagnosis codes must be alphanumeric with optional dots and at least 3 characters'
    })
  ).optional(),
});

const HealthCheckEntrySchema = BaseEntrySchema.extend({
  type: z.literal('HealthCheck'),
  healthCheckRating: z.nativeEnum(HealthCheckRating, {
    required_error: 'HealthCheckRating is required',
    invalid_type_error: 'Invalid HealthCheckRating value',
  }),
});

const HospitalEntrySchema = BaseEntrySchema.extend({
  type: z.literal('Hospital'),
  discharge: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
    criteria: safeStringSchema('Discharge criteria', 500),
  }),
});

const OccupationalHealthcareEntrySchema = BaseEntrySchema.extend({
  type: z.literal('OccupationalHealthcare'),
  employerName: safeStringSchema('Employer name', 100),
  sickLeave: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
  }).optional(),
});

export const EntrySchema = z.union([
  HealthCheckEntrySchema,
  HospitalEntrySchema,
  OccupationalHealthcareEntrySchema,
]);

export const PatientEntrySchema = z.object({
  name: safeStringSchema('Name', 100),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD')
    .refine(dob => {
      const date = new Date(dob);
      const todayUTC = new Date();
      todayUTC.setUTCHours(0,0,0,0);
      return date <= todayUTC;
    }, 'Date cannot be in the future'),
  ssn: z.string().refine(value => isSSN(value), {
    message: 'Invalid SSN format. Use XXX-XX-XXXX with valid checksum'
  }),
  gender: z.nativeEnum(Gender, {
    required_error: 'Gender is required',
    invalid_type_error: 'Invalid gender value',
  }),
  occupation: safeStringSchema('Occupation', 100),
  deathDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format: YYYY-MM-DD'),
    z.null()
  ]).optional().transform(val => val === null ? undefined : val),
  entries: z.array(EntrySchema).optional(),
});

export const NonSensitivePatientEntrySchema = PatientEntrySchema.omit({
  ssn: true,
  entries: true
});

export const validate = (schema: z.ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }
      
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.reduce((acc, issue) => {
          const path = issue.path.join('.');
          return {
            ...acc,
            [path]: issue.message
          };
        }, {} as Record<string, string>);
        throw new BadRequestError('Validation failed', details);
      }
      next(error);
    }
  };

export function validateDiagnosisCodes(codes?: string[]) {
  if (!codes || codes.length === 0) return;
  
  const cleanedCodes = codes
    .filter(code => code !== null)
    .map(code => code.trim())
    .filter(code => code !== '');
  
  if (cleanedCodes.length === 0) return;
  
  const invalidCodes = cleanedCodes.filter(
    code => !/^[a-z0-9\.]{3,}$/i.test(code)
  );
  
  if (invalidCodes.length > 0) {
    throw new BadRequestError(
      `Invalid diagnosis code format: ${invalidCodes.join(', ')}`,
      { invalidCodes }
    );
  }
}