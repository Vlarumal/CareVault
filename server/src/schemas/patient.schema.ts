import { z } from 'zod';
import { Gender } from '../types';

const PatientEntrySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ssn: z.string().min(1, 'SSN is required').optional(),
  occupation: z.string().min(1, 'Occupation is required'),
  gender: z.nativeEnum(Gender),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  entries: z.array(z.any()).optional()
});

export const CreatePatientSchema = PatientEntrySchema;
export const UpdatePatientSchema = PatientEntrySchema.partial();