/**
 * Django Authentication Service
 * 
 * This module provides authentication services that connect to the Django backend.
 * It uses JWT tokens for authentication and handles token refresh.
 */

// Define the Session type
export interface Session {
  user: {
    id: string;
    email: string;
    role: string;
  };
  access_token: string;
  refresh_token: string;
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
class DjangoAuthService {
  private listeners: Array<AuthStateChangeCallback> = [];
  private storageKey = 'django_auth_session';
  private djangoBaseUrl = 'http://localhost:8001/api'; // Django backend URL

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
        // Try to refresh the token
        const refreshResult = await this.refreshToken(session.refresh_token);
        if (refreshResult.error) {
          // If refresh fails, remove the session
          localStorage.removeItem(this.storageKey);
          return { data: { session: null }, error: null };
        }
        return { data: { session: refreshResult.data.session }, error: null };
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
      // Validate input
      if (!email || !password) {
        return { data: { session: null }, error: new Error('Email and password are required') };
      }

      // Call Django's token endpoint
      const response = await fetch(`${this.djangoBaseUrl}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }

      // Parse the response
      const tokenData = await response.json();

      // Get user details
      const userResponse = await fetch(`${this.djangoBaseUrl}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user details');
      }

      const userData = await userResponse.json();

      // Create a session
      const session: Session = {
        user: {
          id: userData.id,
          email: userData.email,
          role: 'authenticated',
        },
        access_token: tokenData.access,
        refresh_token: tokenData.refresh,
        expires_at: Date.now() + 4 * 60 * 60 * 1000, // 4 hours expiration
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
   * Refresh the access token
   * @param refreshToken The refresh token
   * @returns Promise with the new session data
   */
  private async refreshToken(refreshToken: string): Promise<{ data: { session: Session | null }, error: Error | null }> {
    try {
      // Call Django's token refresh endpoint
      const response = await fetch(`${this.djangoBaseUrl}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      // Parse the response
      const tokenData = await response.json();

      // Get the current session
      const sessionStr = localStorage.getItem(this.storageKey);
      if (!sessionStr) {
        throw new Error('No session found');
      }

      const currentSession = JSON.parse(sessionStr) as Session;

      // Update the session with the new token
      const updatedSession: Session = {
        ...currentSession,
        access_token: tokenData.access,
        expires_at: Date.now() + 4 * 60 * 60 * 1000, // 4 hours expiration
      };

      // Store the updated session
      localStorage.setItem(this.storageKey, JSON.stringify(updatedSession));

      return { data: { session: updatedSession }, error: null };
    } catch (error) {
      console.error('Error refreshing token:', error);
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
      // In a real implementation, this would call Django's user creation endpoint
      // For now, we'll just sign in with the provided credentials
      return this.signIn({ email, password });
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
   * Get authentication headers for API requests
   * @returns Object with Authorization header
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const { data } = await this.getSession();
    if (data.session?.access_token) {
      return {
        'Authorization': `Bearer ${data.session.access_token}`,
      };
    }
    return {};
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

// Create and export a singleton instance of the DjangoAuthService
export const djangoAuth = new DjangoAuthService();
