import { Box, Typography, Collapse, IconButton, Alert, Chip, Button, Divider } from '@mui/material';
import { VersionDiff } from '@shared/src/types/medicalTypes';
import { ConflictMarker } from '@shared/src/utils/diffUtils';
import { useState, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { diffWords } from 'diff';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface VersionDiffViewerProps {
  diff: VersionDiff;
  conflicts?: ConflictMarker[];
  onResolveConflict?: (path: string, resolution: 'current'|'incoming') => void;
}

const formatValue = (value: unknown) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const renderDiff = (oldVal: string, newVal: string) => {
  const diffResult = diffWords(oldVal, newVal);
  return diffResult.map((part, index) => (
    <span 
      key={index}
      style={{
        backgroundColor: part.added ? '#e6ffed' : part.removed ? '#ffebe9' : 'transparent',
        color: part.added ? '#24292e' : part.removed ? '#24292e' : 'inherit',
        padding: '0.1em 0.2em',
        borderRadius: '3px'
      }}
    >
      {part.value}
    </span>
  ));
};

const VersionDiffViewer = ({ diff, conflicts = [], onResolveConflict }: VersionDiffViewerProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  // Auto-expand first few diffs
  useEffect(() => {
    if (diff) {
      const keys = Object.keys(diff);
      const initialExpanded = keys.slice(0, 3).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setExpanded(initialExpanded);
    }
  }, [diff]);

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = (expand: boolean) => {
    if (!diff) return;
    setExpanded(Object.keys(diff).reduce((acc, key) => {
      acc[key] = expand;
      return acc;
    }, {} as Record<string, boolean>));
  };

  if (!diff) {
    return (
      <Box textAlign="center" py={4}>
        <Alert severity="error">Diff data could not be loaded</Alert>
      </Box>
    );
  }

  if (Object.keys(diff).length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Alert severity="info">No differences found between versions</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Version Comparison</Typography>
        <Box>
          <Button size="small" onClick={() => toggleAll(true)} sx={{ mr: 1 }}>Expand All</Button>
          <Button size="small" onClick={() => toggleAll(false)}>Collapse All</Button>
        </Box>
      </Box>
      
      {Object.entries(diff).map(([key, { oldValue, newValue }]) => {
        const oldValStr = formatValue(oldValue);
        const newValStr = formatValue(newValue);
        
        return (
          <Box key={key} mb={3}>
            <Box display="flex" alignItems="center">
              <IconButton size="small" onClick={() => toggleExpand(key)}>
                {expanded[key] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <Typography variant="subtitle2">{key}</Typography>
              {conflicts.some(c => c.path === key) && (
                <Chip
                  label="Conflict"
                  color="error"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            
            <Collapse in={expanded[key] !== false}>
              <Box display="flex" mt={1} sx={{ position: 'relative' }}>
                <Box flex={1} p={2} bgcolor="#f6f8fa" borderRadius={1}>
                  <Typography variant="caption" color="text.secondary">Previous Version</Typography>
                  <Typography variant="body2" component="div" sx={{ 
                    whiteSpace: 'pre-wrap',
                    mt: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}>
                    {typeof oldValue === 'string' ? 
                      renderDiff(oldValStr, newValStr) : 
                      <SyntaxHighlighter language="json" style={github}>
                        {oldValStr}
                      </SyntaxHighlighter>}
                  </Typography>
                </Box>
                
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                
                <Box flex={1} p={2} bgcolor="#f6f8fa" borderRadius={1}>
                  <Typography variant="caption" color="text.secondary">New Version</Typography>
                  <Typography variant="body2" component="div" sx={{ 
                    whiteSpace: 'pre-wrap',
                    mt: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}>
                    {typeof newValue === 'string' ? 
                      renderDiff(newValStr, oldValStr) : 
                      <SyntaxHighlighter language="json" style={github}>
                        {newValStr}
                      </SyntaxHighlighter>}
                  </Typography>
                </Box>
              </Box>
              
              {conflicts.some(c => c.path === key) && onResolveConflict && (
                <Box display="flex" gap={1} mt={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onResolveConflict(key, 'current')}
                  >
                    Keep Current
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onResolveConflict(key, 'incoming')}
                  >
                    Accept Incoming
                  </Button>
                </Box>
              )}
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
};

export default VersionDiffViewer;