import express, { Response } from 'express';
import diagnosesService from '../services/diagnosesService';
import { DiagnosisEntry } from '../types';

const diagnosesRouter = express.Router();

diagnosesRouter.get('/', (_req, res: Response<DiagnosisEntry[]>) => {
  res.send(diagnosesService.getEntries());
});

diagnosesRouter.get(
  `/:code`,
  (req, res: Response<DiagnosisEntry | string>) => {
    const diagnosis = diagnosesService.findByCode(req.params.code);

    if (!diagnosis) {
      res.status(404).json('Unknown diagnosis');
      return;
    }

    res.json(diagnosis);
    return;
  }
);

export default diagnosesRouter;
