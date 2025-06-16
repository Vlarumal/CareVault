import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent
} from '@mui/lab';
import { useTheme, useMediaQuery, Typography } from '@mui/material';
import { Entry } from '../../types';
import EntryDetails from './EntryDetails';
import EntryErrorBoundary from './EntryErrorBoundary';

interface TimelineViewProps {
  entries: Entry[];
  getDiagnosisByCode: (code: string) => string;
  onEntryClick?: (entryId: string) => void;
  onEditEntry?: (entry: Entry) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  entries,
  getDiagnosisByCode,
  onEntryClick,
  onEditEntry
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const getDotColor = (type: string) => {
    switch(type) {
      case 'HealthCheck':
        return 'primary';
      case 'Hospital':
        return 'error';
      case 'OccupationalHealthcare':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const isXSmallScreen = useMediaQuery(theme.breakpoints.down('xs'));
  
  return (
    <div
      style={{
        overflowX: isXSmallScreen ? 'auto' : 'visible',
        minWidth: isXSmallScreen ? '600px' : 'auto'
      }}
      aria-label="Timeline container"
    >
      <Timeline
        position={isSmallScreen ? 'left' : 'alternate'}
        sx={{
          padding: 0,
          '& .MuiTimelineItem-root': {
            marginBottom: theme.spacing(2)
          }
        }}
        aria-label="Patient health entries timeline"
      >
        {sortedEntries.map((entry) => (
          <TimelineItem
            key={entry.id}
            aria-label={`Entry from ${new Date(entry.date).toLocaleDateString()}`}
            sx={{
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                transform: 'scale(1.02)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }
            }}
            onClick={() => onEntryClick?.(entry.id)}
          >
            <TimelineOppositeContent
              color="text.secondary"
              sx={{
                padding: '6px 16px',
                maxWidth: '120px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {new Date(entry.date).toLocaleDateString()}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot
                color={getDotColor(entry.type)}
                aria-label={`${entry.type} entry`}
                sx={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent
              sx={{
                py: theme.spacing(2),
                px: 2,
                minHeight: isXSmallScreen ? '120px' : 'auto'
              }}
            >
              <EntryErrorBoundary entry={entry}>
                <EntryDetails
                  entry={entry}
                  onEditEntry={() => onEditEntry?.(entry)}
                />
                {entry.diagnosisCodes && entry.diagnosisCodes.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Diagnoses:</strong>
                    <ul
                      style={{
                        marginTop: theme.spacing(0.5),
                        paddingLeft: theme.spacing(2.5),
                        listStyleType: 'none'
                      }}
                    >
                      {entry.diagnosisCodes.map((code) => (
                        <li key={code}>
                          <Typography variant="body2">
                            • {code} {getDiagnosisByCode(code)}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </EntryErrorBoundary>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  );
};

export default TimelineView;