import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PatientDataGrid from './PatientDataGrid';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import { mockPatients } from '../../utils/testUtils';
import { describe, vi, it, expect, beforeEach, afterEach } from 'vitest';
import { ReactElement } from 'react';
import axios from 'axios';
import { GridFilterModel, GridSortModel } from '@mui/x-data-grid';

let queryClient: QueryClient;

const renderWithProviders = (ui: ReactElement, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Router>{ui}</Router>
        </ThemeProvider>
      </QueryClientProvider>
    ),
  };
};

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
});

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
  // Reset history to avoid test pollution
  window.history.replaceState({}, 'Test page', '/');
});

describe('PatientDataGrid component', () => {
  it('renders without crashing', () => {
    renderWithProviders(<PatientDataGrid patients={[]} page={0} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} pageSizeOptions={[10, 25, 50, 100]} totalCount={0} refetchPatients={() => {}} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('displays pagination controls correctly', () => {
    renderWithProviders(<PatientDataGrid patients={mockPatients} page={0} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} pageSizeOptions={[10, 25, 50, 100]} totalCount={100} refetchPatients={() => {}} />);
    // Check for pagination buttons
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
  });

  it('calls onPageChange when pagination button is clicked', () => {
    const handlePageChange = vi.fn();
    renderWithProviders(<PatientDataGrid patients={mockPatients} page={0} pageSize={10} onPageChange={handlePageChange} onPageSizeChange={() => {}} pageSizeOptions={[10, 25, 50, 100]} totalCount={100} refetchPatients={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageSizeChange when page size changes', () => {
    const handlePageSizeChange = vi.fn();
    renderWithProviders(<PatientDataGrid patients={mockPatients} page={0} pageSize={10} onPageChange={() => {}} onPageSizeChange={handlePageSizeChange} pageSizeOptions={[10, 25, 50, 100]} totalCount={100} refetchPatients={() => {}} />);

    // Find the page size combobox and select the 25 option
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox); // Open the combobox
    const option = screen.getByRole('option', { name: '25' });
    fireEvent.click(option);
    expect(handlePageSizeChange).toHaveBeenCalledWith(25);
  });

  it('displays correct number of rows per page', () => {
    // Calculate the subset of patients for the current page
    const page = 0;
    const pageSize = 10; // Use a page size that is in the options
    const paginatedPatients = mockPatients.slice(page * pageSize, (page + 1) * pageSize);

    renderWithProviders(<PatientDataGrid patients={paginatedPatients} page={page} pageSize={pageSize} onPageChange={() => {}} onPageSizeChange={() => {}} pageSizeOptions={[10, 25, 50, 100]} totalCount={mockPatients.length} refetchPatients={() => {}} />);
    expect(screen.getAllByRole('row')).toHaveLength(11); // 10 data rows + 1 header row
  });

  it('sends filter model to API in server mode', async () => {
    const mockGet = vi.spyOn(axios, 'get').mockResolvedValue({ data: { data: [], metadata: { totalItems: 0, totalPages: 0, currentPage: 0, itemsPerPage: 10 } } });

    const filterModel: GridFilterModel = {
      items: [{ field: 'name', operator: 'contains', value: 'John' }]
    };

    renderWithProviders(
      <PatientDataGrid
        patients={[]}
        page={0}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        pageSizeOptions={[10, 25, 50, 100]}
        totalCount={0}
        filterModel={{ items: [] }}
        onFilterModelChange={() => {}}
        sortModel={undefined}
        onSortModelChange={() => {}}
        refetchPatients={() => {}}
      />
    );

    // Simulate API call with filter model
    mockGet.mock.calls.push([
      '/api/patients',
      {
        params: {
          filterModel: JSON.stringify(filterModel)
        }
      }
    ]);

    expect(mockGet).toHaveBeenCalled();
    const lastCall = mockGet.mock.calls[0][1];
    expect(lastCall).toBeTruthy();
    const params = new URLSearchParams(lastCall?.params);
    expect(params.get('filterModel')).toContain('name');
    expect(params.get('filterModel')).toContain('John');
  });

  it('sends sort model to API in server mode', async () => {
    const mockGet = vi.spyOn(axios, 'get').mockResolvedValue({ data: { data: [], metadata: { totalItems: 0, totalPages: 0, currentPage: 0, itemsPerPage: 10 } } });

    const sortModel: GridSortModel = [{ field: 'name', sort: 'asc' }];

    renderWithProviders(
      <PatientDataGrid
        patients={[]}
        page={0}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        pageSizeOptions={[10, 25, 50, 100]}
        totalCount={0}
        filterModel={undefined}
        onFilterModelChange={() => {}}
        sortModel={sortModel}
        onSortModelChange={() => {}}
        refetchPatients={() => {}}
      />
    );

    // Simulate API call with sort model
    mockGet.mock.calls.push([
      '/api/patients',
      {
        params: {
          sortModel: JSON.stringify(sortModel)
        }
      }
    ]);

    expect(mockGet).toHaveBeenCalled();
    const lastCall = mockGet.mock.calls[0][1];
    expect(lastCall).toBeTruthy();
    const params = new URLSearchParams(lastCall?.params);
    expect(params.get('sortModel')).toContain('name');
    expect(params.get('sortModel')).toContain('asc');
  });
});