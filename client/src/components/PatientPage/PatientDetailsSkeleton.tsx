import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

const PatientDetailsSkeleton: React.FC = () => {
  return (
    <Stack spacing={3}>
      <Box display="flex" alignItems="center" gap={2}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={200} height={40} />
      </Box>
      
      <Box>
        <Skeleton variant="text" width="60%" height={30} />
        <Skeleton variant="text" width="40%" height={30} />
        <Skeleton variant="text" width="50%" height={30} />
      </Box>
      
      <Box>
        <Skeleton variant="text" width={100} height={40} sx={{ mb: 1 }} />
        {[...Array(3)].map((_, i) => (
          <Skeleton 
            key={i} 
            variant="rectangular" 
            width="100%" 
            height={80} 
            sx={{ borderRadius: 2, mb: 2 }}
          />
        ))}
      </Box>
    </Stack>
  );
};

export default PatientDetailsSkeleton;