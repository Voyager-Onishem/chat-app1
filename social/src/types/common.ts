/**
 * Additional TypeScript interface definitions for proper typing
 */

// Common error handling interfaces
export interface ErrorDetails {
  message: string;
  name?: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Form handling interfaces
export interface FormError {
  field: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  errors: FormError[];
  values: Record<string, unknown>;
}

// Database query interfaces
export interface QueryResult<T = unknown> {
  data: T | null;
  error: ApiError | null;
  count?: number;
}

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// Component prop interfaces
export interface ChildrenProps {
  children: React.ReactNode;
}

export interface ClassNameProps {
  className?: string;
}

export interface BaseProps extends ChildrenProps, ClassNameProps {
  id?: string;
}

// Event handler interfaces
export interface ClickHandler {
  (event: React.MouseEvent<HTMLElement>): void;
}

export interface ChangeHandler {
  (event: React.ChangeEvent<HTMLInputElement>): void;
}

export interface SubmitHandler {
  (event: React.FormEvent<HTMLFormElement>): void;
}

// Authentication interfaces
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    role?: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  created_at: string;
  updated_at?: string;
}

// Supabase specific interfaces
export interface SupabaseResponse<T = unknown> {
  data: T | null;
  error: SupabaseError | null;
  count?: number | null;
  status: number;
  statusText: string;
}

// Diagnostic interfaces (for debug components)
export interface DiagnosticTest {
  name: string;
  description: string;
  run: () => Promise<DiagnosticResult>;
}

export interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
  timing?: number;
  timestamp: Date;
}

export interface DiagnosticSuite {
  name: string;
  tests: DiagnosticTest[];
  results?: DiagnosticResult[];
}
