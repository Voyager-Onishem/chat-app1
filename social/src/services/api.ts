import { supabase } from '../supabase-client';
import { DatabaseHelpers, SupabaseUtils } from '../utils/supabase-helpers';
import type { UserProfile, Connection, Job, Event, Announcement, QueryResult } from '../types';

// Create database helpers instance
const dbHelpers = new DatabaseHelpers(supabase);

/**
 * Service for user profile operations with type safety
 */
export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const result = await dbHelpers.safeSingle<UserProfile>('profiles', { user_id: userId });
    
    if (result.error && !SupabaseUtils.isNotFoundError(result.error)) {
      throw new Error(result.error.message);
    }
    
    return result.data;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const result = await dbHelpers.safeUpdate<UserProfile>('profiles', updates, { user_id: userId });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
      throw new Error('Profile not found');
    }
    
    return Array.isArray(result.data) ? result.data[0] : result.data;
  },

  async getProfiles(filters?: {
    role?: string;
    location?: string;
    company?: string;
    graduationYearRange?: [number, number];
  }): Promise<UserProfile[]> {
    const queryFilters: Record<string, unknown> = {};
    
    if (filters?.role && filters.role !== 'all') {
      queryFilters.role = filters.role;
    }
    
    if (filters?.location && filters.location !== 'all') {
      queryFilters.location = filters.location;
    }
    
    const result = await dbHelpers.safeSelect<UserProfile>('profiles', '*', queryFilters);
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return result.data || [];
  },

  async searchProfiles(searchQuery: string): Promise<UserProfile[]> {
    const result = await dbHelpers.safeSelect<UserProfile>(
      'profiles',
      '*',
      {} // No filters for search, will need to implement search logic
    );
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    // Client-side filtering for now (could be optimized with database full-text search)
    const profiles = result.data || [];
    return profiles.filter(profile => 
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.major?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },
};

/**
 * Service for connection operations
 */
export const connectionService = {
  async getConnections(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(*),
        addressee:profiles!connections_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPendingRequests(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(*),
        addressee:profiles!connections_addressee_id_fkey(*)
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async sendConnectionRequest(requesterId: string, addresseeId: string): Promise<Connection> {
    const { data, error } = await supabase
      .from('connections')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async respondToConnection(requesterId: string, addresseeId: string, status: 'accepted' | 'blocked'): Promise<Connection> {
    const { data, error } = await supabase
      .from('connections')
      .update({ status })
      .eq('requester_id', requesterId)
      .eq('addressee_id', addresseeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * Service for job operations
 */
export const jobService = {
  async getJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        posted_by:profiles!jobs_posted_by_user_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createJob(jobData: Omit<Job, 'id' | 'created_at'>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select(`
        *,
        posted_by:profiles!jobs_posted_by_user_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteJob(jobId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('posted_by_user_id', userId);

    if (error) throw error;
  },
};

/**
 * Service for event operations
 */
export const eventService = {
  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        created_by:profiles!events_created_by_user_id_fkey(*),
        rsvps(user_id, status)
      `)
      .order('event_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'rsvps'>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select(`
        *,
        created_by:profiles!events_created_by_user_id_fkey(*),
        rsvps(user_id, status)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async rsvpToEvent(eventId: string, userId: string, status: 'attending' | 'interested' | 'not_attending'): Promise<void> {
    const { error } = await supabase
      .from('event_rsvps')
      .upsert({
        event_id: eventId,
        user_id: userId,
        status,
      });

    if (error) throw error;
  },

  async deleteEvent(eventId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('created_by_user_id', userId);

    if (error) throw error;
  },
};

/**
 * Service for announcement operations
 */
export const announcementService = {
  async getAnnouncements(): Promise<Announcement[]> {
    // First get announcements
    const { data: announcementsData, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (announcementsError) throw announcementsError;

    if (!announcementsData || announcementsData.length === 0) {
      return [];
    }

    // Get user IDs to fetch profiles
    const userIds = announcementsData.map((a: any) => a.author_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    // Combine data
    return announcementsData.map((announcement: any) => ({
      ...announcement,
      author: profilesData?.find((p: any) => p.user_id === announcement.author_id) || undefined
    }));
  },

  async createAnnouncement(announcementData: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcementData)
      .select('*')
      .single();

    if (error) throw error;
    
    // Fetch the author profile separately
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.author_id)
      .single();
    
    return {
      ...data,
      author: profileData || undefined
    };
  },

  async deleteAnnouncement(announcementId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
