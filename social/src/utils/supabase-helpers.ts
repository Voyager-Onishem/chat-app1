/**
 * Type-safe Supabase utilities and wrappers
 */

import type { PostgrestError } from '@supabase/supabase-js';
import type { QueryResult, ApiError, SupabaseError } from '../types/common';

/**
 * Map Supabase error to our error type
 */
export function mapSupabaseError(error: PostgrestError): ApiError {
  return {
    message: error.message,
    code: error.code,
    details: error.details ? { 
      details: error.details, 
      hint: error.hint || undefined 
    } : undefined,
  };
}

/**
 * Type-safe wrapper for Supabase query results
 */
export function createQueryResult<T>(
  data: T | null,
  error: PostgrestError | null
): QueryResult<T> {
  return {
    data,
    error: error ? mapSupabaseError(error) : null,
    count: undefined,
  };
}

/**
 * Type-safe error handling utilities
 */
export function isSupabaseError(error: unknown): error is ApiError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

export function handleSupabaseError(error: unknown): ApiError {
  if (isSupabaseError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }
  
  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Type-safe database operation helpers
 */
export class DatabaseHelpers {
  private client: any;
  
  constructor(client: any) {
    this.client = client;
  }

  /**
   * Type-safe select with error handling
   */
  async safeSelect<T>(
    table: string,
    columns?: string,
    filters?: Record<string, unknown>
  ): Promise<QueryResult<T[]>> {
    try {
      let query = this.client.from(table).select(columns || '*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      return {
        data: data || [],
        error: error ? mapSupabaseError(error) : null,
        count: undefined,
      };
    } catch (err) {
      return {
        data: null,
        error: handleSupabaseError(err),
        count: undefined,
      };
    }
  }

  /**
   * Type-safe single record select
   */
  async safeSingle<T>(
    table: string,
    filters: Record<string, unknown>,
    columns?: string
  ): Promise<QueryResult<T>> {
    try {
      let query = this.client.from(table).select(columns || '*');
      
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data, error } = await query.single();
      
      return {
        data: data || null,
        error: error ? mapSupabaseError(error) : null,
        count: undefined,
      };
    } catch (err) {
      return {
        data: null,
        error: handleSupabaseError(err),
        count: undefined,
      };
    }
  }

  /**
   * Type-safe insert with error handling
   */
  async safeInsert<T>(
    table: string,
    data: Partial<T> | Partial<T>[]
  ): Promise<QueryResult<T | T[]>> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();
      
      return {
        data: result || null,
        error: error ? mapSupabaseError(error) : null,
        count: undefined,
      };
    } catch (err) {
      return {
        data: null,
        error: handleSupabaseError(err),
        count: undefined,
      };
    }
  }

  /**
   * Type-safe update with error handling
   */
  async safeUpdate<T>(
    table: string,
    data: Partial<T>,
    filters: Record<string, unknown>
  ): Promise<QueryResult<T | T[]>> {
    try {
      let query = this.client.from(table).update(data);
      
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data: result, error } = await query.select();
      
      return {
        data: result || null,
        error: error ? mapSupabaseError(error) : null,
        count: undefined,
      };
    } catch (err) {
      return {
        data: null,
        error: handleSupabaseError(err),
        count: undefined,
      };
    }
  }
}

/**
 * Utility functions for common operations
 */
export const SupabaseUtils = {
  /**
   * Get public URL for storage
   */
  getPublicUrl(client: any, bucket: string, path: string): string {
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Upload file with error handling
   */
  async uploadFile(
    client: any,
    bucket: string,
    path: string,
    file: File,
    options?: { upsert?: boolean }
  ): Promise<QueryResult<{ path: string }>> {
    try {
      const { data, error } = await client.storage
        .from(bucket)
        .upload(path, file, options);
      
      return {
        data: data ? { path: data.path } : null,
        error: error ? { message: error.message, code: error.statusCode } : null,
        count: undefined,
      };
    } catch (err) {
      return {
        data: null,
        error: handleSupabaseError(err),
        count: undefined,
      };
    }
  },

  /**
   * Check if error is not found error
   */
  isNotFoundError(error: ApiError | null): boolean {
    return error?.code === 'PGRST116';
  },

  /**
   * Check if error is authentication error
   */
  isAuthError(error: ApiError | null): boolean {
    if (!error) return false;
    return error.code === '401' || (error.message?.includes('auth') ?? false);
  },
};
