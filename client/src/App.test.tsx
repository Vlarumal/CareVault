import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import patientService from './services/patients';
import { vi } from 'vitest';
import { Gender } from './types';

vi.mock('axios');
vi.mock('./services/patients');

const mockPatients = [
  {
    id: '1',
    name: 'John Doe',
    dateOfBirth: '1980-01-01',
    gender: Gender.Male,
    occupation: 'Developer',
    entries: []
  }
];

describe('App component', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} });
    vi.mocked(patientService.getAll).mockResolvedValue(mockPatients);
  });

  test('renders home page with patient list', async () => {
    render(<App />);
    expect(await screen.findByText('Patientor')).toBeInTheDocument();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  test('navigates to patient page', async () => {
    render(<App />);
    const patientLink = await screen.findByText('John Doe');
    fireEvent.click(patientLink);
    expect(await screen.findByTestId('patient-page')).toBeInTheDocument();
  });

  test('shows loading state', async () => {
    vi.mocked(patientService.getAll).mockImplementation(
      () => new Promise(() => {})
    );
    render(<App />);
    expect(await screen.findByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('recovers from data fetch error', async () => {
    vi.mocked(patientService.getAll).mockRejectedValue(new Error('Network error'));
    render(<App />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to fetch patients');
    fireEvent.click(screen.getByText('Retry'));
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });
});
