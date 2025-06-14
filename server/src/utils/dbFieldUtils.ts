
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function validateDBField(field: string, allowedFields: string[]): string {
  const snakeCaseField = toSnakeCase(field);
  
  if (!allowedFields.includes(snakeCaseField)) {
    throw new Error(`Invalid field: ${field}. Allowed fields: ${allowedFields.join(', ')}`);
  }
  
  return snakeCaseField;
}

export const PATIENT_FIELDS = [
  'id', 
  'name', 
  'occupation', 
  'gender', 
  'ssn', 
  'date_of_birth', 
  'health_rating'
];