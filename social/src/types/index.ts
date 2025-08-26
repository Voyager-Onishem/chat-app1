/**
 * Centralized type definitions for the application
 */

// Re-export all types from sub-modules
export * from './common';
export * from './forms';
export * from './props';

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
  rsvps?: RSVP[];
}

export interface RSVP {
  user_id: string;
  status: 'attending' | 'interested' | 'not_attending';
  event_id?: string;
  user?: UserProfile;
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
  conversation_id: string;
  profiles?: UserProfile;
}

export interface UserConversation {
  conversation_id: string;
  user_id: string;
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

export interface ApiResponse<T = unknown> {
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
export interface LoginFormData extends Record<string, unknown> {
  email: string;
  password: string;
}

export interface RegisterFormData extends Record<string, unknown> {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ProfileFormData extends Record<string, unknown> {
  full_name: string;
  bio?: string;
  location?: string;
  company?: string;
  job_title?: string;
  graduation_year?: string;
  major?: string;
}

export interface CreateJobFormData extends Record<string, unknown> {
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url?: string;
}

export interface CreateEventFormData extends Record<string, unknown> {
  title: string;
  description?: string;
  location?: string;
  event_time: string;
}

export interface CreateAnnouncementFormData extends Record<string, unknown> {
  title: string;
  content: string;
}

// Notifications
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

export type DbNotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_rejected'
  | 'message'
  | 'announcement';

export interface DatabaseNotification {
  id: string;
  user_id: string;
  type: DbNotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}
