import { GridFilterModel } from '@mui/x-data-grid';

interface FilterModel {
  items: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

interface SortModel {
  field: string;
  sort: 'asc' | 'desc';
}

interface ServerFilter {
  name?: string;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
}

interface ServerSort {
  field: 'name' | 'dateOfBirth' | 'healthRating';
  direction: 'asc' | 'desc';
}

export const convertGridFilterModel = (gridFilterModel: GridFilterModel | null): FilterModel | null => {
  if (!gridFilterModel) return null;

  return {
    items: gridFilterModel.items.map(item => ({
      field: item.field,
      operator: item.operator || 'equals',
      value: item.value || '',
    })),
  };
};

export const convertGridSortModel = (gridSortModel: ReadonlyArray<{ field: string; sort?: 'asc' | 'desc' | undefined | null }> | null): SortModel | null => {
  if (!gridSortModel || gridSortModel.length === 0) return null;

  const sort = gridSortModel[0].sort || 'asc'; // Default to 'asc' if undefined or null

  return {
    field: gridSortModel[0].field,
    sort: sort as 'asc' | 'desc',
  };
};

/**
 * Converts the client-side filter model to a server-side filter object
 * that matches the server's expected schema
 */
export const toServerFilter = (filterModel: FilterModel | null): ServerFilter | null => {
  if (!filterModel) return null;

  const serverFilter: ServerFilter = {};

  filterModel.items.forEach(item => {
    switch (item.field) {
      case 'name':
        serverFilter.name = item.value;
        break;
      case 'gender':
        if (['male', 'female', 'other'].includes(item.value)) {
          serverFilter.gender = item.value as 'male' | 'female' | 'other';
        }
        break;
      case 'occupation':
        serverFilter.occupation = item.value;
        break;
      default:
        console.warn(`Ignoring unsupported search field: ${item.field}`);
        break;
    }
  });

  return serverFilter;
};

/**
 * Converts the client-side sort model to a server-side sort object
 * that matches the server's expected schema
 */
export const toServerSort = (sortModel: SortModel | null): ServerSort | null => {
  if (!sortModel) return null;

  const serverSort: ServerSort = {
    field: 'name', // Default field
    direction: 'asc', // Default direction
  };

  if (['name', 'dateOfBirth', 'healthRating'].includes(sortModel.field)) {
    serverSort.field = sortModel.field as 'name' | 'dateOfBirth' | 'healthRating';
    serverSort.direction = sortModel.sort;
  }

  return serverSort;
};