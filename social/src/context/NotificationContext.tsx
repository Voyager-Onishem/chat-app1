import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert, IconButton, Box, Snackbar } from '@mui/joy';
import { Close as CloseIcon } from '@mui/icons-material';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastNotificationContextType {
  notifications: ToastNotification[];
  addNotification: (notification: Omit<ToastNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  success: (message: string, title?: string, options?: Partial<ToastNotification>) => void;
  error: (message: string, title?: string, options?: Partial<ToastNotification>) => void;
  warning: (message: string, title?: string, options?: Partial<ToastNotification>) => void;
  info: (message: string, title?: string, options?: Partial<ToastNotification>) => void;
}

const ToastNotificationContext = createContext<ToastNotificationContextType | undefined>(undefined);

interface ToastNotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export const ToastNotificationProvider: React.FC<ToastNotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
}) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: ToastNotification = {
      ...notification,
      id,
      duration: notification.duration ?? defaultDuration,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Keep only the most recent notifications
      return updated.slice(0, maxNotifications);
    });

    // Auto-remove notification after duration (if not persistent)
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, [maxNotifications, defaultDuration]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback((message: string, title?: string, options?: Partial<ToastNotification>) => {
    addNotification({ ...options, type: 'success', message, title });
  }, [addNotification]);

  const error = useCallback((message: string, title?: string, options?: Partial<ToastNotification>) => {
    addNotification({ ...options, type: 'error', message, title, persistent: true });
  }, [addNotification]);

  const warning = useCallback((message: string, title?: string, options?: Partial<ToastNotification>) => {
    addNotification({ ...options, type: 'warning', message, title });
  }, [addNotification]);

  const info = useCallback((message: string, title?: string, options?: Partial<ToastNotification>) => {
    addNotification({ ...options, type: 'info', message, title });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastNotificationContext.Provider value={value}>
      {children}
      <ToastNotificationContainer />
    </ToastNotificationContext.Provider>
  );
};

const ToastNotificationContainer: React.FC = () => {
  const context = useContext(ToastNotificationContext);
  if (!context) return null;

  const { notifications, removeNotification } = context;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1400,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: '400px',
        pointerEvents: 'none',
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          variant="soft"
          color={notification.type === 'error' ? 'danger' : notification.type as any}
          sx={{ pointerEvents: 'auto' }}
          endDecorator={
            <IconButton
              size="sm"
              variant="soft"
              color={notification.type === 'error' ? 'danger' : notification.type as any}
              onClick={() => removeNotification(notification.id)}
            >
              <CloseIcon />
            </IconButton>
          }
        >
          <Box>
            {notification.title && (
              <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {notification.title}
              </Box>
            )}
            <Box>{notification.message}</Box>
          </Box>
        </Snackbar>
      ))}
    </Box>
  );
};

export const useNotifications = (): ToastNotificationContextType => {
  const context = useContext(ToastNotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a ToastNotificationProvider');
  }
  return context;
};
