/**
 * Authentication Service
 * 
 * This module provides a simple authentication service that replaces Supabase Auth.
 * It uses localStorage to persist the session information.
 */

// Define the Session type
export interface Session {
  user: {
    id: string;
    email: string;
    role: string;
  };
  access_token: string;
  expires_at: number;
}

// Define the AuthChangeEvent type
export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED';

// Define the AuthStateChangeCallback type
export type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

// Define the Subscription type
export interface Subscription {
  unsubscribe: () => void;
}

// Create a class to manage authentication
class AuthService {
  private listeners: Array<AuthStateChangeCallback> = [];
  private storageKey = 'auth_session';

  /**
   * Get the current session from localStorage
   * @returns Promise with the session data
   */
  async getSession(): Promise<{ data: { session: Session | null }, error: Error | null }> {
    try {
      const sessionStr = localStorage.getItem(this.storageKey);
      const session = sessionStr ? JSON.parse(sessionStr) as Session : null;
      
      // Check if the session has expired
      if (session && session.expires_at < Date.now()) {
        // Session has expired, remove it
        localStorage.removeItem(this.storageKey);
        return { data: { session: null }, error: null };
      }
      
      return { data: { session }, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      return { data: { session: null }, error: error as Error };
    }
  }

  /**
   * Get the current user
   * @returns Promise with the user data
   */
  async getUser(): Promise<{ data: { user: Session['user'] | null }, error: Error | null }> {
    try {
      const { data } = await this.getSession();
      return { data: { user: data.session?.user || null }, error: null };
    } catch (error) {
      console.error('Error getting user:', error);
      return { data: { user: null }, error: error as Error };
    }
  }

  /**
   * Sign in with email and password
   * @param email User's email
   * @param password User's password
   * @returns Promise with the session data
   */
  async signIn({ email, password }: { email: string; password: string }): Promise<{ data: { session: Session | null }, error: Error | null }> {
    try {
      // In a real implementation, this would validate credentials against a server
      // For this mock implementation, we'll accept any email/password combination
      if (!email || !password) {
        return { data: { session: null }, error: new Error('Email and password are required') };
      }

      // Generate a valid UUID for the mock user
      const generateUUID = () => {
  // Always return a fixed UUID for development
  return '11111111-1111-4111-a111-111111111111';
};

      // Create a mock session with a valid UUID
      const session: Session = {
        user: {
          id: generateUUID(),
          email,
          role: 'authenticated'
        },
        access_token: 'mock-access-token',
        expires_at: Date.now() + 3600000 // Expires in 1 hour
      };

      // Store the session in localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(session));

      // Notify listeners
      this.notifyListeners('SIGNED_IN', session);

      return { data: { session }, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: { session: null }, error: error as Error };
    }
  }

  /**
   * Sign up with email and password
   * @param email User's email
   * @param password User's password
   * @returns Promise with the session data
   */
  async signUp({ email, password }: { email: string; password: string }): Promise<{ data: { session: Session | null }, error: Error | null }> {
    try {
      // In a real implementation, this would create a new user on the server
      // For this mock implementation, we'll just create a mock session
      if (!email || !password) {
        return { data: { session: null }, error: new Error('Email and password are required') };
      }

      // Generate a valid UUID for the mock user (reusing the same function)
      const generateUUID = () => {
        // Always return a fixed UUID for development
        return '11111111-1111-4111-a111-111111111111';
      };

      // Create a mock session with a valid UUID
      const session: Session = {
        user: {
          id: generateUUID(),
          email,
          role: 'authenticated'
        },
        access_token: 'mock-access-token',
        expires_at: Date.now() + 3600000 // Expires in 1 hour
      };

      // Store the session in localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(session));

      // Notify listeners
      this.notifyListeners('SIGNED_IN', session);

      return { data: { session }, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: { session: null }, error: error as Error };
    }
  }

  /**
   * Sign out the current user
   * @returns Promise with the result
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      // Remove the session from localStorage
      localStorage.removeItem(this.storageKey);

      // Notify listeners
      this.notifyListeners('SIGNED_OUT', null);

      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: error as Error };
    }
  }

  /**
   * Listen for authentication state changes
   * @param callback Function to call when the auth state changes
   * @returns Subscription object with an unsubscribe method
   */
  onAuthStateChange(callback: AuthStateChangeCallback): { data: { subscription: Subscription } } {
    // Add the callback to the listeners array
    this.listeners.push(callback);

    // Return a subscription object with an unsubscribe method
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            // Remove the callback from the listeners array
            this.listeners = this.listeners.filter(listener => listener !== callback);
          }
        }
      }
    };
  }

  /**
   * Notify all listeners of an auth state change
   * @param event The auth change event
   * @param session The current session
   */
  private notifyListeners(event: AuthChangeEvent, session: Session | null): void {
    // Call each listener with the event and session
    this.listeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (error) {
        console.error('Error in auth state change listener:', error);
      }
    });
  }
}

// Create and export a singleton instance of the AuthService
export const auth = new AuthService();
