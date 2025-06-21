import React from 'react';
import { HospitalEntry } from '../../types';
import { getIcon, renderDiagnosisCodes } from '../../utils';
import { getEntryDescription } from '../../utils/entryUtils';
import { Button } from '@mui/material';
import DeleteEntryButton from '../DeleteEntryButton';

const HospitalEntryComponent: React.FC<{
  patientId: string;
  entry: HospitalEntry;
  onEditEntry: (entry: HospitalEntry) => void;
  onDeleted: () => void;
}> = ({
  patientId,
  entry,
  onEditEntry,
  onDeleted
}) => {
  return (
    <section key={entry.id}>
      <div>
        {entry.date} {getIcon(entry.type)}
      </div>
      <div>
        <em>{entry.description}</em>
      </div>
      <div>diagnose by {entry.specialist}</div>
      <div>discharged {entry.discharge.date} {entry.discharge.criteria}</div>
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

export default HospitalEntryComponent;
