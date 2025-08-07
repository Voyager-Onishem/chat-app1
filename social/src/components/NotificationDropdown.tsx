import { useNotifications } from '../context/NotificationContext';
import { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/joy';
import {
  NotificationsRounded,
  CheckCircleRounded,
  CancelRounded,
  PersonAddRounded,
  MessageRounded,
  AnnouncementRounded,
} from '@mui/icons-material';

// Helper function to format time ago
const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, handleConnectionAction } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setError(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setError(null);
  };

  const handleConnectionAction = async (notificationId: string, action: 'accept' | 'reject') => {
    try {
      setError(null);
      setProcessingAction(notificationId);

      await handleConnectionAction(notificationId, action);
      
      // Show success message
      console.log(`Connection ${action}ed successfully`);
    } catch (error) {
      console.error(`Error ${action}ing connection:`, error);
      setError(`Failed to ${action} connection. Please try again.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return <PersonAddRounded color="primary" />;
      case 'connection_accepted':
        return <CheckCircleRounded color="success" />;
      case 'connection_rejected':
        return <CancelRounded color="danger" />;
      case 'message':
        return <MessageRounded color="info" />;
      case 'announcement':
        return <AnnouncementRounded color="warning" />;
      default:
        return <NotificationsRounded />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'connection_request':
        return 'primary';
      case 'connection_accepted':
        return 'success';
      case 'connection_rejected':
        return 'danger';
      case 'message':
        return 'info';
      case 'announcement':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <>
      <IconButton
        size="sm"
        variant="plain"
        color="neutral"
        onClick={handleClick}
        aria-controls={open ? 'notifications-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label="notifications"
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="danger" max={99}>
          <NotificationsRounded />
        </Badge>
      </IconButton>

      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        placement="bottom-end"
        sx={{
          width: 400,
          maxHeight: 500,
          overflow: 'auto',
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography level="title-md">Notifications</Typography>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="plain"
                color="primary"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </Box>
          <Divider />
        </Box>

        {error && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Alert color="danger" size="sm">
              {error}
            </Alert>
          </Box>
        )}

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography level="body-sm" color="neutral">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                sx={{
                  display: 'block',
                  backgroundColor: notification.read ? 'transparent' : 'background.level1',
                  '&:hover': {
                    backgroundColor: 'background.level2',
                  },
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ mt: 0.5 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography level="body-sm" fontWeight="bold" noWrap>
                        {notification.title}
                      </Typography>
                      <Typography level="body-xs" color="neutral" sx={{ ml: 1, flexShrink: 0 }}>
                        {formatTimeAgo(notification.created_at)}
                      </Typography>
                    </Box>
                    <Typography level="body-sm" color="neutral" sx={{ mb: 1 }}>
                      {notification.message}
                    </Typography>

                    {/* Connection request actions */}
                    {notification.type === 'connection_request' && !notification.read && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          size="sm"
                          color="success"
                          variant="soft"
                          startDecorator={
                            processingAction === notification.id ? (
                              <CircularProgress size="sm" />
                            ) : (
                              <CheckCircleRounded />
                            )
                          }
                          disabled={processingAction === notification.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnectionAction(notification.id, 'accept');
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="soft"
                          startDecorator={
                            processingAction === notification.id ? (
                              <CircularProgress size="sm" />
                            ) : (
                              <CancelRounded />
                            )
                          }
                          disabled={processingAction === notification.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnectionAction(notification.id, 'reject');
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}

                    {/* Connection status indicators */}
                    {notification.type === 'connection_accepted' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <CheckCircleRounded color="success" fontSize="small" />
                        <Typography level="body-xs" color="success">
                          Connection accepted
                        </Typography>
                      </Box>
                    )}

                    {notification.type === 'connection_rejected' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <CancelRounded color="danger" fontSize="small" />
                        <Typography level="body-xs" color="danger">
                          Connection rejected
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
      </Menu>
    </>
  );
}; 