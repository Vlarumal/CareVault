import { useEffect, useState } from 'react';
import { Modal, Button, Typography, Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { TokenManager } from '../utils/tokenUtils';
import { useNotification } from '../services/notificationService';
import { SESSION_WARNING_DURATION, SESSION_CHECK_INTERVAL, SESSION_EXPIRATION_BUFFER } from '../constants';
import { jwtDecode } from 'jwt-decode';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const calculateInitialTimeLeft = (): number => {
  const token = TokenManager.getAccessToken();
  if (!token) return SESSION_WARNING_DURATION;

  try {
    const { exp } = jwtDecode(token);
    if (!exp) return SESSION_WARNING_DURATION;
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = exp - now - SESSION_EXPIRATION_BUFFER;
    return Math.max(0, timeLeft);
  } catch {
    return SESSION_WARNING_DURATION;
  }
};

const SessionTimer = () => {
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(calculateInitialTimeLeft());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTimeLeft = prev - 1;
        if (newTimeLeft <= SESSION_WARNING_DURATION && !open) {
          setOpen(true);
        }
        return newTimeLeft;
      });
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(timer);
  }, [open]);

  const handleStayLoggedIn = async () => {
    setIsRefreshing(true);
    try {
      await TokenManager.refreshAccessToken();
      setTimeLeft(calculateInitialTimeLeft());
      setOpen(false);
      showNotification('Session extended successfully', 'success');
    } catch (error) {
      showNotification('Failed to extend session', 'error');
      console.error('Session extension failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const authContext = useAuth();

  const handleLogout = async () => {
    try {
      authContext.logout();
      setOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2
      }}>
        <Typography variant="h6" gutterBottom>
          Session About to Expire
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Your session will expire in {formatTime(timeLeft)}.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={handleLogout}>
            Log Out
          </Button>
          <Button
            variant="contained"
            onClick={handleStayLoggedIn}
            disabled={isRefreshing}
            startIcon={isRefreshing ? <CircularProgress size={20} /> : null}
          >
            {isRefreshing ? 'Extending...' : 'Stay Logged In'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SessionTimer;