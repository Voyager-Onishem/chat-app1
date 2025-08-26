import { useQuery as useReactQuery, useMutation as useReactMutation, QueryKey } from '@tanstack/react-query';
import { supabase } from '../supabase-client';
import type { UserProfile, Connection, Job, Event, Announcement } from '../types';

// Unified error class
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

// Query keys factory for consistency
export const queryKeys = {
  profiles: ['profiles'] as const,
  profile: (id: string) => ['profiles', id] as const,
  connections: (userId: string) => ['connections', userId] as const,
  jobs: ['jobs'] as const,
  events: ['events'] as const,
  announcements: ['announcements'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
};

// Profiles
export const useProfiles = () => {
  return useReactQuery({
    queryKey: queryKeys.profiles,
    queryFn: async (): Promise<UserProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw new ApiError(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useProfile = (userId: string) => {
  return useReactQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: async (): Promise<UserProfile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new ApiError(error.message);
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Connections
export const useConnections = (userId: string) => {
  return useReactQuery({
    queryKey: queryKeys.connections(userId),
    queryFn: async (): Promise<Connection[]> => {
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
      
      if (error) throw new ApiError(error.message);
      return data || [];
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Jobs
export const useJobs = () => {
  return useReactQuery({
    queryKey: queryKeys.jobs,
    queryFn: async (): Promise<Job[]> => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          posted_by:profiles(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw new ApiError(error.message);
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Events
export const useEvents = () => {
  return useReactQuery({
    queryKey: queryKeys.events,
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          created_by:profiles(*)
        `)
        .order('event_time', { ascending: true });
      
      if (error) throw new ApiError(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Announcements
export const useAnnouncements = () => {
  return useReactQuery({
    queryKey: queryKeys.announcements,
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          created_by:profiles(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw new ApiError(error.message);
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutations
export const useCreateConnection = () => {
  return useReactMutation({
    mutationFn: async ({ requesterId, addresseeId }: { requesterId: string; addresseeId: string }) => {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw new ApiError(error.message);
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  return useReactMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw new ApiError(error.message);
      return data;
    },
  });
};
