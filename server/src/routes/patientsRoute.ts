import express, { Request, Response } from 'express';
import { patientService } from '../services/patientsService';
import {
  NewEntryWithoutId,
  NewPatientEntryWithoutEntries,
  NonSensitivePatientEntry,
  PatientEntry,
  PaginatedResponse
} from '../types';

interface PaginationQuery {
  page?: string;
  pageSize?: string;
}

const patientsRouter = express.Router();

/**
 * GET all patients (non-sensitive data)
 * Supports pagination with page and pageSize query parameters
 * If no pagination parameters are provided, returns all entries
 */
patientsRouter.get(
  '/',
  async (req: Request<{}, {}, {}, PaginationQuery>, res: Response) => {
    try {
      const page = parseInt(req.query.page ?? '1', 10);
      const pageSize = parseInt(req.query.pageSize ?? '10', 10);

      // Validate page and pageSize if provided
      if (!isNaN(page) && !isNaN(pageSize) && page > 0 && pageSize > 0) {
        const result: PaginatedResponse<NonSensitivePatientEntry[]> = patientService.getPaginatedNonSensitiveEntries(page, pageSize);
        res.json(result);
      } else {
        // Return all entries without pagination
        const entries = patientService.getAllNonSensitiveEntries();
        res.json(entries);
      }
      return;
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  }
);

/**
 * GET a single patient by ID
 */
patientsRouter.get(
  '/:id',
  (req, res: Response<PatientEntry>) => {
    const patient = patientService.findById(req.params.id);
    res.send(patient);
  }
);

import { validate } from '../utils/validation';
import { CreatePatientSchema } from '../schemas/patient.schema';
import { EntrySchema } from '../schemas/entry.schema';

/**
 * POST a new patient
 */
patientsRouter.post(
  '/',
  validate(CreatePatientSchema),
  (
    req: Request<unknown, unknown, NewPatientEntryWithoutEntries>,
    res: Response<PatientEntry>
  ) => {
    const addedPatientEntry = patientService.addPatient(req.body);
    res.json(addedPatientEntry);
  }
);

/**
 * POST a new entry to a patient
 */
patientsRouter.post(
  '/:id/entries',
  validate(EntrySchema),
  (
    req: Request<{ id: string }, unknown, NewEntryWithoutId>,
    res: Response
  ) => {
    const patient = patientService.findById(req.params.id);
    const addedEntry = patientService.addEntry(patient, req.body);
    res.status(201).json(addedEntry);
  }
);

export default patientsRouter;

