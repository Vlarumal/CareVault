import OccupationalHealthcareEntryComponent from './OccupationalHealthcareEntry';
import HealthCheckEntryComponent from './HealthCheckEntry';
import HospitalEntryComponent from './HospitalEntry';
import { assertNever } from '../../utils';
import { Entry } from '../../types';

const EntryDetails: React.FC<{
  entry: Entry;
  onEditEntry: (entry: Entry) => void;
  patientId: string;
  onDeleted: () => void;
}> = ({ entry, onEditEntry, patientId, onDeleted }) => {
  switch (entry.type) {
    case 'Hospital':
      return (
        <HospitalEntryComponent
          entry={entry}
          onEditEntry={onEditEntry}
          patientId={patientId}
          onDeleted={onDeleted}
        />
      );
    case 'OccupationalHealthcare':
      return (
        <OccupationalHealthcareEntryComponent
          entry={entry}
          onEditEntry={onEditEntry}
          patientId={patientId}
          onDeleted={onDeleted}
        />
      );
    case 'HealthCheck':
      return (
        <HealthCheckEntryComponent
          entry={entry}
          onEditEntry={onEditEntry}
          patientId={patientId}
          onDeleted={onDeleted}
        />
      );
    default:
      return assertNever(entry);
  }
};

export default EntryDetails;
