import { OccupationalHealthcareEntry } from '../../types';
import { getIcon, renderDiagnosisCodes } from '../../utils';
import { getEntryDescription } from '../../utils/entryUtils';
import { Button } from '@mui/material';
import DeleteEntryButton from '../DeleteEntryButton';

const OccupationalHealthcareEntryComponent: React.FC<{
  patientId: string;
  entry: OccupationalHealthcareEntry;
  onEditEntry: (entry: OccupationalHealthcareEntry) => void;
  onDeleted: () => void;
}> = ({ patientId, entry, onEditEntry, onDeleted }) => {
  return (
    <section key={entry.id}>
      <div>
        {entry.date} {getIcon(entry.type)} <i>{entry.employerName}</i>
      </div>
      <div>
        <em>{entry.description}</em>
      </div>
      <div>diagnose by {entry.specialist}</div>
      {entry.sickLeave && (
        <div>
          Sick leave: {entry.sickLeave?.startDate} –{' '}
          {entry.sickLeave?.endDate}
        </div>
      )}
      {renderDiagnosisCodes(entry.diagnosisCodes)}
      <div>
        <Button
          variant="outlined"
          color="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onEditEntry(entry);
          }}
          sx={{ mt: 1 }}
        >
          Edit
        </Button>
        <DeleteEntryButton
          patientId={patientId}
          entryId={entry.id}
          entryDescription={getEntryDescription(entry)}
          onDeleted={onDeleted}
        />
      </div>
    </section>
  );
};

export default OccupationalHealthcareEntryComponent;
