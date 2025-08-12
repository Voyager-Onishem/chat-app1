/**
 * Centralized type definitions for the application
 */

export type UserRole = 'admin' | 'alumni' | 'student' | 'moderator' | 'developer';

export interface UserProfile {
  user_id: string;
  full_name: string;
  profile_picture_url?: string;
  role: UserRole;
  bio?: string;
  location?: string;
  company?: string;
  job_title?: string;
  graduation_year?: number;
  major?: string;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  requester?: UserProfile;
  addressee?: UserProfile;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url?: string;
  created_at: string;
  posted_by_user_id: string;
  posted_by?: UserProfile;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  event_time: string;
  created_at: string;
  created_by_user_id: string;
  created_by?: UserProfile;
  rsvps?: Array<{
    user_id: string;
    status: 'attending' | 'interested' | 'not_attending';
  }>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  author?: UserProfile;
}

export interface ConversationParticipant {
  user_id: string;
  profiles: UserProfile;
}

export interface Conversation {
  id: string;
  created_at: string;
  conversation_participants: ConversationParticipant[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: UserProfile;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: Error | null;
  fromFallback: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retry?: () => void;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ProfileFormData {
  full_name: string;
  bio?: string;
  location?: string;
  company?: string;
  job_title?: string;
  graduation_year?: string;
  major?: string;
}

export interface CreateJobFormData {
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url?: string;
}

export interface CreateEventFormData {
  title: string;
  description?: string;
  location?: string;
  event_time: string;
}

export interface CreateAnnouncementFormData {
  title: string;
  content: string;
}
