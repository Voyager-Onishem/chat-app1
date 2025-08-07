import React, { useState, useEffect } from 'react';
import { getConnectionStatus } from '../utils/connectionManager';
import { Box, Chip, Tooltip } from '@mui/joy';
import { WifiRounded, WifiOffRounded, SignalCellularAltRounded } from '@mui/icons-material';

interface ConnectionStatus {
  isConnected: boolean;
  lastCheck: Date;
  retryCount: number;
}

export const ConnectionStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastCheck: new Date(),
    retryCount: 0
  });

  useEffect(() => {
    const updateStatus = () => {
      try {
        setStatus(getConnectionStatus());
      } catch (error) {
        console.warn('Error updating connection status:', error);
      }
    };

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);
    updateStatus(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!status.isConnected) return 'danger';
    if (status.retryCount > 0) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (!status.isConnected) return <WifiOffRounded />;
    if (status.retryCount > 0) return <SignalCellularAltRounded />;
    return <WifiRounded />;
  };

  const getStatusText = () => {
    if (!status.isConnected) return 'Offline';
    if (status.retryCount > 0) return 'Reconnecting';
    return 'Online';
  };

  const getTooltipText = () => {
    const lastCheck = status.lastCheck.toLocaleTimeString();
    if (!status.isConnected) {
      return `Last check: ${lastCheck}\nRetry attempts: ${status.retryCount}`;
    }
    return `Last check: ${lastCheck}\nStatus: Connected`;
  };

  return (
    <Tooltip title={getTooltipText()} placement="bottom">
      <Chip
        size="sm"
        variant="soft"
        color={getStatusColor()}
        startDecorator={getStatusIcon()}
        sx={{
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          height: { xs: '28px', sm: '24px' },
          minWidth: { xs: '60px', sm: 'auto' },
          '& .MuiChip-label': {
            px: { xs: 0.5, sm: 1 },
          },
        }}
      >
        {getStatusText()}
      </Chip>
    </Tooltip>
  );
};