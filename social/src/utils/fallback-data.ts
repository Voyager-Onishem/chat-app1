/**
 * Centralized fallback data for when database queries fail
 */

export interface FallbackStats {
  totalUsers: number;
  totalConnections: number;
  totalJobs: number;
  totalEvents: number;
}

export const fallbackDashboardStats: FallbackStats = {
  totalUsers: 4,
  totalConnections: 3,
  totalJobs: 0,
  totalEvents: 0,
};

export const fallbackActivities = [
  {
    type: 'announcement' as const,
    title: 'Welcome to the Alumni Network',
    description: 'Connect with fellow alumni and explore opportunities',
    timestamp: new Date().toISOString(),
  }
];

export const fallbackConnections: any[] = [];

export const fallbackJobs: any[] = [];

export const fallbackEvents: any[] = [];

export const fallbackAnnouncements = [
  {
    id: 'fallback-1',
    title: 'Welcome to the Alumni Network',
    content: 'Connect with fellow alumni and explore opportunities',
    created_at: new Date().toISOString(),
    user_id: 'system',
  }
];

/**
 * Get safe fallback data based on the type of query
 */
export function getSafeFallbackData(queryType: string): unknown {
  switch (queryType) {
    case 'profiles':
      // This will be imported dynamically to avoid circular imports
      return [];
    case 'connections':
      return fallbackConnections;
    case 'jobs':
      return fallbackJobs;
    case 'events':
      return fallbackEvents;
    case 'announcements':
      return fallbackAnnouncements;
    case 'stats':
      return fallbackDashboardStats;
    case 'count':
      return 0;
    default:
      return null;
  }
}

/**
 * Provide contextual error messages based on error types
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error occurred';
  
  // Type guard for error-like objects
  const hasProperty = (obj: unknown, prop: string): boolean => {
    return typeof obj === 'object' && obj !== null && prop in obj;
  };

  // Network/Connection errors
  if (hasProperty(error, 'message') && typeof (error as { message: unknown }).message === 'string') {
    const errorMessage = (error as { message: string }).message;
    if (errorMessage.includes('fetch')) {
      return 'Network connection error. Please check your internet connection.';
    }
  }
  
  if (hasProperty(error, 'name') && (error as { name: unknown }).name === 'NetworkError') {
    return 'Network connection error. Please check your internet connection.';
  }
  
  // Database timeout errors
  const errorCode = hasProperty(error, 'code') ? (error as { code: unknown }).code : null;
  if (errorCode === '57014') {
    return 'Database query timed out. Using cached data.';
  }
  
  if (hasProperty(error, 'message') && typeof (error as { message: unknown }).message === 'string') {
    const errorMessage = (error as { message: string }).message;
    if (errorMessage.includes('timeout')) {
      return 'Database query timed out. Using cached data.';
    }
  }
  
  // Server errors (500 series)
  if (errorCode === '500') {
    return 'Server temporarily unavailable. Using offline data.';
  }
  
  if (hasProperty(error, 'status') && typeof (error as { status: unknown }).status === 'number') {
    const status = (error as { status: number }).status;
    if (status.toString().startsWith('5')) {
      return 'Server temporarily unavailable. Using offline data.';
    }
  }
  
  // Authentication/Permission errors
  if (errorCode && typeof errorCode === 'string' && errorCode.startsWith('42')) {
    return 'Access denied. You may need to log in again.';
  }
  
  if (hasProperty(error, 'message') && typeof (error as { message: unknown }).message === 'string') {
    const errorMessage = (error as { message: string }).message;
    if (errorMessage.includes('permission')) {
      return 'Access denied. You may need to log in again.';
    }
  }
  
  // Configuration errors
  if (errorCode === '54001') {
    return 'Server configuration issue. Using backup data.';
  }
  
  // Default error message
  if (error instanceof Error) {
    return error.message;
  }
  
  if (hasProperty(error, 'message') && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  
  return 'Database error occurred';
}