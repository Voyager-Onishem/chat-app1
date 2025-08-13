import { useEffect, useCallback, useRef } from 'react';
import { debounce } from '../utils/debounce';

export interface UseWindowFocusOptions {
  onFocus?: () => void;
  onBlur?: () => void;
  debounceMs?: number;
  disabled?: boolean;
}

/**
 * Hook that manages window focus events with proper cleanup
 * Useful for refreshing data when user returns to the app
 */
export function useWindowFocus(options: UseWindowFocusOptions = {}) {
  const {
    onFocus,
    onBlur,
    debounceMs = 1000,
    disabled = false,
  } = options;

  const onFocusRef = useRef(onFocus);
  const onBlurRef = useRef(onBlur);

  // Update refs when callbacks change
  useEffect(() => {
    onFocusRef.current = onFocus;
  }, [onFocus]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  const debouncedOnFocus = useCallback(
    debounce(() => {
      if (!document.hidden && onFocusRef.current) {
        console.log('Window focus detected - triggering callback');
        onFocusRef.current();
      }
    }, debounceMs),
    [debounceMs]
  );

  const debouncedOnBlur = useCallback(
    debounce(() => {
      if (onBlurRef.current) {
        console.log('Window blur detected - triggering callback');
        onBlurRef.current();
      }
    }, debounceMs),
    [debounceMs]
  );

  useEffect(() => {
    if (disabled) return;

    const handleFocus = () => {
      debouncedOnFocus();
    };

    const handleBlur = () => {
      debouncedOnBlur();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        debouncedOnFocus();
      } else {
        debouncedOnBlur();
      }
    };

    // Add event listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [disabled, debouncedOnFocus, debouncedOnBlur]);
}

/**
 * Simple hook for data refetching on window focus
 */
export function useRefetchOnFocus(refetch: () => void, options: Omit<UseWindowFocusOptions, 'onFocus'> = {}) {
  useWindowFocus({
    ...options,
    onFocus: refetch,
  });
}

export default useWindowFocus;
