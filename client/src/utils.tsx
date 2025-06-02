import {
  Favorite,
  Female,
  Healing,
  Male,
  MedicalServices,
  Work,
} from '@mui/icons-material';
import { Entry, HealthCheckEntry, Patient } from './types';

export const getIcon = (
  icon:
    | Patient['gender']
    | Entry['type']
    | HealthCheckEntry['healthCheckRating']
) => {
  switch (icon) {
    case 'male':
      return <Male />;
    case 'female':
      return <Female />;
    case 'other':
      break;
    case 'Hospital':
      return <Healing />;
    case 'OccupationalHealthcare':
      return <Work />;
    case 'HealthCheck':
      return <MedicalServices />;
    case 0:
      return <Favorite color='success' />;
    case 1:
      return <Favorite sx={{ color: 'yellow' }} />;
    case 2:
      return <Favorite color='warning' />;
    case 3:
      return <Favorite color='error' />;
    default:
      break;
  }
};

/**
 * Helper function for exhaustive type checking
 */
export const assertNever = (value: never): never => {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
};
