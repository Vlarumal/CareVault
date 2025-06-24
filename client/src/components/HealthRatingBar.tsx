import React from 'react';
import { Tooltip, useTheme } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
type BarProps = {
  rating: number | null;
  showText?: boolean;
};

const HEALTHBAR_TEXTS = [
  "The patient is in great shape",
  "The patient has a low risk of getting sick",
  "The patient has a high risk of getting sick",
  "The patient has a diagnosed condition",
];

// Color scheme matching patient page entries
const HEALTHBAR_COLORS = [
  '#4caf50', // Green (success) - rating 0
  '#ffeb3b', // Yellow - rating 1
  '#ff9800', // Orange (warning) - rating 2
  '#f44336', // Red (error) - rating 3
];

const HealthRatingBar = React.forwardRef<HTMLDivElement, BarProps>(
  ({ rating, showText = false }, ref) => {
    const theme = useTheme();
    
    if (rating === null) {
      return (
        <Tooltip
          title="Health rating is only available for patients with HealthCheck entries"
          arrow
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            N/A <HelpOutlineIcon fontSize="small" style={{ marginLeft: 4 }} />
          </span>
        </Tooltip>
      );
    }
    
    const heartCount = 4 - rating;
    const heartColor = rating < 4 ? HEALTHBAR_COLORS[rating] : theme.palette.error.main;
    
    const hearts = Array.from({ length: 4 }, (_, i) => {
      const isFilled = i < heartCount;
      return (
        <Favorite
          key={i}
          fontSize="inherit"
          sx={{
            color: isFilled ? heartColor : 'transparent',
            marginRight: 1,
            stroke: theme.palette.text.secondary,
            strokeWidth: isFilled ? 0 : 1,
            transition: 'color 0.3s ease, stroke-width 0.3s ease'
          }}
          aria-hidden={!isFilled}
        />
      );
    });

    return (
      <Tooltip
        title={HEALTHBAR_TEXTS[rating]}
        arrow
        enterTouchDelay={0}
        leaveTouchDelay={3000}
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: 'background.paper',
              color: 'text.primary',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 1,
            }
          }
        }}
      >
        <div
          ref={ref}
          className="health-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            fontSize: '1.2rem',
            animation: rating !== null ? 'pulse 0.5s ease' : 'none'
          }}
          role="img"
          aria-label={`Health rating: ${HEALTHBAR_TEXTS[rating]}`}
        >
          <span aria-hidden="true">
            {hearts}
          </span>
          {showText ? (
            <p style={{ marginLeft: 1 }} data-testid="health-rating-text">
              {HEALTHBAR_TEXTS[rating]}
            </p>
          ) : null}
        </div>
      </Tooltip>
    );
  }
);

HealthRatingBar.displayName = 'HealthRatingBar';

export default HealthRatingBar;
