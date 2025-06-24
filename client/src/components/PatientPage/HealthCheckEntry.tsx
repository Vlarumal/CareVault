import { HealthCheckEntry } from '../../types';
import { getIcon, renderDiagnosisCodes } from '../../utils';
import { getEntryDescription } from '../../utils/entryUtils';
import { Button } from '@mui/material';
import DeleteEntryButton from '../DeleteEntryButton';

const HealthCheckEntryComponent: React.FC<{
  patientId: string;
  entry: HealthCheckEntry;
  onEditEntry: (entry: HealthCheckEntry) => void;
  onDeleted: () => void;
}> = ({ patientId, entry, onEditEntry, onDeleted }) => {
  return (
    <section key={entry.id}>
      <div>
        {entry.date} {getIcon(entry.type)}
      </div>
      <div>
        <em>{entry.description}</em>
      </div>
      <div>{getIcon(entry.healthCheckRating)}</div>
      <div>diagnose by {entry.specialist}</div>
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
          entryTitle={`${entry.type} entry on ${entry.date}`}
          entryDescription={getEntryDescription(entry)}
          onDeleted={onDeleted}
        />
      </div>
    </section>
  );
};

export default HealthCheckEntryComponent;
