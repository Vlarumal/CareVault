import {
  Favorite,
  Female,
  Healing,
  Male,
  MedicalServices,
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
 * @context7 /microsoft/typescript-website
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
      break;
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
 * @context7 /microsoft/typescript-website
 */
export const assertNever = (value: never): never => {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
};

/**
 * Validates date string in YYYY-MM-DD format
 * @param dateString - Date string to validate
 * @returns True if valid, false otherwise
 * 
 * @example
 * // Returns true
 * isDateValid('2025-06-04')
 * 
 * @context7 /microsoft/typescript-website
 */
export const isDateValid = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  // Parse date components
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Check for valid month (1-12) and day (1-31)
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  
  // Check for February and leap years
  if (month === 2) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (day > (isLeapYear ? 29 : 28)) return false;
  }
  
  // Check for months with 30 days
  if ([4, 6, 9, 11].includes(month) && day > 30) return false;
  
  return true;
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
 * @context7 /microsoft/typescript-website
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
 * @context7 /microsoft/typescript-website
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
 * @context7 /microsoft/typescript-website
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
 * @context7 /microsoft/typescript-website
 */
export const validateSSN = (ssn: string): string => {
  const regex = /^(\d{6}-\d{4}|\d{6}-\d{3}[A-Za-z])$/;
  
  if (!regex.test(ssn)) {
    return 'Invalid SSN format. Use XXXXXX-XXXX';
  }
  return '';
};
