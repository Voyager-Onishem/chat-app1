/**
 * Input validation and sanitization utilities
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Basic XSS protection - remove potentially dangerous characters
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
}

/**
 * Validate a single field
 */
export function validateField(value: unknown, rules: ValidationRule): string | null {
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required';
  }
  
  if (!value) {
    return null; // If not required and empty, it's valid
  }
  
  const stringValue = String(value).trim();
  
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters long`;
  }
  
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `Must be no more than ${rules.maxLength} characters long`;
  }
  
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return 'Invalid format';
  }
  
  if (rules.custom) {
    return rules.custom(value);
  }
  
  return null;
}

/**
 * Validate multiple fields
 */
export function validateFields(data: Record<string, unknown>, rules: Partial<Record<string, ValidationRule>>): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    if (fieldRules) {
      const error = validateField(data[field], fieldRules);
      if (error) {
        errors[field] = error;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => !isValidEmail(value) ? 'Please enter a valid email address' : null,
  },
  
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      const result = validatePassword(value);
      return result.isValid ? null : result.message!;
    },
  },
  
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-'.]+$/,
  },
  
  company: {
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-&.,]+$/,
  },
  
  jobTitle: {
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-&.,/]+$/,
  },
  
  location: {
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-,.]+$/,
  },
  
  bio: {
    maxLength: 500,
  },
  
  major: {
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-&.]+$/,
  },
  
  graduationYear: {
    custom: (value: unknown) => {
      if (!value) return null;
      const stringValue = String(value);
      const year = parseInt(stringValue, 10);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year)) {
        return 'Please enter a valid year';
      }
      
      if (year < 1950 || year > currentYear + 10) {
        return `Year must be between 1950 and ${currentYear + 10}`;
      }
      
      return null;
    },
  },
  
  url: {
    pattern: /^https?:\/\/.+\..+/,
    custom: (value: unknown) => {
      if (!value) return null;
      const stringValue = String(value);
      try {
        new URL(stringValue);
        return null;
      } catch {
        return 'Please enter a valid URL';
      }
    },
  },
} as const;

/**
 * Sanitize and validate form data
 */
export function sanitizeAndValidate<T extends Record<string, unknown>>(
  data: T,
  rules: Partial<Record<keyof T, ValidationRule>>
): { sanitizedData: T; validation: ValidationResult } {
  const sanitizedData = { ...data } as T;
  
  // Sanitize string fields
  for (const key in sanitizedData) {
    const value = sanitizedData[key];
    if (typeof value === 'string') {
      sanitizedData[key] = sanitizeInput(value) as T[Extract<keyof T, string>];
    }
  }

  // Validate
  const validation = validateFields(sanitizedData, rules);
  
  return { sanitizedData, validation };
}/**
 * File validation utilities
 */
export const FileValidation = {
  isValidImageType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
  },
  
  isValidImageSize(file: File, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },
  
  validateImage(file: File): { isValid: boolean; message?: string } {
    if (!this.isValidImageType(file)) {
      return { 
        isValid: false, 
        message: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)' 
      };
    }
    
    if (!this.isValidImageSize(file)) {
      return { 
        isValid: false, 
        message: 'Image file must be smaller than 5MB' 
      };
    }
    
    return { isValid: true };
  },
};
