import diagnosesService from './diagnosesService';
import diagnoses from '../../data/diagnoses';
import { DiagnosisEntry } from '../types';

describe('diagnosesService', () => {
  describe('getEntries', () => {
    it('returns all diagnoses entries', () => {
      const result = diagnosesService.getEntries();
      expect(result).toEqual(diagnoses);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('findByCode', () => {
    it('returns correct diagnosis for valid code', () => {
      const testCode = 'J03.0';
      const expectedDiagnosis: DiagnosisEntry = {
        code: 'J03.0',
        name: 'Streptococcal tonsillitis',
        latin: 'Tonsillitis (palatina) streptococcica',
        uniqueCode: true,
      };

      const result = diagnosesService.findByCode(testCode);
      expect(result).toEqual(expectedDiagnosis);
    });

    it('returns undefined for non-existent code', () => {
      const result = diagnosesService.findByCode('INVALID_CODE');
      expect(result).toBeUndefined();
    });

    it('handles codes with special characters', () => {
      const testCode = 'H35.29';
      const result = diagnosesService.findByCode(testCode);
      expect(result).toBeDefined();
      expect(result?.code).toBe(testCode);
    });
  });

  describe('addDiagnose', () => {
    it('currently returns null as unimplemented', () => {
      const result = diagnosesService.addDiagnose();
      expect(result).toBeNull();
    });
  });
});
