import { HealthCheckEntry, Patient } from '../types';

export const mapToGridData = (patients: Patient[]) =>
  patients.map(p => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    occupation: p.occupation,
    latestRating: getLatestHealthRating(p),
    dob: p.dateOfBirth || 'N/A',
    ssn: p.ssn ? `******-${p.ssn.slice(-4)}` : 'N/A'
  }));

// Helper function to extract from PatientListPage
export const getLatestHealthRating = (patient: Patient): number | null => {
  if (!patient.entries) return null;

  const healthCheckEntries = patient.entries.filter(
    (entry): entry is HealthCheckEntry =>
      entry.type === 'HealthCheck'
  );

  if (healthCheckEntries.length === 0) return null;

  const sortedEntries = [...healthCheckEntries].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return sortedEntries[0].healthCheckRating;
};