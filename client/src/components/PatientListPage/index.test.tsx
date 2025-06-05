import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PatientListPage from './index';
import { Patient, Gender } from '../../../src/types';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock GridToolbarExport for export functionality tests
vi.mock('@mui/x-data-grid', async (importOriginal) => {
  const mod = await importOriginal<
    typeof import('@mui/x-data-grid')
  >();
  return {
    ...mod,
    GridToolbarExport: vi.fn(() => (
      <button aria-label='Export'>Export</button>
    )),
  };
});

describe('PatientListPage Component with DataGrid', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders patient data in DataGrid columns', () => {
    render(
      <MemoryRouter>
        <PatientListPage
          patients={patients}
          setPatients={() => {}}
        />
      </MemoryRouter>
    );

    // Verify column headers using screen queries
    expect(screen.getByText('Patient Name')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
    expect(screen.getByText('Occupation')).toBeInTheDocument();

    // Verify patient data rendering
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
  });

  it('sorts patients by name when column header clicked', async () => {
    render(
      <MemoryRouter>
        <PatientListPage
          patients={patients}
          setPatients={() => {}}
        />
      </MemoryRouter>
    );

    const nameHeader = screen.getByText('Patient Name');
    fireEvent.click(nameHeader);

    // Get first row after sorting
    const rows = screen.getAllByRole('row');
    expect(
      within(rows[1]).getByText('Alice Johnson')
    ).toBeInTheDocument();
  });

  it('filters patients using search input', async () => {
    render(
      <MemoryRouter>
        <PatientListPage
          patients={patients}
          setPatients={() => {}}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(
      'Search patients...'
    );
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    await waitFor(
      () => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(
          screen.queryByText('John Doe')
        ).not.toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });

  it('opens add patient modal when toolbar button clicked', async () => {
    render(
      <MemoryRouter>
        <PatientListPage
          patients={patients}
          setPatients={() => {}}
        />
      </MemoryRouter>
    );

    const addButton = screen.getByLabelText('Add new patient');
    fireEvent.click(addButton);

    await waitFor(
      () => {
        expect(
          screen.getByText('Add a new patient')
        ).toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });

  it('triggers export functionality when export button clicked', async () => {
    render(
      <MemoryRouter>
        <PatientListPage
          patients={patients}
          setPatients={() => {}}
        />
      </MemoryRouter>
    );

    const exportButton = screen.getByLabelText('Export');
    fireEvent.click(exportButton);

    await waitFor(
      async () => {
        const { GridToolbarExport } = vi.mocked(
          await import('@mui/x-data-grid')
        );
        expect(GridToolbarExport).toHaveBeenCalled();
      },
      { timeout: 1500 }
    );
  });

  it('paginates patients correctly', async () => {
    // Create 10 patients for pagination testing
    const manyPatients = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Patient ${i + 1}`,
      dateOfBirth: '1990-01-01',
      gender: Gender.Male,
      occupation: 'Test',
      ssn: '000-00-0000',
      entries: [],
    }));

    render(
      <MemoryRouter>
        <PatientListPage
          patients={manyPatients}
          setPatients={() => {}}
        />
      </MemoryRouter>
    );

    // Verify initial patient data renders
    await waitFor(() => {
      expect(screen.getByText('Patient 1')).toBeInTheDocument();
    });

    // Use class selectors to get visible rows
    // await waitFor(() => {
    //   const rows = document.querySelectorAll('[class*="row-"]');
    //   expect(rows).toHaveLength(7);
    // });

    // Verify pagination label
    // expect(screen.getByText('1-7 of 10')).toBeInTheDocument();

    // Verify 'previous' button is disabled on first page
    const prevButton = screen.getByLabelText('Go to previous page');
    expect(prevButton).toBeDisabled();

    // Verify 'next' button is enabled and click it
    const nextButton = screen.getByLabelText('Go to next page');
    expect(nextButton).toBeEnabled();
    await userEvent.click(nextButton);

    // Verify second page shows remaining 3 patients
    const secondPageRows =
      document.querySelectorAll('[class*="row-"]');
    expect(secondPageRows).toHaveLength(3);
    // expect(screen.getByText('8-10 of 10')).toBeInTheDocument();

    // Verify 'next' button is disabled on last page
    expect(nextButton).toBeDisabled();

    // Verify 'previous' button is enabled and click it
    expect(prevButton).toBeEnabled();
    await userEvent.click(prevButton);

    // Verify back to first page
    // const firstPageRows =
    //   document.querySelectorAll('[class*="row-"]');
    // expect(firstPageRows).toHaveLength(7);
    // expect(screen.getByText('1-7 of 10')).toBeInTheDocument();

    // Verify 'previous' button is disabled again on first page
    expect(prevButton).toBeDisabled();
  });

  it('handles empty patient list', async () => {
    render(
      <MemoryRouter>
        <PatientListPage
          patients={[]}
          setPatients={() => {}}
        />
      </MemoryRouter>
    );

    // Wait for the empty state message to appear
    const emptyMessage = await screen.findByText('No patients found');
    expect(emptyMessage).toBeInTheDocument();
  });

  it('handles single page correctly', async () => {
    const singlePagePatients = patients.slice(0, 3); // 3 patients
    render(
      <MemoryRouter>
        <PatientListPage
          patients={singlePagePatients}
          setPatients={() => {}}
        />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(4); // 1 header + 3 data rows
        expect(
          screen.queryByLabelText('Go to next page')
        ).toBeDisabled();
      },
      { timeout: 2000 }
    );
  });

  it('meets accessibility standards', async () => {
    render(
      <MemoryRouter>
        <PatientListPage
          patients={patients}
          setPatients={() => {}}
        />
      </MemoryRouter>
    );

    // Verify DataGrid accessibility attributes
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute(
      'aria-label',
      'Patient list with search and export'
    );

    // Verify pagination accessibility
    expect(
      screen.getByLabelText('Go to next page')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Go to previous page')
    ).toBeInTheDocument();
  });
});
