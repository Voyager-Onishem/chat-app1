import { 
  useQuery as useReactQuery, 
  useMutation as useReactMutation, 
  useQueryClient,
  QueryKey,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';
import { supabase } from '../supabase-client';
import { profileService, connectionService } from '../services/api';
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

// Query keys factory for consistency and type safety
export const queryKeys = {
  profiles: ['profiles'] as const,
  profilesFiltered: (filters?: any) => ['profiles', 'filtered', filters] as const,
  profile: (id: string) => ['profiles', id] as const,
  connections: (userId: string) => ['connections', userId] as const,
  jobs: ['jobs'] as const,
  job: (id: string) => ['jobs', id] as const,
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
  announcements: ['announcements'] as const,
  announcement: (id: string) => ['announcements', id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  conversations: (userId: string) => ['conversations', userId] as const,
} as const;

// Profiles with enhanced filtering support
export const useProfiles = (filters?: {
  role?: string;
  location?: string;
  company?: string;
  graduationYearRange?: [number, number];
}, options?: Omit<UseQueryOptions<UserProfile[], Error>, 'queryKey' | 'queryFn'>) => {
  return useReactQuery({
    queryKey: filters ? queryKeys.profilesFiltered(filters) : queryKeys.profiles,
    queryFn: async (): Promise<UserProfile[]> => {
      return profileService.getProfiles(filters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    ...options,
  });
};

export const useProfile = (userId: string, options?: Omit<UseQueryOptions<UserProfile | null, Error>, 'queryKey' | 'queryFn'>) => {
  return useReactQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: async (): Promise<UserProfile | null> => {
      return profileService.getProfile(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // Keep profile data longer
    ...options,
  });
};

// Connections with enhanced error handling
export const useConnections = (userId: string, options?: Omit<UseQueryOptions<Connection[], Error>, 'queryKey' | 'queryFn'>) => {
  return useReactQuery({
    queryKey: queryKeys.connections(userId),
    queryFn: async (): Promise<Connection[]> => {
      return connectionService.getConnections(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

// Jobs with enhanced data fetching
export const useJobs = (options?: Omit<UseQueryOptions<Job[], Error>, 'queryKey' | 'queryFn'>) => {
  return useReactQuery({
    queryKey: queryKeys.jobs,
    queryFn: async (): Promise<Job[]> => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          posted_by:profiles!jobs_posted_by_user_id_fkey(
            full_name,
            profile_picture_url,
            role
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw new ApiError(error.message);
      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute for fresh job data
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

// Events with better field mapping
export const useEvents = (options?: Omit<UseQueryOptions<Event[], Error>, 'queryKey' | 'queryFn'>) => {
  return useReactQuery({
    queryKey: queryKeys.events,
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator:profiles!events_created_by_fkey(
            full_name,
            profile_picture_url,
            role
          )
        `)
        .order('date', { ascending: true });
      
      if (error) throw new ApiError(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
    ...options,
  });
};

// Announcements with improved caching
export const useAnnouncements = (options?: Omit<UseQueryOptions<Announcement[], Error>, 'queryKey' | 'queryFn'>) => {
  return useReactQuery({
    queryKey: queryKeys.announcements,
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey(
            full_name,
            profile_picture_url,
            role
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw new ApiError(error.message);
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds for announcements
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

// Messages and Conversations for real-time features
export const useMessages = (conversationId: string, options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  return useReactQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            full_name,
            profile_picture_url,
            role
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw new ApiError(error.message);
      return data || [];
    },
    staleTime: 0, // Always fresh for real-time messaging
    gcTime: 5 * 60 * 1000,
    enabled: !!conversationId,
    ...options,
  });
};

export const useConversations = (userId: string, options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  return useReactQuery({
    queryKey: queryKeys.conversations(userId),
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            profile:profiles(
              full_name,
              profile_picture_url,
              role
            )
          ),
          last_message:messages(
            content,
            created_at,
            sender:profiles(full_name)
          )
        `)
        .or(`created_by.eq.${userId},id.in.(select conversation_id from conversation_participants where user_id=${userId})`)
        .order('updated_at', { ascending: false });

      if (error) throw new ApiError(error.message);
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000,
    enabled: !!userId,
    ...options,
  });
};

// Enhanced Mutations with proper cache invalidation
export const useSendConnectionRequest = (
  options?: UseMutationOptions<any, Error, { requesterId: string; addresseeId: string }>
) => {
  const queryClient = useQueryClient();

  return useReactMutation({
    mutationFn: async ({ requesterId, addresseeId }: { requesterId: string; addresseeId: string }) => {
      return connectionService.sendConnectionRequest(requesterId, addresseeId);
    },
    onSuccess: (_, { requesterId }) => {
      // Invalidate connections for the requester
      queryClient.invalidateQueries({ queryKey: queryKeys.connections(requesterId) });
    },
    ...options,
  });
};

export const useUpdateProfile = (
  options?: UseMutationOptions<UserProfile, Error, { userId: string; updates: Partial<UserProfile> }>
) => {
  const queryClient = useQueryClient();

  return useReactMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) => {
      return profileService.updateProfile(userId, updates);
    },
    onSuccess: (data, { userId }) => {
      // Update the specific profile cache
      queryClient.setQueryData(queryKeys.profile(userId), data);
      // Invalidate profiles list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesFiltered() });
    },
    ...options,
  });
};

// Additional mutation hooks for better API coverage
export const useCreateJob = (
  options?: UseMutationOptions<Job, Error, Omit<Job, 'id' | 'created_at'>>
) => {
  const queryClient = useQueryClient();

  return useReactMutation({
    mutationFn: async (jobData: Omit<Job, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (error) throw new ApiError(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
    ...options,
  });
};

export const useCreateEvent = (
  options?: UseMutationOptions<Event, Error, Omit<Event, 'id' | 'created_at'>>
) => {
  const queryClient = useQueryClient();

  return useReactMutation({
    mutationFn: async (eventData: Omit<Event, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw new ApiError(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
    ...options,
  });
};

export const useCreateAnnouncement = (
  options?: UseMutationOptions<Announcement, Error, Omit<Announcement, 'id' | 'created_at'>>
) => {
  const queryClient = useQueryClient();

  return useReactMutation({
    mutationFn: async (announcementData: Omit<Announcement, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert(announcementData)
        .select()
        .single();

      if (error) throw new ApiError(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
    },
    ...options,
  });
};

export const useSendMessage = (
  options?: UseMutationOptions<any, Error, { conversationId: string; content: string; senderId: string }>
) => {
  const queryClient = useQueryClient();

  return useReactMutation({
    mutationFn: async ({ conversationId, content, senderId }: { conversationId: string; content: string; senderId: string }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
        })
        .select()
        .single();

      if (error) throw new ApiError(error.message);
      return data;
    },
    onSuccess: (_, { conversationId, senderId }) => {
      // Invalidate messages for the conversation
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      // Invalidate conversations for the sender to update last message
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations(senderId) });
    },
    ...options,
  });
};

// Utility hook for manual cache invalidation
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateProfiles: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesFiltered() });
    },
    invalidateProfile: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) }),
    invalidateConnections: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.connections(userId) }),
    invalidateJobs: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs }),
    invalidateEvents: () => queryClient.invalidateQueries({ queryKey: queryKeys.events }),
    invalidateAnnouncements: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements }),
    invalidateMessages: (conversationId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) }),
    invalidateConversations: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.conversations(userId) }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};
