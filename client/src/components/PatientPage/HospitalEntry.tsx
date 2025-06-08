import React from 'react';
import { HospitalEntry } from '../../types';
import { getIcon, renderDiagnosisCodes } from '../../utils';

const HospitalEntryComponent: React.FC<{ entry: HospitalEntry }> = ({
  entry,
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
    </section>
  );
};

export default HospitalEntryComponent;
