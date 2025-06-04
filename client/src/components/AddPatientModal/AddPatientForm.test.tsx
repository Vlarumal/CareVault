import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AddPatientForm from './AddPatientForm';
import { Gender } from '../../types';
import { vi } from 'vitest';

// Mock callbacks
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

describe('AddPatientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test rendering and basic interactions will be added here
  it('renders all form fields', () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Social security number')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of birth')).toBeInTheDocument();
    expect(screen.getByLabelText('Occupation')).toBeInTheDocument();
    expect(screen.getByTestId('gender-select')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // Name validation tests
  it('shows error when name is empty', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Name');
    await userEvent.click(nameInput);
    await userEvent.tab(); // Trigger blur
    
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });

  it('shows error when name is less than 3 characters', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Name');
    await userEvent.type(nameInput, 'ab');
    await userEvent.tab(); // Trigger blur
    
    expect(await screen.findByText('Name must be at least 3 characters')).toBeInTheDocument();
  });

  it('clears error when valid name is entered', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Name');
    await userEvent.type(nameInput, 'abc');
    await userEvent.tab();
    
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Name must be at least 3 characters')).not.toBeInTheDocument();
  });

  // SSN validation tests
  it('shows error when SSN is empty', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const ssnInput = screen.getByLabelText('Social security number');
    await userEvent.click(ssnInput);
    await userEvent.tab();
    
    expect(await screen.findByText('SSN is required')).toBeInTheDocument();
  });

  it('shows error when SSN format is invalid', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const ssnInput = screen.getByLabelText('Social security number');
    await userEvent.type(ssnInput, '123-45-678'); // Too short
    await userEvent.tab();
    
    expect(await screen.findByText('SSN must be in format XXX-XX-XXXX')).toBeInTheDocument();
  });

  it('clears error when valid SSN is entered', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const ssnInput = screen.getByLabelText('Social security number');
    await userEvent.type(ssnInput, '123-45-6789');
    await userEvent.tab();
    
    expect(screen.queryByText('SSN is required')).not.toBeInTheDocument();
    expect(screen.queryByText('SSN must be in format XXX-XX-XXXX')).not.toBeInTheDocument();
  });

  // Date of birth validation tests
  it('shows error when date of birth is empty', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const dobInput = screen.getByLabelText('Date of birth');
    await userEvent.click(dobInput);
    await userEvent.tab();
    
    expect(await screen.findByText('Date of birth is required')).toBeInTheDocument();
  });

  it('shows error when date of birth is invalid', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const dobInput = screen.getByLabelText('Date of birth');
    await userEvent.type(dobInput, '2025-13-01');
    await userEvent.tab();
    
    expect(await screen.findByText('Invalid date format (use YYYY-MM-DD)')).toBeInTheDocument();
  });

  it('shows error when date of birth is in future', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const dobInput = screen.getByLabelText('Date of birth');
    await userEvent.type(dobInput, futureDateStr);
    await userEvent.tab();
    
    expect(await screen.findByText('Date cannot be in the future')).toBeInTheDocument();
  });

  it('shows error when date of birth is in future', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().split('T')[0];
    
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const dobInput = screen.getByLabelText('Date of birth');
    await userEvent.type(dobInput, futureDate);
    await userEvent.tab();
    
    expect(await screen.findByText('Date cannot be in the future')).toBeInTheDocument();
  });

  it('clears error when valid date of birth is entered', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const dobInput = screen.getByLabelText('Date of birth');
    await userEvent.type(dobInput, '1990-01-01');
    await userEvent.tab();
    
    expect(screen.queryByText('Date of birth is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid date format (use YYYY-MM-DD)')).not.toBeInTheDocument();
    expect(screen.queryByText('Date cannot be in the future')).not.toBeInTheDocument();
  });

  // Form submission tests
  it('prevents submission with invalid data', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByText('Add');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    render(<AddPatientForm onCancel={mockOnCancel} onSubmit={mockOnSubmit} />);
    
    // Fill valid data
    await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
    await userEvent.type(screen.getByLabelText('Social security number'), '123-45-6789');
    await userEvent.type(screen.getByLabelText('Date of birth'), '1990-01-01');
    await userEvent.type(screen.getByLabelText('Occupation'), 'Developer');
    
    const submitButton = screen.getByText('Add');
    await userEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      ssn: '123-45-6789',
      dateOfBirth: '1990-01-01',
      occupation: 'Developer',
      gender: Gender.Other
    });
  });
});
