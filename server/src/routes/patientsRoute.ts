import express, { Request, Response } from 'express';
import patientsService from '../services/patientsService';
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
    res.send(patientsService.getNonSensitiveEntries());
  }
);

patientsRouter.get(
  '/:id',
  (req, res: Response<PatientEntry>) => {
    const patient = patientsService.findById(req.params.id);
    res.send(patient);
  }
);

patientsRouter.post(
  '/',
  (
    req: Request<unknown, unknown, NewPatientEntryWithoutEntries>,
    res: Response<PatientEntry>
  ) => {
    const addedPatientEntry = patientsService.addPatient(req.body);
    res.json(addedPatientEntry);
  }
);

patientsRouter.post(
  '/:id/entries',
  (
    req: Request<{ id: string }, unknown, NewEntryWithoutId>,
    res: Response
  ) => {
    const patient = patientsService.findById(req.params.id);
    const addedEntry = patientsService.addEntry(patient, req.body);
    res.status(201).json(addedEntry);
  }
);

export default patientsRouter;
