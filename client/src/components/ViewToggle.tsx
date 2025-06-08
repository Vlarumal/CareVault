import React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from '@mui/icons-material/GridView';
import ListIcon from '@mui/icons-material/List';

interface ViewToggleProps {
  value: 'list' | 'grid';
  onChange: (mode: 'list' | 'grid') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, mode) => mode && onChange(mode)}
      aria-label="view mode"
      sx={{ ml: 2 }}
    >
      <ToggleButton value="list" aria-label="list view">
        <ListIcon sx={{ mr: 1 }} /> List
      </ToggleButton>
      <ToggleButton value="grid" aria-label="grid view">
        <GridViewIcon sx={{ mr: 1 }} /> Grid
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ViewToggle;