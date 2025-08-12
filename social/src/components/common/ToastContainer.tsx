import React from 'react';
import { Snackbar, Box, Typography, IconButton } from '@mui/joy';
import { Close as CloseIcon } from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';

export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={5000}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          color={notification.type === 'error' ? 'danger' : 'success'}
          sx={{ 
            mt: 8 + (index * 7), // Stack multiple notifications
            zIndex: 9999,
          }}
          endDecorator={
            <IconButton
              size="sm"
              variant="soft"
              color={notification.type === 'error' ? 'danger' : 'success'}
              onClick={() => removeNotification(notification.id)}
            >
              <CloseIcon />
            </IconButton>
          }
        >
          <Box>
            <Typography level="body-sm" fontWeight="bold">
              {notification.title}
            </Typography>
            {notification.message && (
              <Typography level="body-xs">
                {notification.message}
              </Typography>
            )}
          </Box>
        </Snackbar>
      ))}
    </>
  );
};
