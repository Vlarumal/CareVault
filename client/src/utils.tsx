import {
  Favorite,
  Female,
  Healing,
  Male,
  MedicalServices,
  Work,
} from '@mui/icons-material';
import { Entry, HealthCheckEntry, Patient } from './types';

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
 * Helper function for exhaustive type checking
 */
export const assertNever = (value: never): never => {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
};

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

export const validateHealthRating = (value: number): string => {
  if (!Number.isInteger(value) || value < 0 || value > 3) {
    return 'Health rating must be an integer between 0 and 3';
  }
  return '';
};

export const validateRequired = (value: string, fieldName: string): string => {
  if (!value.trim()) {
    return `${fieldName} is required`;
  }
  return '';
};

export const validateDateRange = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    return 'End date must be after start date';
  }
  return '';
};

export const isSSNValid = (ssn: string): boolean => {
  const regex = /^\d{3}-\d{2}-\d{4}$/;
  return regex.test(ssn);
};
