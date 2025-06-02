import { z } from 'zod';
import { NewPatientEntry, Gender, HealthCheckRating } from './types';

const DiagnosisCodesSchema = z.string();

export const BaseEntrySchema = z.object({
  description: z.string(),
  date: z.string().date(),
  specialist: z.string(),
  diagnosisCodes: z.array(DiagnosisCodesSchema).optional(),
});

const HealthCheckRatingSchema = z.nativeEnum(HealthCheckRating);
const HealthCheckEntrySchema = BaseEntrySchema.extend({
  type: z.literal('HealthCheck'),
  healthCheckRating: HealthCheckRatingSchema,
});

const DischargeSchema = z.object({
  date: z.string().date(),
  criteria: z.string(),
});

const SickLeaveSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

const OccupationalHealthcareEntrySchema = BaseEntrySchema.extend({
  type: z.literal('OccupationalHealthcare'),
  employerName: z.string(),
  sickLeave: SickLeaveSchema.optional(),
});

const HospitalEntrySchema = BaseEntrySchema.extend({
  type: z.literal('Hospital'),
  discharge: DischargeSchema,
});

export const EntrySchema = z.union([
  HospitalEntrySchema,
  OccupationalHealthcareEntrySchema,
  HealthCheckEntrySchema,
]);

export const NewPatientEntrySchema = z.object({
  name: z.string(),
  ssn: z.string().optional(),
  occupation: z.string(),
  dateOfBirth: z.string().date(),
  gender: z.nativeEnum(Gender),
  entries: z.array(EntrySchema).optional(),
});

const toNewPatientEntry = (object: unknown): NewPatientEntry => {
  return NewPatientEntrySchema.parse(object);
};

export default toNewPatientEntry;
