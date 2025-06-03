import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PatientListPage from './index';
import { Patient, Gender, HealthCheckRating, HealthCheckEntry } from '../../../src/types';
import { describe, expect, it } from 'vitest';

describe('PatientListPage Component', () => {
  const patients: Patient[] = [
    {
      id: '1',
      name: 'John Doe',
      dateOfBirth: '1985-01-15',
      gender: Gender.Male,
      occupation: 'Engineer',
      ssn: '123-45-6789',
      entries: [],
    },
    {
      id: '2',
      name: 'Jane Smith',
      dateOfBirth: '1990-02-20',
      gender: Gender.Female,
      occupation: 'Designer',
      ssn: '987-65-4321',
      entries: [],
    },
    {
      id: '3',
      name: 'Alice Johnson',
      dateOfBirth: '1975-03-25',
      gender: Gender.Other,
      occupation: 'Teacher',
      ssn: '456-78-9012',
      entries: [],
    },
  ];

  it('sorts patients by date of birth in descending order (oldest first)', () => {
    render(
      <MemoryRouter>
        <PatientListPage patients={patients} setPatients={() => {}} />
      </MemoryRouter>
    );
    
    const patientNames = screen.getAllByTestId('patient-name').map(element => element.textContent);
    expect(patientNames).toEqual(['Alice Johnson', 'John Doe', 'Jane Smith']);
  });

  it('renders correct health ratings for patients', () => {
    const patientsWithEntries = patients.map(patient => ({
      ...patient,
      entries: [{
        id: 'entry1',
        description: 'Regular checkup',
        date: '2023-01-01',
        specialist: 'Dr. Smith',
        diagnosisCodes: [],
        type: 'HealthCheck',
        healthCheckRating: HealthCheckRating.Healthy, // Rating 0 (green)
      } as HealthCheckEntry]
    }));
    
    render(
      <MemoryRouter>
        <PatientListPage patients={patientsWithEntries} setPatients={() => {}} />
      </MemoryRouter>
    );
    
    // Verify heart colors match ratings
    const healthBars = screen.getAllByTestId('health-rating-bar');
    expect(healthBars).toHaveLength(3);
    
    healthBars.forEach(bar => {
      const hearts = bar.querySelectorAll('[data-testid="FavoriteIcon"]');
      expect(hearts).toHaveLength(4);
      hearts.forEach(heart => {
        expect(heart).toHaveStyle({ color: '#4caf50' }); // Green for rating 0
      });
    });
  });
});
