import {
  Favorite,
  Female,
  Healing,
  Male,
  MedicalServices,
  Transgender,
  Work,
} from '@mui/icons-material';
import { Entry, HealthCheckEntry, Patient } from './types';

/**
 * Returns corresponding icon component for medical/gender types
 *
 * @param icon - The type of icon to return. Possible values:
 *   - Patient gender: 'male', 'female', 'other'
 *   - Entry type: 'Hospital', 'OccupationalHealthcare', 'HealthCheck'
 *   - HealthCheck rating: 0, 1, 2, 3
 * @returns {JSX.Element | undefined} The corresponding MUI Icon component,
 *         or undefined if no icon is defined for the input.
 *
 * @example
 * // Returns Male icon
 * getIcon('male')
 *
 * @example
 * // Returns Hospital icon
 * getIcon('Hospital')
 *
 */
export const getIcon = (
  icon:
    | Patient['gender']
    | Entry['type']
    | HealthCheckEntry['healthCheckRating']
) => {
  switch (icon) {
    case 'male':
      return <Male />;
    case 'female':
      return <Female />;
    case 'other':
      return <Transgender />;
    case 'Hospital':
      return <Healing />;
    case 'OccupationalHealthcare':
      return <Work />;
    case 'HealthCheck':
      return <MedicalServices />;
    case 0:
      return <Favorite color='success' />;
    case 1:
      return <Favorite sx={{ color: 'yellow' }} />;
    case 2:
      return <Favorite color='warning' />;
    case 3:
      return <Favorite color='error' />;
    default:
      break;
  }
};

/**
 * Ensures exhaustive type checking for discriminated unions.
 *
 * @param value - Value that should be of type never at compile time.
 * @throws {Error} Always throws an error with the unhandled value.
 * @returns Never returns, always throws.
 *
 * @example
 * type Action = { type: 'A' } | { type: 'B' };
 * function reducer(action: Action) {
 *   switch (action.type) {
 *     case 'A': ... break;
 *     case 'B': ... break;
 *     default: assertNever(action); // Ensures all cases handled
 *   }
 * }
 *
 */
export const assertNever = (value: never): never => {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
};


/**
 * Validates health rating value (0-3)
 * @param value - Health rating to validate
 * @returns Error message if invalid, empty string if valid
 * 
 * @example
 * // Returns 'Health rating must be an integer between 0 and 3'
 * validateHealthRating(5)
 * 
 */
export const validateHealthRating = (value: number): string => {
  if (!Number.isInteger(value) || value < 0 || value > 3) {
    return 'Health rating must be an integer between 0 and 3';
  }
  return '';
};

/**
 * Validates required field value
 * @param value - Field value to check
 * @param fieldName - Name of field for error message
 * @returns Error message if invalid, empty string if valid
 * 
 * @example
 * // Returns 'Name is required'
 * validateRequired('', 'Name')
 * 
 */
export const validateRequired = (value: string, fieldName: string): string => {
  if (!value.trim()) {
    return `${fieldName} is required`;
  }
  return '';
};

/**
 * Validates that end date is after start date
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Error message if invalid, empty string if valid
 * 
 * @example
 * // Returns 'End date must be after start date'
 * validateDateRange('2025-06-10', '2025-06-01')
 * 
 */
export const validateDateRange = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    return 'End date must be after start date';
  }
  return '';
};

/**
 * Validates Social Security Number (SSN).
 *
 * Supported formats:
 * 1. XXXXXX-XXXX (without letter)
 * 2. XXXXXX-XXXL (with letter)
 *
 * @param ssn - SSN string to validate
 * @returns {string} Error message if invalid, empty string if valid
 *
 * @example
 * // Returns empty string (valid)
 * validateSSN('090471-8890')
 * validateSSN('050174-432N')
 *
 * @example
 * // Returns 'Invalid SSN format. Use XXXXXX-XXXX'
 * validateSSN('123-45-6789')
 *
 */
export const validateSSN = (ssn: string): string | undefined => {
  if (!/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
    return 'SSN must be in format 123-45-7890';
  }
  return undefined;
};

/**
 * Renders diagnosis codes with duplicates removed
 * @param diagnosisCodes - Array of diagnosis codes
 * @returns JSX element with diagnosis codes or null if no codes
 */
export const renderDiagnosisCodes = (diagnosisCodes?: string[] | null) => {
  if (!diagnosisCodes || diagnosisCodes.length === 0) {
    return null;
  }

  const uniqueDiagnosisCodes = Array.from(new Set(diagnosisCodes));

  return (
    <div>
      <strong>Diagnosis codes:</strong>
      <ul>
        {uniqueDiagnosisCodes.map(code => (
          <li key={code}>{code}</li>
        ))}
      </ul>
    </div>
  );
};
