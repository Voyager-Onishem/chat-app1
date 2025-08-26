/**
 * Component prop interfaces for type-safe component development
 */

import type React from 'react';
import type { UserProfile, UserRole, Connection, Job, Event, Announcement, Message } from './index';
import type { FormData } from './forms';
import type { 
  ChildrenProps, 
  ClassNameProps, 
  BaseProps, 
  ClickHandler, 
  ChangeHandler,
  SubmitHandler 
} from './common';

// Layout and Navigation Components
export interface LayoutProps extends BaseProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface NavbarProps extends BaseProps {
  user?: UserProfile | null;
  onProfileClick?: ClickHandler;
  onLogout?: () => void;
  activeRoute?: string;
}

export interface SidebarProps extends BaseProps {
  isOpen?: boolean;
  onToggle?: () => void;
  user?: UserProfile | null;
  activeRoute?: string;
}

// Authentication Components
export interface AuthFormProps extends BaseProps {
  onSubmit: (data: FormData) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  redirectPath?: string;
}

export interface LoginFormProps extends AuthFormProps {
  showForgotPassword?: boolean;
  showRegisterLink?: boolean;
}

export interface RegisterFormProps extends AuthFormProps {
  showLoginLink?: boolean;
  availableRoles?: UserRole[];
  requireTermsAcceptance?: boolean;
}

// Profile Components
export interface ProfileCardProps extends BaseProps {
  profile: UserProfile;
  isOwner?: boolean;
  onEdit?: () => void;
  onConnect?: () => void;
  connectionStatus?: Connection['status'] | null;
  showActions?: boolean;
}

export interface ProfileFormProps extends BaseProps {
  profile?: UserProfile | null;
  onSave: (profile: UserProfile) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface ProfileAvatarProps extends BaseProps {
  profile: UserProfile;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onImageUpload?: (file: File) => void | Promise<void>;
  loading?: boolean;
}

// Directory and Search Components
export interface DirectoryProps extends BaseProps {
  profiles: UserProfile[];
  loading?: boolean;
  error?: string;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
  onConnect?: (profileId: string) => void;
}

export interface SearchBarProps extends BaseProps {
  value?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface FilterPanelProps extends BaseProps {
  filters: Record<string, string[]>;
  selectedFilters: Record<string, string>;
  onFilterChange: (filterType: string, value: string) => void;
  onClear?: () => void;
}

// Connection Components
export interface ConnectionCardProps extends BaseProps {
  connection: Connection;
  currentUserId: string;
  onAccept?: (connectionId: string) => void;
  onReject?: (connectionId: string) => void;
  onBlock?: (connectionId: string) => void;
  onRemove?: (connectionId: string) => void;
  showActions?: boolean;
}

export interface ConnectionRequestProps extends BaseProps {
  connections: Connection[];
  loading?: boolean;
  onAccept: (connectionId: string) => void;
  onReject: (connectionId: string) => void;
}

// Job Components
export interface JobCardProps extends BaseProps {
  job: Job;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onApply?: () => void;
  showActions?: boolean;
}

export interface JobFormProps extends BaseProps {
  job?: Job | null;
  onSave: (job: Partial<Job>) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface JobListProps extends BaseProps {
  jobs: Job[];
  loading?: boolean;
  error?: string;
  onJobClick?: (job: Job) => void;
  onFilter?: (filters: Record<string, string>) => void;
}

// Event Components
export interface EventCardProps extends BaseProps {
  event: Event;
  currentUserId?: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRSVP?: (status: 'attending' | 'not_attending' | 'interested') => void;
  showActions?: boolean;
}

export interface EventFormProps extends BaseProps {
  event?: Event | null;
  onSave: (event: Partial<Event>) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface RSVPButtonProps extends BaseProps {
  eventId: string;
  currentStatus?: 'attending' | 'not_attending' | 'interested' | null;
  onRSVP: (status: 'attending' | 'not_attending' | 'interested') => void;
  disabled?: boolean;
  loading?: boolean;
}

// Announcement Components
export interface AnnouncementCardProps extends BaseProps {
  announcement: Announcement;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export interface AnnouncementFormProps extends BaseProps {
  announcement?: Announcement | null;
  onSave: (announcement: Partial<Announcement>) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

// Message Components
export interface MessageBubbleProps extends BaseProps {
  message: Message;
  isOwn?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export interface MessageInputProps extends BaseProps {
  value?: string;
  placeholder?: string;
  onSend: (content: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  loading?: boolean;
  maxLength?: number;
}

export interface ConversationListProps extends BaseProps {
  conversations: Array<{
    id: string;
    participants: UserProfile[];
    lastMessage?: Message;
    unreadCount?: number;
  }>;
  activeConversationId?: string;
  onConversationClick: (conversationId: string) => void;
  loading?: boolean;
}

// Notification Components
export interface NotificationDropdownProps extends BaseProps {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    created_at: string;
  }>;
  onNotificationClick?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onClearAll?: () => void;
  unreadCount?: number;
}

export interface ToastNotificationProps extends BaseProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  persistent?: boolean;
}

// UI Components
export interface LoadingSpinnerProps extends BaseProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'inherit';
  message?: string;
}

export interface ErrorBoundaryProps extends ChildrenProps {
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ModalProps extends BaseProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeable?: boolean;
}

export interface ConfirmDialogProps extends BaseProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}

// Form UI Components
export interface FormInputProps extends BaseProps {
  name: string;
  label?: string;
  type?: string;
  value: string;
  onChange: ChangeHandler;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export interface FormSelectProps extends BaseProps {
  name: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  multiple?: boolean;
}

export interface FormTextareaProps extends BaseProps {
  name: string;
  label?: string;
  value: string;
  onChange: ChangeHandler;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  rows?: number;
  maxRows?: number;
  minRows?: number;
}

export interface FormCheckboxProps extends BaseProps {
  name: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export interface FormFileUploadProps extends BaseProps {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onChange: (files: File | File[] | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  preview?: boolean;
}

// Button Components
export interface ButtonProps extends BaseProps {
  variant?: 'solid' | 'outlined' | 'plain' | 'soft';
  color?: 'primary' | 'neutral' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: ClickHandler;
  type?: 'button' | 'submit' | 'reset';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export interface IconButtonProps extends BaseProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outlined' | 'plain' | 'soft';
  color?: 'primary' | 'neutral' | 'danger' | 'success' | 'warning';
  onClick?: ClickHandler;
  disabled?: boolean;
  loading?: boolean;
  'aria-label': string;
}

// Admin Components
export interface AdminDashboardProps extends BaseProps {
  stats: {
    totalUsers: number;
    pendingRegistrations: number;
    totalConnections: number;
    totalJobs: number;
    totalEvents: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  onRefresh?: () => void;
}

export interface UserManagementProps extends BaseProps {
  users: UserProfile[];
  pendingRegistrations: Array<{
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    role: UserRole;
    requested_at: string;
  }>;
  onApproveRegistration: (id: string) => void;
  onRejectRegistration: (id: string) => void;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onDeactivateUser: (userId: string) => void;
  loading?: boolean;
}

// Debug Components
export interface DebugPanelProps extends BaseProps {
  user?: UserProfile | null;
  session?: any;
  environment?: string;
  diagnostics?: Array<{
    name: string;
    status: 'success' | 'error' | 'warning';
    message: string;
  }>;
  onRunDiagnostics?: () => void;
}
