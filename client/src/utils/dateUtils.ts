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