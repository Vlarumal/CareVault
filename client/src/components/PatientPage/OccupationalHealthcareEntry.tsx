import { OccupationalHealthcareEntry } from '../../types';
import { getIcon } from '../../utils';

const OccupationalHealthcareEntryComponent: React.FC<{
  entry: OccupationalHealthcareEntry;
}> = ({ entry }) => {
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
    </section>
  );
};

export default OccupationalHealthcareEntryComponent;
