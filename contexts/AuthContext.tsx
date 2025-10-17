import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import Constants from 'expo-constants';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  createApiUrl,
  API_REQUEST_TIMEOUT,
} from '../config/apiConfig';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { secureStorage } from '../utils/secureStorage';
import { InputValidator } from '../utils/validation';
import { setAuthRef } from '../utils/authenticatedFetch';

// Type definitions
interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'delivery_partner' | 'admin' | 'user';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  googleId?: string;
  profilePicture?: string;
  provider?: string;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  apiUrl: string;
  login: (email: string, password: string) => Promise<LoginResult>;
  googleLogin: (googleToken: string, userInfo: any) => Promise<LoginResult>;
  register: (userData: RegisterData) => Promise<RegisterResult>;
  updatePhone: (phone: string) => Promise<UpdatePhoneResult>;
  sendVerificationCode: (phone: string) => Promise<VerificationResult>;
  verifyPhone: (phone: string, code: string) => Promise<VerificationResult>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: UpdateProfileData) => Promise<UpdateProfileResult>;
  refreshToken: () => Promise<boolean>;
  reloadAuth: () => Promise<void>;
}

interface LoginResult {
  success: boolean;
  error?: string;
  requires_phone?: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
}

interface RegisterResult {
  success: boolean;
  error?: string;
  message?: string;
  requires_phone?: boolean;
}

interface UpdatePhoneResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface VerificationResult {
  success: boolean;
  error?: string;
}

interface UpdateProfileData {
  name?: string;
}

interface UpdateProfileResult {
  success: boolean;
  error?: string;
  user?: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const reloadAuth = async () => {
    console.log('🔄 Manually reloading auth...');
    await loadStoredAuth();
  };

  useEffect(() => {
    if (token) {
      console.log('🔗 Setting auth ref for authenticatedFetch');
      setAuthRef({
        token,
        refreshTokenValue,
        setToken,
        logout,
      });
    }
  }, [token, refreshTokenValue]);

