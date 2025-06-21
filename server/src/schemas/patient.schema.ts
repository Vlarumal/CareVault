import { z } from 'zod';
import { Gender } from '../types';
import { isSSN } from '../../../shared/src/utils/validation';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD');

const PatientBaseSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  ssn: z.string()
    .min(1, 'SSN is required')
    .refine(value => isSSN(value), {
      message: 'Invalid SSN format. Use XXX-XX-XXXX with valid checksum'
    }),
  occupation: z.string()
    .min(1, 'Occupation is required')
    .max(100, 'Occupation must be at most 100 characters'),
  gender: z.nativeEnum(Gender),
  dateOfBirth: dateStringSchema,
  deathDate: dateStringSchema
     .nullable()
     .optional(),
  entries: z.array(z.any()).optional()
});

export const CreatePatientSchema = PatientBaseSchema.refine(data => {
  if (data.deathDate && typeof data.deathDate === 'string' && data.deathDate.trim() !== '') {
    const birthDate = new Date(data.dateOfBirth);
    const deathDate = new Date(data.deathDate);
    return deathDate > birthDate;
  }
  return true;
}, {
  message: 'Death date must be after birth date',
  path: ['deathDate']
}).refine(data => {
  if (data.deathDate && typeof data.deathDate === 'string' && data.deathDate.trim() !== '') {
    const deathDate = new Date(data.deathDate);
    return deathDate <= new Date();
  }
  return true;
}, {
  message: 'Death date cannot be in the future',
  path: ['deathDate']
});

export const UpdatePatientSchema = PatientBaseSchema.partial();