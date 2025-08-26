/**
 * Form-specific type definitions
 */

import type { UserRole } from './index';
import type { ChangeHandler, SubmitHandler } from './common';

// Generic form data interface
export interface FormData extends Record<string, unknown> {
  [key: string]: string | number | boolean | undefined | null | string[] | Record<string, unknown>;
}

// Form validation interfaces
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export type FormValidationRules<T extends FormData> = {
  [K in keyof T]?: FieldValidationRule;
};

// Specific form data interfaces with proper typing
export interface LoginFormData extends FormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData extends FormData {
  full_name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role: UserRole;
  terms?: boolean;
}

export interface ProfileFormData extends FormData {
  full_name: string;
  bio?: string;
  location?: string;
  company?: string;
  job_title?: string;
  graduation_year?: string;
  major?: string;
  skills?: string[];
  profile_picture_url?: string;
}

export interface CreateJobFormData extends FormData {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string;
  apply_url?: string;
  salary_range?: string;
  employment_type?: 'full-time' | 'part-time' | 'contract' | 'internship';
}

export interface CreateEventFormData extends FormData {
  title: string;
  description?: string;
  location?: string;
  event_time: string;
  event_date?: string;
  max_attendees?: number;
  registration_required?: boolean;
}

export interface CreateAnnouncementFormData extends FormData {
  title: string;
  content: string;
  category?: 'general' | 'academic' | 'social' | 'career';
  priority?: 'low' | 'normal' | 'high';
}

export interface MessageFormData extends FormData {
  content: string;
  conversation_id?: string;
  recipient_id?: string;
}

export interface SearchFormData extends FormData {
  query: string;
  filters?: Record<string, string | undefined>;
}

// Form component prop interfaces (for form library integration)
export interface HookFormProps<T extends FormData> {
  onSubmit: (data: T) => void | Promise<void>;
  initialData?: Partial<T>;
  validationRules?: FormValidationRules<T>;
  loading?: boolean;
  disabled?: boolean;
  resetOnSubmit?: boolean;
}

export interface HookFormFieldProps<T = string> {
  name: string;
  value: T;
  onChange: ChangeHandler;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  type?: string;
}

export interface HookFormSelectProps<T = string> extends Omit<HookFormFieldProps<T>, 'onChange'> {
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  multiple?: boolean;
}

export interface HookFormCheckboxProps extends Omit<HookFormFieldProps<boolean>, 'onChange'> {
  onChange: (checked: boolean) => void;
}

export interface HookFormTextAreaProps extends HookFormFieldProps<string> {
  rows?: number;
  maxRows?: number;
  minRows?: number;
}

export interface HookFormFileUploadProps extends Omit<HookFormFieldProps<File | null>, 'onChange'> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onChange: (files: File | File[] | null) => void;
  preview?: boolean;
}

// Form state management
export interface UseFormReturn<T extends FormData> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;
  setError: <K extends keyof T>(name: K, error: string) => void;
  clearErrors: () => void;
  handleSubmit: (onSubmit: (data: T) => void | Promise<void>) => SubmitHandler;
  reset: (data?: Partial<T>) => void;
  validate: () => FormValidationResult;
}

// Form context for complex forms
export interface FormContextValue<T extends FormData> extends UseFormReturn<T> {
  fieldProps: <K extends keyof T>(name: K) => HookFormFieldProps<T[K]>;
}
