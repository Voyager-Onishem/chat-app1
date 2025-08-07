import React from 'react';
import { Box, CircularProgress, Typography, Card } from '@mui/joy';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...' 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4,
      }}
    >
      <CircularProgress size={size} />
      <Typography level="body-sm" color="neutral">
        {text}
      </Typography>
    </Box>
  );
};

interface LoadingCardProps {
  height?: number | string;
  text?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  height = 200, 
  text = 'Loading...' 
}) => {
  return (
    <Card
      sx={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography level="body-sm" color="neutral">
        {text}
      </Typography>
    </Card>
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  variant = 'text',
}) => {
  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return '50%';
      case 'rectangular':
        return 4;
      case 'text':
      default:
        return 4;
    }
  };

  return (
    <Box
      sx={{
        width,
        height,
        backgroundColor: 'var(--joy-palette-neutral-100)',
        borderRadius: getBorderRadius(),
        animation: 'pulse 1.5s ease-in-out infinite',
        '@keyframes pulse': {
          '0%': {
            opacity: 1,
          },
          '50%': {
            opacity: 0.4,
          },
          '100%': {
            opacity: 1,
          },
        },
      }}
    />
  );
};

interface ProfileCardSkeletonProps {
  count?: number;
}

export const ProfileCardSkeleton: React.FC<ProfileCardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Skeleton variant="circular" width={60} height={60} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="70%" height={24} />
              <Skeleton width="50%" height={16} />
            </Box>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Skeleton width="100%" height={16} />
            <Skeleton width="80%" height={16} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Skeleton width={60} height={24} />
            <Skeleton width={80} height={24} />
            <Skeleton width={70} height={24} />
          </Box>
        </Card>
      ))}
    </>
  );
};

interface ListSkeletonProps {
  count?: number;
  height?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 5, height = 60 }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            height,
          }}
        >
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={14} />
          </Box>
          <Skeleton width={80} height={32} />
        </Box>
      ))}
    </Box>
  );
};

export default LoadingSpinner;
