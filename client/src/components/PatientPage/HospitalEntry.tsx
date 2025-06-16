import React from 'react';
import { HospitalEntry } from '../../types';
import { getIcon, renderDiagnosisCodes } from '../../utils';
import { Button } from '@mui/material';

const HospitalEntryComponent: React.FC<{
  entry: HospitalEntry;
  onEditEntry: (entry: HospitalEntry) => void;
}> = ({
  entry,
  onEditEntry
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

export default HospitalEntryComponent;
