const TOKEN_KEY = 'finance_tracker_token';
const USER_KEY = 'finance_tracker_user';

class AuthService {
  // Token management
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  // User data management
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  removeUser() {
    localStorage.removeItem(USER_KEY);
  }

  // Authentication status
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.logout();
      return false;
    }
  }

  // Get authorization header
  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Logout
  logout() {
    this.removeToken();
    this.removeUser();
    
    // Redirect to login if we're not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Get user ID from token
  getUserId() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return null;
    }
  }

  // Check if token is about to expire (within 5 minutes)
  isTokenExpiring() {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const fiveMinutesFromNow = currentTime + (5 * 60); // 5 minutes in seconds
      
      return payload.exp < fiveMinutesFromNow;
    } catch (error) {
      console.error('Token expiration check error:', error);
      return true;
    }
  }

  // Get token expiration time
  getTokenExpiration() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  // Setup token refresh interval
  setupTokenRefresh(refreshCallback) {
    // Check every 5 minutes
    const interval = setInterval(() => {
      if (this.isTokenExpiring() && this.isAuthenticated()) {
        if (refreshCallback) {
          refreshCallback();
        } else {
          console.warn('Token is expiring but no refresh callback provided');
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return interval;
  }

  // Clear token refresh interval
  clearTokenRefresh(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}

// Create and export a singleton instance
export const authService = new AuthService();

// Export the class as well for testing purposes
export { AuthService };