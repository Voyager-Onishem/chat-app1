import { supabase } from '../supabase';
import type { 
  UserProfile, 
  Connection, 
  Job, 
  Event, 
  Announcement, 
  Message,
  Conversation 
} from '../types';

// Base API response type
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Enhanced error handling
class ApiError extends Error {
  code?: string;
  details?: unknown;
  
  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// Service class with proper error handling and type safety
export class ApiService {
  // Profile operations
  static async getProfiles(): Promise<ApiResponse<UserProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data || [], error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  static async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  // Connection operations
  static async getConnections(userId: string): Promise<ApiResponse<Connection[]>> {
    try {
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
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data || [], error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  static async createConnection(requesterId: string, addresseeId: string): Promise<ApiResponse<Connection>> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  // Job operations
  static async getJobs(): Promise<ApiResponse<Job[]>> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          posted_by:profiles(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data || [], error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  static async createJob(job: Omit<Job, 'id' | 'created_at'>): Promise<ApiResponse<Job>> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert(job)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  // Event operations
  static async getEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          created_by:profiles(*)
        `)
        .order('event_time', { ascending: true });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data || [], error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  // Announcement operations
  static async getAnnouncements(): Promise<ApiResponse<Announcement[]>> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          created_by:profiles(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data || [], error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  // Search operations
  static async searchProfiles(query: string): Promise<ApiResponse<UserProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,company.ilike.%${query}%,major.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data || [], error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }

  // Health check
  static async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        return { data: null, error: error.message };
      }

      return { 
        data: { 
          status: 'healthy', 
          timestamp: new Date().toISOString() 
        }, 
        error: null 
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error };
    }
  }
}
