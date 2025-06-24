/**
 * Utility functions for date/time operations
 */

/**
 * Formats a Date object to UTC string in ISO format (YYYY-MM-DD)
 * @param date - Date object to format
 * @returns UTC date string in YYYY-MM-DD format
 */
export const formatDateUTC = (date: Date): string => {
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  return utcDate.toISOString().split('T')[0];
};

/**
 * Formats a Date object to UTC ISO string with milliseconds
 * @param date - Date object to format
 * @returns UTC date string in ISO format
 */
export const formatDateTimeUTC = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parses a UTC date string to local Date object
 * @param dateString - UTC date string (YYYY-MM-DD or ISO format)
 * @returns Local Date object
 */
export const parseUTCDate = (dateString: string): Date => {
  const isoString = dateString.includes('T') 
    ? dateString 
    : `${dateString}T00:00:00Z`;
  return new Date(isoString);
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
 */
export const isDateValid = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  
  if (month === 2) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (day > (isLeapYear ? 29 : 28)) return false;
  }
  
  if ([4, 6, 9, 11].includes(month) && day > 30) return false;
  
  return true;
};