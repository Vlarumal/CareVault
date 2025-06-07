/**
 * Service for calculating health ratings from patient entries
 */

import { Entry, HealthCheckEntry } from '../types';

/**
 * Gets the latest health rating from patient entries
 * @param entries - Array of patient entries
 * @returns Latest health rating or null if not available
 */
export const getLatestHealthRating = (entries: Entry[]): number | null => {
  if (!entries || entries.length === 0) return null;
  
  const healthCheckEntries = entries.filter(
    entry => entry.type === 'HealthCheck'
  ) as HealthCheckEntry[];
  
  if (healthCheckEntries.length === 0) return null;
  
  const sortedEntries = [...healthCheckEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedEntries[0].healthCheckRating ?? null;
};