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
export function getSafeFallbackData(queryType: string): any {
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
export function getErrorMessage(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  // Network/Connection errors
  if (error.message?.includes('fetch') || error.name === 'NetworkError') {
    return 'Network connection error. Please check your internet connection.';
  }
  
  // Database timeout errors
  if (error.code === '57014' || error.message?.includes('timeout')) {
    return 'Database query timed out. Using cached data.';
  }
  
  // Server errors (500 series)
  if (error.code === '500' || error.status?.toString().startsWith('5')) {
    return 'Server temporarily unavailable. Using offline data.';
  }
  
  // Authentication/Permission errors
  if (error.code?.startsWith('42') || error.message?.includes('permission')) {
    return 'Access denied. You may need to log in again.';
  }
  
  // Configuration errors
  if (error.code === '54001') {
    return 'Server configuration issue. Using backup data.';
  }
  
  return error.message || 'Database error occurred';
}