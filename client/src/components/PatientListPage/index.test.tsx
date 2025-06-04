import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PatientListPage from './index';
import { Patient, Gender, HealthCheckRating, HealthCheckEntry } from '../../../src/types';
import { describe, expect, it, vi } from 'vitest';
import patientService from '../../services/patients';

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

  it('opens add patient modal when button clicked', async () => {
    render(
      <MemoryRouter>
        <PatientListPage patients={patients} setPatients={() => {}} />
      </MemoryRouter>
    );
    
    const addButton = screen.getByText('Add New Patient');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Add a new patient')).toBeInTheDocument();
    });
  });

  it('displays error message when patient creation fails', async () => {
    const errorMessage = 'Database connection failed';
    vi.spyOn(patientService, 'create').mockRejectedValue(new Error(errorMessage));
    
    render(
      <MemoryRouter>
        <PatientListPage patients={patients} setPatients={() => {}} />
      </MemoryRouter>
    );
    
    // Open modal
    fireEvent.click(screen.getByText('Add New Patient'));
    
    // Get modal element
    const modal = screen.getByRole('dialog');
    
    // Fill form
    fireEvent.change(within(modal).getByLabelText('Name'), { target: { value: 'Test Patient' } });
    // Use valid SSN format to pass validation
    fireEvent.change(within(modal).getByLabelText('Social security number'), { target: { value: '123456-7890' } });
    fireEvent.change(within(modal).getByLabelText('Date of birth'), { target: { value: '1990-01-01' } });
    fireEvent.change(within(modal).getByLabelText('Occupation'), { target: { value: 'Engineer' } });
    
    // Gender selection - robust method using role queries
    fireEvent.mouseDown(within(modal).getByLabelText('Gender'));
    const listbox = screen.getByRole('listbox');
    const otherOption = within(listbox).getByText(Gender.Other);
    fireEvent.click(otherOption);
    
    // Submit form
    fireEvent.click(within(modal).getByText('Add'));
    
    // Verify error message (may appear in alert or helper text)
    await waitFor(() => {
      const errorElement = within(modal).getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('handles patients without dateOfBirth', async () => {
    const patientsWithoutDOB = [
      ...patients,
      {
        id: '4',
        name: 'No Birthday',
        gender: Gender.Other,
        occupation: 'Unknown',
        ssn: '000-00-0000',
        entries: [],
      }
    ];
    
    render(
      <MemoryRouter>
        <PatientListPage patients={patientsWithoutDOB} setPatients={() => {}} />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      const names = screen.getAllByTestId('patient-name').map(el => el.textContent);
      expect(names[0]).toBe('No Birthday');
    });
  });
});
