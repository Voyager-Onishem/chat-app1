import { supabase } from '../supabase-client';
import { robustQuery } from '../utils/robust-query';
import type { UserProfile, Connection, Job, Event, Announcement } from '../types';

export interface DataFetchOptions {
  fallbackData?: unknown;
  timeout?: number;
  retries?: number;
  enabled?: boolean;
}

/**
 * Enhanced data service with robust error handling and fallbacks
 */
export const dataService = {
  /**
   * Fetch user profiles with enhanced error handling
   */
  async getProfiles(options: DataFetchOptions = {}): Promise<UserProfile[]> {
    const { fallbackData = [], ...queryOptions } = options;
    
    try {
      const result = await robustQuery(
        supabase
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true }),
        { ...queryOptions, fallbackData }
      );
      
      return result.data || fallbackData;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return fallbackData;
    }
  },

  /**
   * Fetch user connections with enhanced error handling
   */
  async getConnections(userId: string, options: DataFetchOptions = {}): Promise<Connection[]> {
    const { fallbackData = [], ...queryOptions } = options;
    
    if (!userId) {
      console.warn('No user ID provided for connections fetch');
      return fallbackData;
    }

    try {
      const result = await robustQuery(
        supabase
          .from('connections')
          .select(`
            *,
            requester:profiles!connections_requester_id_fkey(*),
            addressee:profiles!connections_addressee_id_fkey(*)
          `)
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false }),
        { ...queryOptions, fallbackData }
      );
      
      return result.data || fallbackData;
    } catch (error) {
      console.error('Error fetching connections:', error);
      return fallbackData;
    }
  },

  /**
   * Fetch jobs with enhanced error handling
   */
  async getJobs(options: DataFetchOptions = {}): Promise<Job[]> {
    const { fallbackData = [], ...queryOptions } = options;
    
    try {
      // First fetch jobs
      const jobsResult = await robustQuery(
        supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false }),
        { ...queryOptions, fallbackData }
      );

      const jobs = jobsResult.data || fallbackData;

      if (jobs.length === 0) {
        return jobs;
      }

      // Then fetch poster profiles
      const posterIds = [...new Set((jobs as Job[]).map(job => job.posted_by_user_id))];
      const profilesResult = await robustQuery(
        supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url, role')
          .in('user_id', posterIds),
        { timeout: 5000, retries: 1, fallbackData: [] }
      );

      const profiles = profilesResult.data || [];
      const profilesMap = new Map((profiles as UserProfile[]).map(p => [p.user_id, p]));

      // Combine jobs with poster info
      return (jobs as Job[]).map(job => ({
        ...job,
        posted_by: profilesMap.get(job.posted_by_user_id),
      }));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return fallbackData;
    }
  },

  /**
   * Fetch events with enhanced error handling
   */
  async getEvents(options: DataFetchOptions = {}): Promise<Event[]> {
    const { fallbackData = [], ...queryOptions } = options;
    
    try {
      // First fetch events
      const eventsResult = await robustQuery(
        supabase
          .from('events')
          .select('*')
          .order('event_time', { ascending: true }),
        { ...queryOptions, fallbackData }
      );

      const events = eventsResult.data || fallbackData;

      if (events.length === 0) {
        return events;
      }

      // Then fetch creator profiles and RSVPs
      const creatorIds = [...new Set((events as Event[]).map(event => event.created_by_user_id))];
      const eventIds = (events as Event[]).map(event => event.id);

      const [profilesResult, rsvpsResult] = await Promise.all([
        robustQuery(
          supabase
            .from('profiles')
            .select('user_id, full_name, profile_picture_url, role')
            .in('user_id', creatorIds),
          { timeout: 5000, retries: 1, fallbackData: [] }
        ),
        robustQuery(
          supabase
            .from('event_rsvps')
            .select('*')
            .in('event_id', eventIds),
          { timeout: 5000, retries: 1, fallbackData: [] }
        ),
      ]);

      const profiles = profilesResult.data || [];
      const rsvps = rsvpsResult.data || [];

      const profilesMap = new Map((profiles as UserProfile[]).map(p => [p.user_id, p]));
      const rsvpsByEvent = new Map<string, unknown[]>();

      // Group RSVPs by event
      (rsvps as Array<{ event_id: string }>).forEach(rsvp => {
        if (!rsvpsByEvent.has(rsvp.event_id)) {
          rsvpsByEvent.set(rsvp.event_id, []);
        }
        rsvpsByEvent.get(rsvp.event_id)?.push(rsvp);
      });

      // Combine events with creator and RSVP info
      return (events as Event[]).map(event => ({
        ...event,
        created_by: profilesMap.get(event.created_by_user_id),
        rsvps: rsvpsByEvent.get(event.id) || [],
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      return fallbackData;
    }
  },

  /**
   * Fetch announcements with enhanced error handling
   */
  async getAnnouncements(options: DataFetchOptions = {}): Promise<Announcement[]> {
    const { fallbackData = [], ...queryOptions } = options;
    
    try {
      const result = await robustQuery(
        supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false }),
        { ...queryOptions, fallbackData }
      );
      
      return result.data || fallbackData;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return fallbackData;
    }
  },

  /**
   * Fetch dashboard statistics
   */
  async getDashboardStats(options: DataFetchOptions = {}) {
    const { fallbackData = { totalUsers: 0, totalConnections: 0, totalJobs: 0, totalEvents: 0 } } = options;
    
    try {
      const [usersCount, connectionsCount, jobsCount, eventsCount] = await Promise.all([
        robustQuery(
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          { timeout: 5000, retries: 1, fallbackData: { count: 0 } }
        ),
        robustQuery(
          supabase.from('connections').select('*', { count: 'exact', head: true }),
          { timeout: 5000, retries: 1, fallbackData: { count: 0 } }
        ),
        robustQuery(
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          { timeout: 5000, retries: 1, fallbackData: { count: 0 } }
        ),
        robustQuery(
          supabase.from('events').select('*', { count: 'exact', head: true }),
          { timeout: 5000, retries: 1, fallbackData: { count: 0 } }
        ),
      ]);

      return {
        totalUsers: usersCount.data?.count || 0,
        totalConnections: connectionsCount.data?.count || 0,
        totalJobs: jobsCount.data?.count || 0,
        totalEvents: eventsCount.data?.count || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return fallbackData;
    }
  },

  /**
   * Test connection to database
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await robustQuery(
        supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1),
        { timeout: 3000, retries: 1, fallbackData: { count: 0 } }
      );
      return result.data?.count !== undefined;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },
};

export default dataService;
