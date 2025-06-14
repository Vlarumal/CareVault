import { Gender, Patient } from '../types';

// Mock patient data for testing
export const mockPatients: Patient[] = Array.from({ length: 100 }, (_, index) => ({
  id: `id-${index}`,
  name: `Patient ${index}`,
  dateOfBirth: '2000-01-01',
  gender: index % 2 === 0 ? Gender.Male : Gender.Female,
  occupation: 'Occupation',
  entries: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));