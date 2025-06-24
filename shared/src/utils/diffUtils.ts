import { Entry, VersionDiff } from '../types/medicalTypes';

export interface ConflictMarker {
  path: string;
  baseValue: unknown;
  currentValue: unknown;
  incomingValue: unknown;
}

export const calculateVersionDiff = (
  oldVersion: Entry,
  _newVersion: Entry,
  baseVersion?: Entry
): VersionDiff & { conflicts?: ConflictMarker[] } => {
  const diff: VersionDiff = {};
  
  const compareObjects = (oldObj: any, newObj: any, path = '') => {
    if (oldObj === null || oldObj === undefined ||
        newObj === null || newObj === undefined) {
      if (oldObj !== newObj) {
        diff[path] = { oldValue: oldObj, newValue: newObj };
      }
      return;
    }

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    
    allKeys.forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      if (typeof oldValue !== typeof newValue) {
        diff[currentPath] = { oldValue, newValue };
        return;
      }

      if (oldValue === null || newValue === null) {
        if (oldValue !== newValue) {
          diff[currentPath] = { oldValue, newValue };
        }
        return;
      }

      if (typeof oldValue === 'object') {
        compareObjects(oldValue, newValue, currentPath);
      } else if (oldValue !== newValue) {
        diff[currentPath] = { oldValue, newValue };
      }
    });
  };

  const result: VersionDiff & { conflicts?: ConflictMarker[] } = diff;
  
  if (baseVersion) {
    const baseDiff = calculateVersionDiff(baseVersion, oldVersion);
    result.conflicts = findConflicts(diff, baseDiff);
  }

  return result;
};

export const findConflicts = (
  currentDiff: VersionDiff,
  baseDiff: VersionDiff
): ConflictMarker[] => {
  const conflicts: ConflictMarker[] = [];
  
  Object.keys(currentDiff).forEach(path => {
    if (baseDiff[path] &&
        JSON.stringify(currentDiff[path].oldValue) !==
        JSON.stringify(baseDiff[path].oldValue)) {
      conflicts.push({
        path,
        baseValue: baseDiff[path].oldValue,
        currentValue: currentDiff[path].newValue,
        incomingValue: baseDiff[path].newValue
      });
    }
  });

  return conflicts;
};

export const hasMeaningfulDiff = (diff: VersionDiff): boolean => {
  return Object.keys(diff).some(key => {
    const { oldValue, newValue } = diff[key];
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  });
};