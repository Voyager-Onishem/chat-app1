import { supabase } from '../supabase-client';

interface ConnectionStatus {
  isConnected: boolean;
  lastCheck: Date;
  retryCount: number;
}

class ConnectionManager {
  private status: ConnectionStatus = {
    isConnected: false,
    lastCheck: new Date(),
    retryCount: 0
  };

  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private connectionTimeout = 5000; // 5 seconds
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Delay the start to prevent blocking app initialization
    setTimeout(() => {
      this.startHealthCheck();
    }, 1000);
  }

  private async checkConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Create a timeout promise that rejects after configured timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), this.connectionTimeout);
      });

      // Create the actual query promise
      const queryPromise = supabase
        .from('profiles')
        .select('count')
        .limit(1);

      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result;

      const responseTime = Date.now() - startTime;

      if (error) {
        console.warn('Backend connection check failed:', error.message);
        this.status.isConnected = false;
        this.status.retryCount++;
        return false;
      }

      // Connection is healthy
      this.status.isConnected = true;
      this.status.retryCount = 0;
      this.status.lastCheck = new Date();
      
      if (responseTime > 3000) {
        console.warn('Backend response is slow:', responseTime + 'ms');
      }

      return true;
    } catch (error: unknown) {
      // Type guard for error with message
      const getErrorMessage = (err: unknown): string => {
        if (err instanceof Error) return err.message;
        if (typeof err === 'object' && err !== null && 'message' in err) {
          return String((err as { message: unknown }).message);
        }
        return 'Unknown error';
      };

      // Type guard for error with code
      const getErrorCode = (err: unknown): string | undefined => {
        if (typeof err === 'object' && err !== null && 'code' in err) {
          return String((err as { code: unknown }).code);
        }
        return undefined;
      };

      const errorMessage = getErrorMessage(error);
      const errorCode = getErrorCode(error);

      // Handle timeout specifically
      if (errorMessage === 'Connection timeout') {
        console.warn(`Backend connection timeout after ${this.connectionTimeout}ms`);
        this.status.isConnected = false;
        this.status.retryCount++;
        return false;
      }
      
      // Handle other network errors
      if (errorCode === 'NETWORK_ERROR' || errorMessage.includes('network')) {
        console.warn('Network error during connection check');
      } else if (errorMessage.includes('Cloudflare') || errorMessage.includes('1101') || errorMessage.includes('Worker threw exception')) {
        console.warn('Cloudflare/Supabase infrastructure error detected');
      } else {
        console.error('Connection check error:', error);
      }
      
      this.status.isConnected = false;
      this.status.retryCount++;
      return false;
    }
  }

  private async fallbackConnectionCheck(): Promise<boolean> {
    try {
      // Create a timeout promise for fallback check
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Fallback connection timeout')), this.connectionTimeout);
      });

      // Try to get the current session as a fallback
      const sessionPromise = supabase.auth.getSession();
      
      const result = await Promise.race([sessionPromise, timeoutPromise]);
      const { data: { session }, error } = result;
      
      if (error) {
        console.warn('Fallback connection check failed:', error.message);
        this.status.isConnected = false;
        this.status.retryCount++;
        return false;
      }

      // If we can get a session, the connection is working
      this.status.isConnected = true;
      this.status.retryCount = 0;
      this.status.lastCheck = new Date();
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'Fallback connection timeout') {
        console.warn(`Fallback connection timeout after ${this.connectionTimeout}ms`);
      } else {
        console.warn('Fallback connection check error:', error);
      }
      this.status.isConnected = false;
      this.status.retryCount++;
      return false;
    }
  }

  private startHealthCheck(): void {
    // Check connection every 30 seconds
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkConnection();
      } catch (error) {
        console.warn('Health check interval error:', error);
      }
    }, 30000);

    // Initial check with error handling
    this.checkConnection().catch(error => {
      console.warn('Initial connection check error:', error);
    });
  }

  public async ensureConnection(): Promise<boolean> {
    if (this.status.isConnected) {
      return true;
    }

    // Try to reconnect with exponential backoff
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const delay = this.retryDelay * Math.pow(2, attempt);
      
      console.log(`Attempting to reconnect (attempt ${attempt + 1}/${this.maxRetries}) in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const isConnected = await this.checkConnection();
      if (isConnected) {
        console.log('Successfully reconnected to backend');
        return true;
      }
    }

    console.error('Failed to reconnect after maximum retries');
    return false;
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  public setConnectionTimeout(timeout: number): void {
    this.connectionTimeout = timeout;
  }

  public getConnectionTimeout(): number {
    return this.connectionTimeout;
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Ensure connection before each attempt
        if (attempt > 0) {
          await this.ensureConnection();
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);

        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after maximum retries');
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Create a singleton instance only in browser environment
export const connectionManager = typeof window !== 'undefined' ? new ConnectionManager() : null;

// Export utility functions
export const withConnectionRetry = <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  if (!connectionManager) {
    // If no connection manager, just execute the operation
    return operation();
  }
  return connectionManager.executeWithRetry(operation, maxRetries);
};

export const getConnectionStatus = (): ConnectionStatus => {
  if (!connectionManager) {
    return {
      isConnected: false,
      lastCheck: new Date(),
      retryCount: 0
    };
  }
  return connectionManager.getStatus();
};

export const testConnectionWithTimeout = async (timeoutMs: number = 5000): Promise<boolean> => {
  if (!connectionManager) {
    return false;
  }
  
  const originalTimeout = connectionManager.getConnectionTimeout();
  connectionManager.setConnectionTimeout(timeoutMs);
  
  try {
    return await connectionManager['checkConnection']();
  } finally {
    connectionManager.setConnectionTimeout(originalTimeout);
  }
};

// Cleanup on page unload
if (typeof window !== 'undefined' && connectionManager) {
  window.addEventListener('beforeunload', () => {
    connectionManager.stop();
  });
} 