import { OccupationalHealthcareEntry } from '../../types';
import { getIcon, renderDiagnosisCodes } from '../../utils';
import { Button } from '@mui/material';

const OccupationalHealthcareEntryComponent: React.FC<{
  entry: OccupationalHealthcareEntry;
  onEditEntry: (entry: OccupationalHealthcareEntry) => void;
}> = ({ entry, onEditEntry }) => {
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

export default OccupationalHealthcareEntryComponent;
