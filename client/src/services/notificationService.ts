import { AlertColor } from '@mui/material';
import { useState } from 'react';

interface Notification {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = (message: string, severity: AlertColor = 'info') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return {
    notification,
    showNotification,
    closeNotification,
  };
};