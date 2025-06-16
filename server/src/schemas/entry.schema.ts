import { z } from 'zod';
import { HealthCheckRating } from '../types';

// Pure validation schema
const BaseEntrySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().datetime(),
    z.date()
  ]).transform(val => {
    if (val instanceof Date) return val.toISOString().split('T')[0];
    if (val.includes('T')) return val.split('T')[0];
    return val;
  }),
  specialist: z.string().min(1, 'Specialist name is required'),
  diagnosisCodes: z.array(
    z.union([
      z.string().trim().min(1).regex(/^[a-z0-9\.]{3,}$/i, {
        message: 'Diagnosis codes must be alphanumeric with optional dots and at least 3 characters'
      }),
      z.null()
    ]).transform(val => val === null ? undefined : val)
  ).optional().default([]), // Default to empty array
  lastUpdated: z.string().optional(),
  changeReason: z.string().optional(),
}).catchall(z.never());

const HealthCheckEntrySchema = BaseEntrySchema.extend({
  type: z.literal('HealthCheck'),
  healthCheckRating: z.nativeEnum(HealthCheckRating, {
    errorMap: () => ({ message: 'HealthCheckRating is required for HealthCheck entries' })
  }).default(0),
});

const HospitalEntrySchema = BaseEntrySchema.extend({
  type: z.literal('Hospital'),
  discharge: z.object({
    date: z.union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.string().datetime(),
      z.date()
    ]).transform(val => {
      if (val instanceof Date) return val.toISOString().split('T')[0];
      if (val.includes('T')) return val.split('T')[0];
      return val;
    }),
    criteria: z.string().min(1, 'Discharge criteria is required'),
  }, {
    required_error: 'Discharge information is required for Hospital entries'
  }),
});

const OccupationalHealthcareEntrySchema = BaseEntrySchema.extend({
  type: z.literal('OccupationalHealthcare'),
  employerName: z.string().min(1, 'Employer name is required'),
  sickLeave: z
    .object({
      startDate: z.union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        z.string().datetime(),
        z.date()
      ]).transform(val => {
        if (val instanceof Date) return val.toISOString().split('T')[0];
        if (val.includes('T')) return val.split('T')[0];
        return val;
      }),
      endDate: z.union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        z.string().datetime(),
        z.date()
      ]).transform(val => {
        if (val instanceof Date) return val.toISOString().split('T')[0];
        if (val.includes('T')) return val.split('T')[0];
        return val;
      }),
    })
    .optional(),
});

export const EntrySchema = z.union([
  HealthCheckEntrySchema,
  HospitalEntrySchema,
  OccupationalHealthcareEntrySchema,
], {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_union) {
      return { message: "Invalid entry type or missing required fields. Please check the entry structure." };
    }
    return { message: ctx.defaultError };
  }
});
