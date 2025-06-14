import { filterSchema } from '../schemas/filterSort.schema';
import { ZodError } from 'zod';
import { validateDBField, PATIENT_FIELDS } from './dbFieldUtils';

/**
 * Allowed fields for filtering and sorting
 */
// should use frontend naming convention (camelCase)
const allowedFilterFields = [
  'name',
  'dateOfBirth',
  'gender',
  'occupation',
  'healthRating',
  'minHealthRating',
  'maxHealthRating',
] as const;

const allowedSortFields = [
  'name',
  'dateOfBirth',
  'healthRating',
  'gender',
  'occupation',
];

/**
 * Type-coerce filter values based on field type
 */
const coerceFilterValue = (field: string, value: any): any => {
  switch (field) {
    case 'health_rating':
      return parseInt(value, 10);
    case 'dateOfBirth':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(
          `Invalid date format for ${field}: ${value}. Use YYYY-MM-DD`
        );
      }
      return value;
    default:
      return value;
  }
};

/**
 * Build parameterized WHERE clause from filter object
 */
export const buildWhereClause = (
  filter: Record<string, any>,
  searchText?: string
): { whereClause: string; params: any[] } => {
  try {
    filterSchema.parse(filter);

    const conditions: string[] = [];
    const params: any[] = [];

    if (searchText) {
      const sanitizedText = searchText
        .trim()
        .replace(/[^\w\s-.]/g, '')
        .substring(0, 100);

      const searchConditions: string[] = [];
      const isHealthRatingNumeric = !isNaN(Number(sanitizedText));

      for (const field of [
        'name',
        'occupation',
        'gender',
        'ssn',
        'dateOfBirth',
        'healthRating',
      ]) {
        const dbField = validateDBField(field, PATIENT_FIELDS);

        if (field === 'healthRating' && isHealthRatingNumeric) {
          // For numeric healthRating, use exact match without wildcards
          searchConditions.push(
            `${dbField} = $${params.length + 1}::integer`
          );
        } else {
          // For other fields, use text search with wildcards
          if (field === 'healthRating') {
            searchConditions.push(
              `${dbField}::text ILIKE $${params.length + 1}`
            );
          } else if (field === 'dateOfBirth') {
            searchConditions.push(
              `TO_CHAR(${dbField}, 'YYYY-MM-DD') ILIKE $${
                params.length + 1
              }`
            );
          } else {
            searchConditions.push(
              `${dbField} ILIKE $${params.length + 1}`
            );
          }
        }
      }

      if (searchConditions.length > 0) {
        conditions.push(`(${searchConditions.join(' OR ')})`);

        // Push the appropriate parameter value
        if (isHealthRatingNumeric) {
          // For numeric healthRating search, push the number without wildcards
          params.push(Number(sanitizedText));
        } else {
          // For text search, push with wildcards
          params.push(`%${sanitizedText}%`);
        }
      }
    }

    for (const [field, value] of Object.entries(filter)) {
      if (!allowedFilterFields.includes(field as any)) {
        continue;
      }

      const coercedValue = coerceFilterValue(field, value);
      const dbField = validateDBField(field, PATIENT_FIELDS);

      if (
        field === 'healthRating' ||
        field === 'minHealthRating' ||
        field === 'maxHealthRating'
      ) {
        conditions.push(
          `patient_health_ratings.${dbField} ${
            field === 'minHealthRating'
              ? '>='
              : field === 'maxHealthRating'
              ? '<='
              : '='
          } $${params.length + 1}`
        );
      } else if (field === 'dateOfBirth') {
        // Handle date operators (>, <, >=, <=, =) with strict date casting
        const operator =
          typeof value === 'object' ? Object.keys(value)[0] : '=';
        conditions.push(
          `TO_CHAR(${dbField}, 'YYYY-MM-DD') ${operator} $${
            params.length + 1
          }`
        );
      } else {
        conditions.push(`${dbField} ILIKE $${params.length + 1}`);
        params.push(`%${coercedValue}%`);
      }

      params.push(coercedValue);
    }

    if (conditions.length === 0) {
      return { whereClause: '', params: [] };
    }

    return {
      whereClause: `WHERE ${conditions.join(' AND ')}`,
      params,
    };
  } catch (e) {
    if (e instanceof ZodError) {
      throw new Error(
        `Invalid filter parameters: ${e.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }
    throw e;
  }
};

/**
 * Build ORDER BY clause from sort object
 */
export const buildOrderByClause = (
  sortArray?: Array<{ field: string; direction: string }>,
  _params?: any[]
): { orderByClause: string; params?: any[] } => {
  if (!sortArray || sortArray.length === 0)
    return { orderByClause: '' };

  const clauses = sortArray
    .map((sort) => {
      if (!allowedSortFields.includes(sort.field)) return '';

      const dbField = validateDBField(sort.field, PATIENT_FIELDS);
      return `${dbField} ${sort.direction.toUpperCase()}${
        dbField === 'health_rating' ? ' NULLS LAST' : ''
      }`;
    })
    .filter(Boolean);

  return {
    orderByClause: clauses.length
      ? `ORDER BY ${clauses.join(', ')}`
      : '',
  };
};

/**
 * Build LIMIT clause from limit and offset parameters
 */
export const buildLimitClause = (
  limit?: number,
  offset?: number
): string => {
  const clauses: string[] = [];

  if (limit !== undefined) {
    clauses.push(`LIMIT ${limit}`);
  }

  if (offset !== undefined) {
    clauses.push(`OFFSET ${offset}`);
  }

  return clauses.join(' ');
};
