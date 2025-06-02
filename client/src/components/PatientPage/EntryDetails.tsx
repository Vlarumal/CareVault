import OccupationalHealthcareEntryComponent from './OccupationalHealthcareEntry';
import HealthCheckEntryComponent from './HealthCheckEntry';
import HospitalEntryComponent from './HospitalEntry';
import { assertNever } from '../../utils';
import { Entry } from '../../types';

const EntryDetails: React.FC<{ entry: Entry }> = ({ entry }) => {
  switch (entry.type) {
    case 'Hospital':
      return <HospitalEntryComponent entry={entry} />;
    case 'OccupationalHealthcare':
      return <OccupationalHealthcareEntryComponent entry={entry} />;
    case 'HealthCheck':
      return <HealthCheckEntryComponent entry={entry} />;
    default:
      return assertNever(entry);
  }
};

export default EntryDetails;
