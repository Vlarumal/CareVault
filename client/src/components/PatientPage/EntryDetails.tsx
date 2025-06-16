import OccupationalHealthcareEntryComponent from './OccupationalHealthcareEntry';
import HealthCheckEntryComponent from './HealthCheckEntry';
import HospitalEntryComponent from './HospitalEntry';
import { assertNever } from '../../utils';
import { Entry } from '../../types';

const EntryDetails: React.FC<{
  entry: Entry;
  onEditEntry: (entry: Entry) => void;
}> = ({ entry, onEditEntry }) => {
  switch (entry.type) {
    case 'Hospital':
      return <HospitalEntryComponent entry={entry} onEditEntry={onEditEntry} />;
    case 'OccupationalHealthcare':
      return <OccupationalHealthcareEntryComponent entry={entry} onEditEntry={onEditEntry} />;
    case 'HealthCheck':
      return <HealthCheckEntryComponent entry={entry} onEditEntry={onEditEntry} />;
    default:
      return assertNever(entry);
  }
};

export default EntryDetails;
