import { z } from 'zod';

/**
 * Schema for filtering parameters
 * Allows filtering by specific fields with appropriate types
 */
export const filterSchema = z
  .object({
    name: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    occupation: z.string().optional(),
  })
  .strict();

/**
 * Schema for sorting parameters
 * Allows sorting by specific fields with direction
 */
export const sortSchema = z
  .object({
    field: z.enum([
      'name',
      'dateOfBirth',
      'health_rating',
      'gender',
      'occupation',
    ]),
    direction: z.enum(['asc', 'desc']).default('asc'),
  })
  .strict();

/**
 * Combined schema for both filtering and sorting
 */
export const filterSortSchema = z.object({
  filter: filterSchema.optional(),
  sort: sortSchema.optional(),
});

// filterSort.schema.ts
export const sortItemSchema = z.object({
  field: z.string(),
  sort: z.enum(['asc', 'desc']),
});

export const sortModelSchema = z.array(sortItemSchema).optional();
