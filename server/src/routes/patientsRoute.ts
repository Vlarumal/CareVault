import express, { NextFunction, Request, Response } from 'express';
import patientsService from '../services/patientsService';
import {
  NewEntryWithoutId,
  NewPatientEntry,
  NonSensitivePatientEntry,
  PatientEntry,
} from '../types';
import { EntrySchema, NewPatientEntrySchema } from '../utils';
import { z } from 'zod';

const patientsRouter = express.Router();

patientsRouter.get(
  '/',
  (_req, res: Response<NonSensitivePatientEntry[]>) => {
    res.send(patientsService.getNonSensitiveEntries());
  }
);

patientsRouter.get(
  '/:id',
  (req, res: Response<PatientEntry | undefined>) => {
    const patient = patientsService.findById(req.params.id);

    if (patient) {
      res.send(patient);
      return;
    }

    res.sendStatus(404);
    return;
  }
);

const newPatientParser = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    NewPatientEntrySchema.parse(req.body);
    next();
  } catch (error: unknown) {
    next(error);
  }
};

const newEntryParser = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    EntrySchema.parse(req.body);
    next();
  } catch (error: unknown) {
    next(error);
  }
};

const errorMiddleWare = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof z.ZodError) {
    res.status(400).send({ error: error.issues });
  } else {
    next(error);
  }
};

patientsRouter.post(
  '/',
  newPatientParser,
  (
    req: Request<unknown, unknown, NewPatientEntry>,
    res: Response<PatientEntry>
  ) => {
    const addedPatientEntry = patientsService.addPatient(req.body);
    res.json(addedPatientEntry);
  }
);

patientsRouter.post(
  '/:id/entries',
  newEntryParser,
  (
    req: Request<{ id: string }, unknown, NewEntryWithoutId>,
    res: Response
  ) => {
    const patientId = req.params.id;
    const patient = patientsService.findById(patientId);
    const newEntryData = req.body;

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const addedEntry = patientsService.addEntry(
      patient,
      newEntryData
    );

    res.status(201).json(addedEntry);
    return;
  }
);

patientsRouter.use(errorMiddleWare);

export default patientsRouter;
