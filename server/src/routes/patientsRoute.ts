import express, { Request, Response } from 'express';
import { EntryVersion } from '../../../shared/src/types/medicalTypes';
import { authenticate } from '../middleware/authentication';
import { patientService } from '../services/patientsService';
import {
  NewEntryWithoutId,
  NewPatientEntryWithoutEntries,
  PatientEntry,
  Entry,
} from '../types';
import { validate } from '../utils/validation';
import { CreatePatientSchema } from '../schemas/patient.schema';
import { EntrySchema } from '../schemas/entry.schema';
import {
  ConcurrencyError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import qs from 'qs';
import { EntryVersionService } from '../services/entryVersionService';

interface PaginationQuery {
  page?: string;
  pageSize?: string;
  filterModel?: string;
  sortModel?: string;
  searchText?: string;
}

const patientsRouter = express.Router();

/**
 * GET all patients (non-sensitive data)
 * Supports pagination with page and pageSize query parameters
 * If no pagination parameters are provided, returns all entries
 */
patientsRouter.get(
  '/',
  async (
    req: Request<
      {},
      {},
      {},
      PaginationQuery & { withEntries?: string }
    >,
    res: Response
  ) => {
    try {
      const page = parseInt(req.query.page ?? '1', 10);
      const pageSize = parseInt(req.query.pageSize ?? '10', 10);
      const withEntries = req.query.withEntries === 'true';
      let searchText = req.query.searchText as string | undefined;

      if (searchText) {
        searchText = searchText.trim().replace(/[^\w\s-]/g, '');

        if (searchText.length > 100) {
          searchText = searchText.substring(0, 100);
        }
      }

      const filterModel = req.query.filterModel
        ? qs.parse(req.query.filterModel as string)
        : null;
      const sortModel = req.query.sortModel
        ? qs.parse(req.query.sortModel as string)
        : null;

      const filters: Record<string, any> = {};
      if (filterModel) {
        if (filterModel.gender) filters.gender = filterModel.gender;
        if (filterModel.occupation)
          filters.occupation = filterModel.occupation;
      }

      if (sortModel) {
        if (sortModel.field === 'dateOfBirth')
          sortModel.field = 'date_of_birth';
        if (sortModel.field === 'healthRating')
          sortModel.field = 'health_rating';
      }

      const sortConfig = sortModel
        ? {
            field: sortModel.field as string,
            direction: sortModel.sort as string,
          }
        : null;

      if (
        !isNaN(page) &&
        !isNaN(pageSize) &&
        page > 0 &&
        pageSize > 0
      ) {
        const result = withEntries
          ? await patientService.getFilteredAndPaginatedPatients(
              page,
              pageSize,
              filters || {},
              sortConfig,
              searchText || undefined
            )
          : await patientService.getPaginatedPatientsWithEntries(
              page,
              pageSize
            );

        res.json(result);
      } else {
        const entries = withEntries
          ? await patientService.getAllPatientsWithEntries()
          : await patientService.getAllNonSensitiveEntries();
        res.json(entries);
      }
      return;
    } catch (error) {
      console.error('Error in GET /patients:', error);
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
  async (
    req,
    res: Response<PatientEntry | { error: string; details?: any }>
  ) => {
    try {
      const patient = await patientService.getPatientById(
        req.params.id
      );
      res.json(patient);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        res
          .status(400)
          .json({ error: error.message, details: error.details });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * POST a new patient
 */
patientsRouter.post(
  '/',
  validate(CreatePatientSchema),
  async (
    req: Request<unknown, unknown, NewPatientEntryWithoutEntries>,
    res: Response<PatientEntry | { error: string; details?: any }>
  ) => {
    try {
      const addedPatientEntry = await patientService.createPatient(
        req.body
      );
      res.status(201).json(addedPatientEntry);
    } catch (error) {
      if (error instanceof ValidationError) {
        res
          .status(400)
          .json({ error: error.message, details: error.details });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * POST a new entry to a patient
 */
patientsRouter.post(
  '/:id/entries',
  validate(EntrySchema),
  async (
    req: Request<{ id: string }, unknown, NewEntryWithoutId>,
    res: Response
  ) => {
    const patient = await patientService.getPatientById(
      req.params.id
    );
    const addedEntry = await patientService.addEntry(
      patient,
      req.body
    );
    
    await EntryVersionService.createVersion(
      addedEntry.id,
      req.user?.id || 'system',
      'Initial entry creation',
      addedEntry,
      'CREATE'
    );

    res.status(201).json(addedEntry);
  }
);

/**
 * GET entries for a specific patient
 */
patientsRouter.get(
  '/:id/entries',
  async (req, res: Response<Entry[]>) => {
    try {
      const entries = await patientService.getEntriesByPatientId(
        req.params.id
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' } as any);
    }
  }
);

patientsRouter.delete('/:id', async (req, res) => {
  try {
    await patientService.deletePatient(req.params.id);
    res.status(204).end();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof DatabaseError) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(500).json({ error: 'Unexpected error occurred' });
    }
  }
});

patientsRouter.put(
  '/:id',
  async (
    req,
    res: Response<PatientEntry | { error: string; details?: any }>
  ) => {
    try {
      const updatedPatient = await patientService.editPatient(
        req.params.id,
        req.body
      );
      res.json(updatedPatient);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        res
          .status(400)
          .json({ error: error.message, details: error.details });
      } else if (error instanceof ConcurrencyError) {
        res.status(error.status).json({
          error: error.message,
          details: error.details,
          code: 'CONCURRENCY_CONFLICT',
        } as any);
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

patientsRouter.put(
  '/:patientId/entries/:entryId',
  authenticate,
  validate(EntrySchema),
  async (
    req: Request<
      { patientId: string; entryId: string },
      unknown,
      NewEntryWithoutId
    >,
    res: Response
  ) => {
    try {
      const { patientId, entryId } = req.params;
      const { changeReason, lastUpdated, ...updateData } = req.body;
      const editorId = req.user?.id;

      const updatePayload = {
        ...updateData,
        changeReason,
        lastUpdated
      };

      if (!editorId) {
        throw new Error('Authenticated user ID missing');
      }

      if (lastUpdated) {
        const isConflict = await EntryVersionService.checkConcurrency(
          entryId,
          lastUpdated
        );

        if (isConflict) {
          throw new ConcurrencyError(
            'Entry has been updated by another user. Please refresh and try again.',
            {
              currentVersion:
                await EntryVersionService.getLatestVersion(entryId),
              code: 'CONCURRENCY_CONFLICT',
            }
          );
        }
      }

      const currentEntry: Entry = await patientService.getEntryById(entryId);

      await EntryVersionService.createVersion(
        entryId,
        editorId,
        changeReason || 'Entry updated',
        currentEntry,
        'UPDATE'
      );

      const updatedEntry = await patientService.updateEntry(
        patientId,
        entryId,
        updatePayload,
        req.user?.id || 'system'
      );

      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        res
          .status(400)
          .json({ error: error.message, details: error.details });
      } else if (error instanceof ConcurrencyError) {
        res.status(error.status).json({
          error: error.message,
          details: error.details,
          code: 'CONCURRENCY_CONFLICT',
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

patientsRouter.get(
  '/:patientId/entries/:entryId/versions/latest',
  async (
    req: Request<{ patientId: string; entryId: string }>,
    res: Response
  ) => {
    try {
      const { entryId } = req.params;
      const latestVersion =
        await EntryVersionService.getLatestVersion(entryId);
      res.json(latestVersion);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'No versions found for entry') {
          res
            .status(404)
            .json({ error: 'No versions exist for this entry' });
        } else if (error instanceof NotFoundError) {
          res.status(404).json({ error: error.message });
        } else {
          console.error('Error getting latest version:', error);
          res.status(500).json({
            error: 'Failed to get latest version',
            details:
              process.env.NODE_ENV === 'development' ||
              process.env.NODE_ENV === 'test'
                ? error.message
                : undefined,
          });
        }
      } else {
        console.error('Unknown error type:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

patientsRouter.get(
  '/:patientId/entries/:entryId/versions',
  async (
    req: Request<{ patientId: string; entryId: string }>,
    res: Response<EntryVersion[] | { error: string; code: string }>
  ): Promise<void> => {
    try {
      const { entryId } = req.params;
      const versions = await EntryVersionService.getVersionsByEntryId(entryId);
      
      if (versions.length === 0) {
        res.status(404).json({
          error: 'No versions found for this entry',
          code: 'NO_VERSIONS'
        });
        return;
      }

      res.json(versions);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          error: error.message,
          code: 'NOT_FOUND'
        });
      } else {
        console.error('Error fetching entry versions:', error);
        res.status(500).json({
          error: 'Failed to fetch entry versions',
          code: 'SERVER_ERROR'
        });
      }
    }
  }
);

patientsRouter.post(
  '/:patientId/entries/:entryId/system/versions',
  authenticate,
  async (
    req: Request<
      { patientId: string; entryId: string },
      unknown,
      Entry
    >,
    res: Response
  ) => {
    try {
      const { entryId } = req.params;
      const editorId = req.user?.id || 'system';

      const version = await EntryVersionService.createVersion(
        entryId,
        editorId,
        'System-generated version',
        req.body
      );

      res.status(201).json(version);
    } catch (error) {
      if (error instanceof DatabaseError) {
        res
          .status(500)
          .json({ error: 'Failed to create system version' });
      } else {
        res.status(400).json({ error: 'Invalid request' });
      }
    }
  }
);

patientsRouter.get(
  '/:patientId/entries/:entryId/versions/diff',
  authenticate,
  async (
    req: Request<
      { patientId: string; entryId: string },
      {},
      {},
      { version1: string; version2: string }
    >,
    res: Response
  ) => {
    try {
      const { entryId } = req.params;
      const { version1, version2 } = req.query;

      if (!version1 || !version2) {
        throw new ValidationError(
          'Both version1 and version2 query parameters are required',
          { version1, version2 }
        );
      }

      const diff = await EntryVersionService.getVersionDiff(
        entryId,
        version1,
        version2
      );
      res.json(diff);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

patientsRouter.put(
  '/:patientId/entries/:entryId/versions/:versionId/restore',
  authenticate,
  async (
    req: Request<{
      patientId: string;
      entryId: string;
      versionId: string;
    }>,
    res: Response
  ) => {
    try {
      const { entryId, versionId } = req.params;

      if (!req.user?.id) {
        throw new Error('Authenticated user ID missing');
      }

      const restoredEntry = await EntryVersionService.restoreVersion(
        entryId,
        versionId,
        req.user.id,
        `Restored version ${versionId.substring(0, 8)}`
      );

      res.json(restoredEntry);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

patientsRouter.delete(
  '/:patientId/entries/:entryId',
  async (req, res) => {
    try {
      await patientService.deleteEntry(
        req.params.patientId,
        req.params.entryId
      );
      res.status(204).end();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

export default patientsRouter;
