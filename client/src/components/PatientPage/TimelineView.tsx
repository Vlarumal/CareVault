import React from 'react';
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent, TimelineOppositeContent } from '@mui/lab';
import { Entry } from '../../types';
import EntryDetails from './EntryDetails';

interface TimelineViewProps {
  entries: Entry[];
  getDiagnosisByCode: (code: string) => string;
}

const TimelineView: React.FC<TimelineViewProps> = ({ entries, getDiagnosisByCode }) => {
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Timeline position="alternate" sx={{ padding: 0 }}>
      {sortedEntries.map((entry) => (
        <TimelineItem key={entry.id}>
          <TimelineOppositeContent
            color="text.secondary"
            sx={{ padding: '6px 16px', maxWidth: '120px' }}
          >
            {new Date(entry.date).toLocaleDateString()}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="primary" />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent sx={{ py: '12px', px: 2 }}>
            <EntryDetails entry={entry} />
            {entry.diagnosisCodes && entry.diagnosisCodes.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <strong>Diagnoses:</strong>
                <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                  {entry.diagnosisCodes.map((code) => (
                    <li key={code}>
                      {code} {getDiagnosisByCode(code)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default TimelineView;