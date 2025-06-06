import express, { Request, Response } from 'express';
import { patientService } from '../services/patientsService';
import {
  NewEntryWithoutId,
  NewPatientEntryWithoutEntries,
  NonSensitivePatientEntry,
  PatientEntry,
} from '../types';

const patientsRouter = express.Router();

patientsRouter.get(
  '/',
  (_req, res: Response<NonSensitivePatientEntry[]>) => {
    res.send(patientService.getNonSensitiveEntries());
  }
);

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
