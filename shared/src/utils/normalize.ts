/**
 * Normalizes diagnosis codes to ensure it's an array of non-null values.
 * @param codes - The input diagnosis codes (can be any type)
 * @returns An array of diagnosis codes (non-null and non-undefined) or empty array.
 */
export function normalizeDiagnosisCodes(codes: any): string[] {
  if (!codes) return [];
  if (!Array.isArray(codes)) return [];
  return codes.filter(code => code !== null && code !== undefined);
}