import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api';

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
        timeout: API_CONFIG.TIMEOUT,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store authentication data
      await this.storeAuthData(data);

      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: error.message || 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Store authentication data securely
   */
  async storeAuthData(data) {
    try {
      await AsyncStorage.multiSet([
        ['authToken', data.token],
        ['userData', JSON.stringify(data.user)],
        ['userId', data.user.user_id],
        ['userRole', data.user.role],
        ['loginTime', new Date().toISOString()],
      ]);
      console.log('✅ Auth data stored:', data.user.user_id);
    } catch (error) {
      console.error('❌ Failed to store auth data:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const token = await AsyncStorage.getItem('authToken');

      // Call logout endpoint if token exists
      if (token) {
        try {
          await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.log('⚠️ Logout API call failed, continuing with local logout');
        }
      }

      // Clear all stored data
      await AsyncStorage.multiRemove([
        'authToken',
        'userData',
        'userId',
        'userRole',
        'loginTime',
        'emergencyCounter',
      ]);

      console.log('✅ User logged out');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      return !!(token && userData);
    } catch (error) {
      console.error('❌ Auth check error:', error);
      return false;
    }
  }

  /**
   * Get current user data
   */
  async getUserData() {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        return JSON.parse(userDataStr);
      }
      return null;
    } catch (error) {
      console.error('❌ Get user data error:', error);
      return null;
    }
  }

  /**
   * Get authentication token
   */
  async getToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('❌ Get token error:', error);
      return null;
    }
  }

  /**
   * Verify token is still valid
   */
  async verifyToken() {
    try {
      const token = await this.getToken();
      if (!token) return false;

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.VERIFY}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return false;
    }
  }

  /**
   * Update user profile data in storage
   */
  async updateUserData(updatedUser) {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      console.log('✅ User data updated');
      return true;
    } catch (error) {
      console.error('❌ Update user data error:', error);
      return false;
    }
  }
}

export default new AuthService();