  useEffect(() => {
    // Setup token refresh interval
    let refreshInterval: NodeJS.Timeout;
    
    if (token && refreshTokenValue) {
      // Refresh token every 14 minutes (tokens usually expire in 15 minutes)
      refreshInterval = setInterval(() => {
        handleTokenRefresh();
      }, 10 * 60 * 1000);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [token, refreshTokenValue]);

  const clearAuth = async (): Promise<void> => {
    setToken(null);
    setUser(null);
    setRefreshTokenValue(null);
    await secureStorage.clearAuthData();
  };

  const handleTokenStorage = async (accessToken: string, refreshToken: string) => {
    try {
      await secureStorage.storeAuthData(accessToken, refreshToken, null);
      setToken(accessToken);
      setRefreshTokenValue(refreshToken);
      return true;
    } catch (error) {
      console.error('Error storing tokens:', error);
      return false;
    }
  };

  const loadStoredAuth = async (): Promise<void> => {
    try {
      console.log('=== Loading stored auth from secure storage ===');
      
      const authData = await secureStorage.getAuthData();
      console.log('Auth data found:', {
        hasToken: !!authData.accessToken,
        hasRefreshToken: !!authData.refreshToken,
        hasUserData: !!authData.userData,
        userEmail: authData.userData?.email,
      });
      
      if (authData.accessToken && authData.userData) {
        console.log('Setting user from storage:', authData.userData.email);
        
        setToken(authData.accessToken);
        setUser(authData.userData);
        setRefreshTokenValue(authData.refreshToken);
        
        console.log('✅ Auth loaded successfully');
        console.log('✅ User state set:', authData.userData.email);
      } else {
        console.log('No complete auth data found in storage');
        
        // If we have a token but no user, try to fetch user
        if (authData.accessToken && !authData.userData) {
          console.log('Token found but no user data, fetching profile...');
          setToken(authData.accessToken);
          setRefreshTokenValue(authData.refreshToken);
          
          try {
            const profileResponse = await fetchWithTimeout(
              API_ENDPOINTS.PROFILE,
              {
                headers: {
                  'Authorization': `Bearer ${authData.accessToken}`,
                },
              },
              5000
            );
            
            if (profileResponse.ok) {
              const userData = await profileResponse.json();
              setUser(userData);
              await secureStorage.storeAuthData(
                authData.accessToken,
                authData.refreshToken,
                userData
              );
              console.log('✅ User profile fetched and stored');
            } else {
              // ✅ Token invalid, clear everything
              console.log('❌ Token invalid, clearing auth');
              await clearAuth();
            }
          } catch (profileError) {
            console.error('Failed to fetch profile on load:', profileError);
            // ✅ Clear auth on profile fetch failure
            await clearAuth();
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      // ✅ Clear auth on error
      await clearAuth();
    } finally {
      console.log('✅ Auth loading complete, setting loading to false');
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      console.log('Attempting login for:', email);
      
      // Input validation
      const emailValidation = InputValidator.validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }
  
      if (!password) {
        return { success: false, error: 'Password is required' };
      }
  
      const response = await fetchWithTimeout(
        createApiUrl('auth/login'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: emailValidation.sanitizedValue, 
            password 
          }),
        },
        API_REQUEST_TIMEOUT
      );
  
      const data = await response.json();
      console.log('Login response received');
  
      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Login failed';
        return { success: false, error: errorMessage };
      }
  
      // ✅ Store authentication data securely
      await secureStorage.storeAuthData(
        data.access_token,
        data.refresh_token,
        null  // Will fetch user data next
      );
  
      console.log("Access token stored");
  
      setToken(data.access_token);
      setRefreshTokenValue(data.refresh_token);
      
      // ✅ Fetch user profile
      try {
        const profileResponse = await fetchWithTimeout(
          API_ENDPOINTS.PROFILE,
          {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          },
          5000
        );
        
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          setUser(userData);
          await secureStorage.storeAuthData(
            data.access_token,
            data.refresh_token,
            userData
          );
        }
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      return { 
        success: true,
        requires_phone: data.requires_phone || false
      };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: RegisterData): Promise<RegisterResult> => {
    try {
      console.log('Attempting registration for:', userData.email);
      
      // Input validation
      const nameValidation = InputValidator.validateName(userData.name);
      if (!nameValidation.isValid) {
        return { success: false, error: nameValidation.error };
      }

      const emailValidation = InputValidator.validateEmail(userData.email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      const passwordValidation = InputValidator.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      const response = await fetchWithTimeout(
        createApiUrl('auth/register'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: nameValidation.sanitizedValue,
            email: emailValidation.sanitizedValue,
            password: passwordValidation.sanitizedValue,
          }),
        },
        API_REQUEST_TIMEOUT
      );

      const data = await response.json();
      console.log('Registration response received');

      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Registration failed';
        return { success: false, error: errorMessage };
      }

      // Store authentication data if registration includes login
      if (data.access_token) {
        await secureStorage.storeAuthData(
          data.access_token,
          data.refresh_token,
          data.user,
        );

        setToken(data.access_token);
        setRefreshTokenValue(data.refresh_token);
        setUser(data.user);
      }

      return { 
        success: true, 
        message: data.message || 'Registration successful',
        requires_phone: data.requires_phone !== false
      };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const googleLogin = async (googleToken: string, userInfo: any): Promise<LoginResult> => {
    try {
      console.log('=== Starting Google login ===');
      console.log('User info:', userInfo.email);
      
      const response = await fetchWithTimeout(
        createApiUrl('auth/google'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            googleToken,
            user: {
              googleId: userInfo.googleId,
              email: userInfo.email?.toLowerCase(),
              name: userInfo.name,
            },
          }),
        },
        API_REQUEST_TIMEOUT
      );

      const data = await response.json();
      console.log('Google login response received');
      
      if (!response.ok) {
        const errorMessage = data.message || data.detail || 'Google login failed';
        return { success: false, error: errorMessage };
      }

      if (!data.access_token) {
        console.error('Google login response missing access token:', data);
        return { success: false, error: 'Invalid server response - missing access token' };
      }

      console.log('Storing tokens...');
      setToken(data.access_token);
      setRefreshTokenValue(data.refresh_token);
      
      console.log('Fetching user profile...');
      try {
        const profileResponse = await fetchWithTimeout(
          API_ENDPOINTS.PROFILE,
          {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          },
          10000
        );
        
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          console.log('✅ User profile fetched:', JSON.stringify(userData));
          
          setUser(userData);
          
          // Store complete auth data
          await secureStorage.storeAuthData(
            data.access_token,
            data.refresh_token,
            userData
          );
          
          console.log('✅ Complete auth data stored');
        } else {
          console.error('❌ Failed to fetch profile, status:', profileResponse.status);
          // Fallback to basic user info
          const basicUser = {
            _id: userInfo.googleId || userInfo.id || '',
            email: userInfo.email,
            name: userInfo.name,
            id: '',
            role: 'customer',
            is_active: true,
          };

          setUser(basicUser);
          await secureStorage.storeAuthData(
            data.access_token,
            data.refresh_token,
            basicUser
          );
        }
      } catch (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        // Set basic user info as fallback
        const basicUser = {
          _id: userInfo.googleId || userInfo.id || '',
          email: userInfo.email,
          name: userInfo.name,
          id: '',
          role: 'customer',
          is_active: true,
        };
        
        setUser(basicUser);
        await secureStorage.storeAuthData(
          data.access_token,
          data.refresh_token,
          basicUser
        );
      }
      
      console.log('Google login complete, user state set');

      return { 
        success: true,
        requires_phone: data.requires_phone || false
      };
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google login failed';
      return { success: false, error: errorMessage };
    }
  };

  const updatePhone = async (phone: string): Promise<UpdatePhoneResult> => {
    try {
      console.log('Updating phone number');
      
      if (!token) {
        return { success: false, error: 'Not authenticated. Please login again.' };
      }
  
      // Phone validation
      const phoneValidation = InputValidator.validatePhone(phone);
      if (!phoneValidation.isValid) {
        return { success: false, error: phoneValidation.error };
      }
      
      const response = await fetchWithTimeout(
        createApiUrl('auth/phone'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ phone: phoneValidation.sanitizedValue }),
        },
        API_REQUEST_TIMEOUT
      );
  
      const data = await response.json();
      console.log('Phone update response received:', data);
  
      if (!response.ok) {
        if (response.status === 401) {
          await clearAuth();
          return { success: false, error: 'Session expired. Please login again.' };
        }
        const errorMessage = data.detail || data.message || 'Failed to update phone number';
        return { success: false, error: errorMessage };
      }
  
      // ✅ Update user data from response
      if (data.user) {
        const updatedUser = data.user;
        setUser(updatedUser);
        
        // Update stored user data
        await secureStorage.storeAuthData(token, refreshTokenValue ?? undefined, updatedUser);
        
        console.log('✅ User state updated with phone:', updatedUser.phone);
        console.log('✅ User email:', updatedUser.email);
        
        return { success: true, user: updatedUser };
      }
      
      // ✅ If no user in response, fetch profile
      console.log('⚠️ No user in phone update response, fetching profile...');
      try {
        const profileResponse = await fetchWithTimeout(
          API_ENDPOINTS.PROFILE,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          },
          5000
        );
        
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          setUser(userData);
          await secureStorage.storeAuthData(token, refreshTokenValue ?? undefined, userData);
          console.log('✅ User profile fetched after phone update');
          return { success: true, user: userData };
        }
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Phone update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const sendVerificationCode = async (phone: string): Promise<VerificationResult> => {
    try {
      console.log('Sending verification code');
      
      const phoneValidation = InputValidator.validatePhone(phone);
      if (!phoneValidation.isValid) {
        return { success: false, error: phoneValidation.error };
      }
      
      const response = await fetchWithTimeout(
        createApiUrl('auth/send-verification'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ phone: phoneValidation.sanitizedValue }),
        },
        API_REQUEST_TIMEOUT
      );

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Failed to send verification code';
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      console.error('Send verification code error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const verifyPhone = async (phone: string, code: string): Promise<VerificationResult> => {
    try {
      console.log('Verifying phone number');
      
      const phoneValidation = InputValidator.validatePhone(phone);
      if (!phoneValidation.isValid) {
        return { success: false, error: phoneValidation.error };
      }

      if (!code || code.length !== 6) {
        return { success: false, error: 'Please enter a valid 6-digit code' };
      }
      
      const response = await fetchWithTimeout(
        createApiUrl('auth/verify-phone'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ 
            phone: phoneValidation.sanitizedValue, 
            code: code.trim() 
          }),
        },
        API_REQUEST_TIMEOUT
      );

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Invalid verification code';
        return { success: false, error: errorMessage };
      }

      // Update user data with verified phone
      if (data.user) {
        setUser(data.user);
        await secureStorage.storeAuthData(token!, refreshTokenValue??undefined, data.user);
      }

      return { success: true };
    } catch (error) {
      console.error('Verify phone error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out...');
      
      // Call logout endpoint if token exists
      if (token) {
        try {
          await fetchWithTimeout(
            createApiUrl('auth/logout'),
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            },
            5000
          );
        } catch (error) {
          console.warn('Logout endpoint error (ignoring):', error);
        }
      }
      
      await clearAuth();
      console.log('Logout completed');
    } catch (error) {
      console.error('Error during logout:', error);
      await clearAuth();
    }
  };

  const updateProfile = async (updatedData: UpdateProfileData): Promise<UpdateProfileResult> => {
    try {
      if (!token) {
        return { success: false, error: 'Not authenticated. Please login again.' };
      }

      // Validate name if provided
      if (updatedData.name) {
        const nameValidation = InputValidator.validateName(updatedData.name);
        if (!nameValidation.isValid) {
          return { success: false, error: nameValidation.error };
        }
        updatedData.name = nameValidation.sanitizedValue;
      }

      const response = await fetchWithTimeout(
        API_ENDPOINTS.PROFILE,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        },
        API_REQUEST_TIMEOUT
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          await clearAuth();
          return { success: false, error: 'Session expired. Please login again.' };
        }
        const errorMessage = data.detail || data.message || 'Profile update failed';
        return { success: false, error: errorMessage };
      }

      setUser(data.user);
      await secureStorage.storeAuthData(token, refreshTokenValue??undefined, data.user);

      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };
  
  const handleTokenRefresh = async (): Promise<boolean> => {
    try {
      if (!refreshTokenValue) {
        console.log('No refresh token available');
        return false;
      }
  
      console.log('🔄 Attempting to refresh access token...');
      
      const response = await fetchWithTimeout(
        API_ENDPOINTS.REFRESH_TOKEN,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshTokenValue }),
        },
        10000
      );
      console.log("refresh response: ",response)
      if (!response.ok) {
        console.log('Token refresh failed, status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.log('Refresh error:', errorData);
        
        // Only clear auth if it's definitely invalid (401/403)
        if (response.status === 401 || response.status === 403) {
          console.log('🚪 Refresh token invalid, clearing auth');
          await clearAuth();
          return false;
        }
        
        return false;
      }
  
      const data = await response.json();
      console.log('✅ Token refreshed successfully');
      
      // ✅ UPDATE ONLY ACCESS TOKEN (keep existing refresh token)
      const newAccessToken = data.access_token;
      
      setToken(newAccessToken);
      // refreshTokenValue stays the same - no update needed
  
      // ✅ SAVE NEW ACCESS TOKEN WITH EXISTING REFRESH TOKEN
      await secureStorage.storeAuthData(
        newAccessToken,
        refreshTokenValue, // ✅ Keep the same refresh token
        user
      );
  
      console.log('💾 New access token stored successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    apiUrl: API_BASE_URL,
    login,
    googleLogin,
    register,
    updatePhone,
    sendVerificationCode,
    verifyPhone,
    logout,
    updateProfile,
    handleTokenStorage,
    refreshToken: handleTokenRefresh,
    reloadAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};