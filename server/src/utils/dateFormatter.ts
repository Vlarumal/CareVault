/**
 * Formats dates to ISO 8601 date format (YYYY-MM-DD). Handles both strings and Date objects.
 * For Date objects, uses local date components to maintain date values.
 *
 * @param date - The date to format (string or Date object)
 * @returns The formatted date string in YYYY-MM-DD format
 */
export default function formatToISODate(date: string | Date): string {
  // Handle pure date strings directly
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // For Date objects, use local date components
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Parse other string formats as Date objects
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date format');
  }
  
  // Use local date components for parsed dates
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}