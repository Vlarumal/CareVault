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
const { mockGetPatientById, mockGetAllDiagnoses, mockCreateNewEntry } = vi.hoisted(() => ({
  mockGetPatientById: vi.fn(),
  mockGetAllDiagnoses: vi.fn(),
  mockCreateNewEntry: vi.fn(),
}));

// Mock the patientService module
vi.mock('../../services/patients', () => ({
  default: {
    getById: mockGetPatientById,
    createNewEntry: mockCreateNewEntry,
  },
}));

// Mock the diagnosisService module
vi.mock('../../services/diagnoses', () => ({
  default: {
    getAllDiagnoses: mockGetAllDiagnoses,
  },
}));

// Mock health rating service
vi.mock('../../services/healthRatingService', () => ({
  getLatestHealthRating: vi.fn(),
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
    vi.mocked(import('../../services/healthRatingService').then(m => m.getLatestHealthRating)).mockReturnValue(1);
  });

  test('shows skeleton while fetching data', async () => {
    mockGetPatientById.mockResolvedValue(mockPatient);
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);

    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );

    // Skeleton should be visible initially
    expect(screen.getByTestId('patient-details-skeleton')).toBeInTheDocument();
    
    // Skeleton should disappear after data loads
    await waitFor(() => {
      expect(screen.queryByTestId('patient-details-skeleton')).not.toBeInTheDocument();
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
    
    const alert = await screen.findByTestId('error-alert');
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
      const alert = screen.getByTestId('warning-alert');
      expect(alert).toHaveTextContent('No patient found');
      expect(alert).toHaveClass('MuiAlert-standardWarning');
    });
  });
  
  test('successfully adds a new entry with optimistic update', async () => {
    const patientWithEntries: Patient = {
      ...mockPatient,
      entries: [],
    };
    mockGetPatientById.mockResolvedValue(patientWithEntries);
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);
  
    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );
  
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  
    // Simulate filling the form for a HealthCheck entry
    fireEvent.change(screen.getByLabelText('Entry Type'), { target: { value: 'HealthCheck' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New entry description' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2023-01-01' } });
    fireEvent.change(screen.getByLabelText('Specialist'), { target: { value: 'Dr. New' } });
    fireEvent.change(screen.getByLabelText('Healthcheck rating'), { target: { value: '0' } });
  
    // Mock the mutation to resolve successfully
    const newEntry = {
      id: 'new-entry-id',
      date: '2023-01-01',
      type: 'HealthCheck' as const,
      specialist: 'Dr. New',
      description: 'New entry description',
      healthCheckRating: 0,
    };
    mockCreateNewEntry.mockResolvedValue(newEntry);
  
    // Submit the form
    fireEvent.click(screen.getByText('Add'));
  
    // Verify optimistic update
    await waitFor(() => {
      expect(screen.getByText('New entry description')).toBeInTheDocument();
    });
  
    // Wait for the mutation to complete
    await waitFor(() => {
      expect(mockCreateNewEntry).toHaveBeenCalled();
      expect(screen.getByText('New entry description')).toBeInTheDocument();
    });
  });
  
  test('rolls back optimistic update and shows error when adding entry fails', async () => {
    const patientWithEntries: Patient = {
      ...mockPatient,
      entries: [],
    };
    mockGetPatientById.mockResolvedValue(patientWithEntries);
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);
  
    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );
  
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  
    // Fill the form
    fireEvent.change(screen.getByLabelText('Entry Type'), { target: { value: 'HealthCheck' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New entry description' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2023-01-01' } });
    fireEvent.change(screen.getByLabelText('Specialist'), { target: { value: 'Dr. New' } });
    fireEvent.change(screen.getByLabelText('Healthcheck rating'), { target: { value: '0' } });
  
    // Mock the mutation to reject
    const errorMsg = 'Failed to add entry';
    mockCreateNewEntry.mockRejectedValue(new Error(errorMsg));
  
    // Submit the form
    fireEvent.click(screen.getByText('Add'));
  
    // Verify optimistic update appears
    await waitFor(() => {
      expect(screen.getByText('New entry description')).toBeInTheDocument();
    });
  
    // Wait for the error
    await waitFor(() => {
      expect(mockCreateNewEntry).toHaveBeenCalled();
      expect(screen.queryByText('New entry description')).not.toBeInTheDocument();
      expect(screen.getByText(`Failed to add entry: ${errorMsg}`)).toBeInTheDocument();
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

    // Check diagnosis code and name are rendered separately
    expect(screen.getByText(/E66/)).toBeInTheDocument();
    expect(screen.getByText(/Obesity/)).toBeInTheDocument();
  });

  test('uses health rating service for latest rating', async () => {
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
      ],
    };

    mockGetPatientById.mockResolvedValue(patientWithEntries);
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);

    // Mock health rating service to return specific value
    vi.mocked(import('../../services/healthRatingService').then(m => m.getLatestHealthRating)).mockReturnValue(2);

    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Verify health rating service was called
    expect(import('../../services/healthRatingService').then(m => m.getLatestHealthRating)).toHaveBeenCalled();

    // Verify health rating bar shows correct value
    const healthRatingText = await screen.findByTestId('health-rating-text');
    expect(healthRatingText).toHaveTextContent('The patient has a high risk of getting sick');
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
    const alert = await screen.findByTestId('error-alert');
    expect(alert).toHaveTextContent('Network error');
    
    // Simulate retry
    fireEvent.click(screen.getByTestId('retry-button'));
    
    // Verify recovery (async)
    expect(await screen.findByTestId('patient-name')).toHaveTextContent('John Doe');
    expect(screen.queryByText('Network error')).not.toBeInTheDocument();
  });

  test('handles entry rendering errors with error boundary', async () => {
    const patientWithEntries: Patient = {
      ...mockPatient,
      entries: [
        {
          id: 'faulty-entry',
          date: '2023-01-01',
          type: 'HealthCheck',
          specialist: 'Dr. Smith',
          description: 'Faulty entry',
          healthCheckRating: 1,
        },
      ],
    };

    mockGetPatientById.mockResolvedValue(patientWithEntries);
    mockGetAllDiagnoses.mockResolvedValue(mockDiagnoses);

    // Make EntryDetails throw an error
    vi.mock('./EntryDetails', () => ({
      default: () => {
        throw new Error('Test rendering error');
      }
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <PatientPage />
      </QueryClientProvider>
    );

    // Verify error boundary is triggered
    await waitFor(() => {
      expect(screen.getByText('Failed to render entry.')).toBeInTheDocument();
      expect(screen.getByText('Faulty entry')).toBeInTheDocument();
    });
  });
});
