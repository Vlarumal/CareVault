import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientPage from './index';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Patient, Gender, DiagnosisEntry } from '../../types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock react-router-dom's useParams to provide id param
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
}));

// Create a QueryClient instance
const queryClient = new QueryClient();

// Create hoisted mocks for patientService and diagnosisService methods
const { mockGetPatientById, mockGetAllDiagnoses } = vi.hoisted(() => ({
  mockGetPatientById: vi.fn(),
  mockGetAllDiagnoses: vi.fn(),
}));

// Mock the patientService module
vi.mock('../../services/patients', () => ({
  default: {
    getById: mockGetPatientById,
  },
}));

// Mock the diagnosisService module
vi.mock('../../services/diagnoses', () => ({
  default: {
    getAllDiagnoses: mockGetAllDiagnoses,
  },
}));

const mockPatient: Patient = {
  id: '1',
  name: 'John Doe',
  gender: Gender.Male,
  occupation: 'Developer',
  ssn: '123-45-6789',
  dateOfBirth: '1980-01-01',
  entries: [],
};

const mockDiagnoses: DiagnosisEntry[] = [
  { code: 'E66', name: 'Obesity' },
  { code: 'M54.5', name: 'Low back pain' },
];

describe('PatientPage component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

test('shows loading spinner while fetching data', async () => {
  mockGetPatientById.mockResolvedValue(mockPatient);
  mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);

  render(
    <QueryClientProvider client={queryClient}>
      <PatientPage />
    </QueryClientProvider>
  );

  // Spinner should be visible initially
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  
  // Spinner should disappear after data loads
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});

  test('displays error message when patient fetch fails', async () => {
    mockGetPatientById.mockRejectedValue(new Error('Network error'));
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);

    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );
    
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Network error');
  });

  test('shows warning when no patient is found', async () => {
    mockGetPatientById.mockResolvedValue(null);
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);

    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('No patient found');
      expect(alert).toHaveClass('MuiAlert-standardWarning');
    });
  });

  test('renders patient data and entries correctly', async () => {
    const patientWithEntries: Patient = {
      ...mockPatient,
      entries: [
        {
          id: 'entry1',
          date: '2023-01-01',
          type: 'HealthCheck',
          specialist: 'Dr. Smith',
          description: 'Yearly health check',
          healthCheckRating: 1,
          diagnosisCodes: ['E66'],
        },
      ],
    };

    mockGetPatientById.mockResolvedValue(patientWithEntries);
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);

    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check patient info
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/ssn: 123-45-6789/i)).toBeInTheDocument();
    expect(screen.getByText(/occupation: Developer/i)).toBeInTheDocument();

    // Check entries section
    expect(screen.getByText(/entries/i)).toBeInTheDocument();

    // Check diagnosis code and name rendered
    expect(screen.getByText(/E66 Obesity/i)).toBeInTheDocument();
  });

  test('displays latest health rating', async () => {
    const patientWithEntries: Patient = {
      ...mockPatient,
      entries: [
        {
          id: 'entry1',
          date: '2023-01-01',
          type: 'HealthCheck',
          specialist: 'Dr. Smith',
          description: 'Yearly health check',
          healthCheckRating: 1,
        },
        {
          id: 'entry2',
          date: '2023-02-01',
          type: 'HealthCheck',
          specialist: 'Dr. Smith',
          description: 'Follow-up',
          healthCheckRating: 2,
        },
      ],
    };

    mockGetPatientById.mockResolvedValue(patientWithEntries);
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);

    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // The latest health rating should be 2 (from the most recent entry)
    expect(screen.getByText(/Latest Health Rating:/i)).toBeInTheDocument();
    // Check the health rating using test ID for reliability
    const healthRatingElement = await screen.findByTestId('health-rating-text');
    expect(healthRatingElement).toHaveTextContent('The patient has a high risk of getting sick');
  });

  test('recovers after error', async () => {
    // First call fails, second succeeds
    mockGetPatientById.mockRejectedValueOnce(new Error('Network error'))
                     .mockResolvedValueOnce(mockPatient);
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);

    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );
    
    // Verify error message (async)
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Network error');
    
    // Simulate retry
    fireEvent.click(screen.getByText('Retry'));
    
    // Verify recovery (async)
    expect(await screen.findByTestId('patient-name')).toHaveTextContent('John Doe');
    expect(screen.queryByText('Network error')).not.toBeInTheDocument();
  });
});
