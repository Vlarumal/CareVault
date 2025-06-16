import { HealthCheckEntry } from '../../types';
import { getIcon, renderDiagnosisCodes } from '../../utils';
import { Button } from '@mui/material';

const HealthCheckEntryComponent: React.FC<{
  entry: HealthCheckEntry;
  onEditEntry: (entry: HealthCheckEntry) => void;
}> = ({ entry, onEditEntry }) => {
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
    </section>
  );
};

export default HealthCheckEntryComponent;
