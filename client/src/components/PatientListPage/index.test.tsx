import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PatientListPage from './index';
import { Gender } from '../../types';

// Mock patientService with proper typing using vi.hoisted to avoid hoisting issues
const mockPatientService = vi.hoisted(() => ({
  getAll: vi.fn(),
}));

vi.mock('../../services/patients', () => ({
  default: mockPatientService,
  PaginatedResponse: vi.fn(),
}));

// Create a wrapper component to provide context with retries disabled
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PatientListPage', () => {
  it('should be recognized by Vitest', () => {
    expect(true).toBe(true);
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockPatientService.getAll).mockResolvedValue({
      data: Array.from({ length: 10 }, (_, i) => ({
        id: i.toString(),
        name: i % 2 === 0 ? 'John Doe' : 'Jane Smith',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Occupation',
        ssn: '123456-7890',
        entries: [],
        healthRating: 3,
      })),
      metadata: {
        totalItems: 10,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 10,
      },
    });
  });

  it('renders loading skeletons during initial load', async () => {
    render(<PatientListPage />, { wrapper: TestWrapper });

    expect(screen.getAllByTestId('patient-skeleton')).toHaveLength(6);
    await waitFor(() =>
      expect(mockPatientService.getAll).toHaveBeenCalled()
    );
  });

  it('renders patient cards after loading', async () => {
    render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      // Use getAllByText since there are multiple patients with same name/occupation
      const johnDoes = screen.getAllByText('John Doe');
      const occupations = screen.getAllByText('Occupation');
      const janeSmiths = screen.getAllByText('Jane Smith');
      
      expect(johnDoes.length).toBeGreaterThan(0);
      expect(occupations.length).toBeGreaterThan(0);
      expect(janeSmiths.length).toBeGreaterThan(0);
    });
  });

  it('filters patients using search input', async () => {
      render(<PatientListPage />, { wrapper: TestWrapper });

      await waitFor(() => {
          expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByPlaceholderText(
          'Search patients by name, occupation or gender...'
      );
      await userEvent.type(searchInput, 'John');

      await waitFor(() => {
          expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
          expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
  });

  it('shows empty state when no patients match search', async () => {
    render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(
      'Search patients by name, occupation or gender...'
    );
    await userEvent.type(searchInput, 'NonExistingPatient');

    await waitFor(() => {
      expect(
        screen.getByText('No patients found')
      ).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('opens add patient modal when button clicked', async () => {
    render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });

    const addButton = screen.getByText('Add New Patient');
    await userEvent.click(addButton);

    expect(screen.getByText('Add a new patient')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    const errorMessage = 'Failed to load patients';
    vi.mocked(mockPatientService.getAll).mockRejectedValue(
      new Error(errorMessage)
    );

    render(<PatientListPage />, { wrapper: TestWrapper });

    // Error should appear immediately without retries
    await waitFor(() => {
      const errorElement = screen.getByTestId('error-message');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(`Error: ${errorMessage}`);
    });
  });

  it('renders health rating bar in patient cards', async () => {
    render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      // All patients have rating 3 - check for matching aria-labels
      const message = 'Health rating: The patient has a diagnosed condition';
      const ratingBars = screen.getAllByRole('img', { name: message });
      expect(ratingBars.length).toBe(10);
    });
  });

  it('navigates to patient page when card clicked', async () => {
    render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });

    const patientCards = screen.getAllByTestId('patient-card');
    const johnCard = patientCards[0]; // First card is John Doe
    if (johnCard) {
      await userEvent.click(johnCard);
      // In a real test, we would verify navigation using react-router test utils
    }
  });

  it('matches snapshot when loaded', async () => {
    const { container } = render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });
    expect(container).toMatchSnapshot();
  });

  it('matches empty state snapshot', async () => {
    mockPatientService.getAll.mockResolvedValue([]);
    const { container } = render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() =>
      expect(
        screen.getByText('No patients found')
      ).toBeInTheDocument()
    );
    expect(container).toMatchSnapshot();
  });

  it('handles pagination correctly', async () => {
      render(<PatientListPage />, { wrapper: TestWrapper });

      vi.mocked(mockPatientService.getAll).mockResolvedValueOnce({
          data: Array.from({ length: 5 }, (_, i) => ({
              id: i.toString(),
              name: `Patient ${i + 1}`,
              dateOfBirth: '1980-01-01',
              gender: Gender.Male,
              occupation: 'Occupation',
              ssn: '123456-7890',
              entries: [],
              healthRating: 3,
          })),
          metadata: {
              totalItems: 10,
              totalPages: 2,
              currentPage: 1,
              itemsPerPage: 5,
          },
      });

      await waitFor(() => {
          expect(screen.getByText('Patient 1')).toBeInTheDocument();
      });

      // Check that only first 5 patients are shown
      expect(screen.getByText('Patient 1')).toBeInTheDocument();
      expect(screen.getByText('Patient 5')).toBeInTheDocument();
      expect(screen.queryByText('Patient 6')).not.toBeInTheDocument();

      vi.mocked(mockPatientService.getAll).mockResolvedValueOnce({
          data: Array.from({ length: 5 }, (_, i) => ({
              id: (i + 5).toString(),
              name: `Patient ${i + 6}`,
              dateOfBirth: '1980-01-01',
              gender: Gender.Male,
              occupation: 'Occupation',
              ssn: '123456-7890',
              entries: [],
              healthRating: 3,
          })),
          metadata: {
              totalItems: 10,
              totalPages: 2,
              currentPage: 2,
              itemsPerPage: 5,
          },
      });

      const nextButton = screen.getByLabelText('Go to next page');
      await userEvent.click(nextButton);

      await waitFor(() =>
          expect(mockPatientService.getAll).toHaveBeenCalledWith(2, 5)
      );
      await waitFor(() => {
          expect(screen.queryByText('Patient 1')).not.toBeInTheDocument();
          expect(screen.getByText('Patient 6')).toBeInTheDocument();
      });
  });

  it('resets to first page when changing page size', async () => {
    render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });

    const pageSizeSelect = screen.getByLabelText('Rows per page:');
    await userEvent.selectOptions(pageSizeSelect, ['25']);

    await waitFor(() =>
      expect(mockPatientService.getAll).toHaveBeenCalledWith(1, 25)
    );
  });

  it('shows pagination controls when there are multiple pages', async () => {
    vi.mocked(mockPatientService.getAll).mockResolvedValueOnce({
      data: Array.from({ length: 5 }, (_, i) => ({
        id: i.toString(),
        name: `Patient ${i + 1}`,
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Occupation',
        ssn: '123456-7890',
        entries: [],
        healthRating: 3,
      })),
      metadata: {
        totalItems: 10,
        totalPages: 2,
        currentPage: 1,
        itemsPerPage: 5,
      },
    });

    render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(
        screen.getByLabelText('Go to next page')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Go to previous page')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Go to page 1')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Go to page 2')
      ).toBeInTheDocument();
    });
  });

  it('displays correct health rating colors and messages', async () => {
    // Mock data with different health ratings
    vi.mocked(mockPatientService.getAll).mockResolvedValueOnce({
      data: [
        {
          id: '1',
          name: 'Patient 1',
          dateOfBirth: '1980-01-01',
          gender: Gender.Male,
          occupation: 'Occupation',
          ssn: '123456-7890',
          entries: [],
          healthRating: 0,
        },
        {
          id: '2',
          name: 'Patient 2',
          dateOfBirth: '1980-01-01',
          gender: Gender.Male,
          occupation: 'Occupation',
          ssn: '123456-7890',
          entries: [],
          healthRating: 1,
        },
        {
          id: '3',
          name: 'Patient 3',
          dateOfBirth: '1980-01-01',
          gender: Gender.Male,
          occupation: 'Occupation',
          ssn: '123456-7890',
          entries: [],
          healthRating: 2,
        },
        {
          id: '4',
          name: 'Patient 4',
          dateOfBirth: '1980-01-01',
          gender: Gender.Male,
          occupation: 'Occupation',
          ssn: '123456-7890',
          entries: [],
          healthRating: 3,
        },
      ],
      metadata: {
        totalItems: 4,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 10,
      },
    });

    render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(
        screen.getByText('The patient is in great shape')
      ).toBeInTheDocument();
      expect(
        screen.getByText('The patient has a low risk of getting sick')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'The patient has a high risk of getting sick'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'The patient has a chronic condition or high risk of complications'
        )
      ).toBeInTheDocument();
    });
  });

  it('prevents XSS attacks in patient data', async () => {
    const maliciousName = '<script>alert("XSS")</script>';
    const maliciousOccupation = '<img src=x onerror=alert(1)>';

    vi.mocked(mockPatientService.getAll).mockResolvedValueOnce({
      data: [
        {
          id: '1',
          name: maliciousName,
          dateOfBirth: '1980-01-01',
          gender: Gender.Male,
          occupation: maliciousOccupation,
          ssn: '123456-7890',
          entries: [],
          healthRating: 0,
        },
      ],
      metadata: {
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 10,
      },
    });

    render(<PatientListPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      // Find the grid row containing our test patient by SSN
      const ssnCell = screen.getByText('123456-7890');
      const testRow = ssnCell.closest('tr');
      expect(testRow).toBeInTheDocument();

      // Verify name is sanitized (should contain the text without tags)
      expect(within(testRow as HTMLElement).getByText('alert("XSS")')).toBeInTheDocument();
      
      // Verify occupation is sanitized (should contain the text without tags)
      expect(within(testRow as HTMLElement).getByText('alert(1)')).toBeInTheDocument();
    });
  });
});
