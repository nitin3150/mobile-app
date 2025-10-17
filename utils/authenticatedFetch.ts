import { API_ENDPOINTS } from '../config/apiConfig';

interface AuthContextRef {
  token: string | null;
  refreshTokenValue: string | null;
  setToken: (token: string) => void;
  logout: () => Promise<void>;
}

let authRef: AuthContextRef | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export const setAuthRef = (ref: AuthContextRef) => {
  authRef = ref;
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (!authRef || !authRef.refreshTokenValue) {
    console.log('❌ No refresh token available');
    return null;
  }

  // ✅ If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    console.log('⏳ Already refreshing, waiting...');
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      console.log('🔄 Refreshing token...');
      
      const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: authRef!.refreshTokenValue }),
      });

      if (!response.ok) {
        console.log('❌ Refresh failed, status:', response.status);
        
        if (response.status === 401 || response.status === 403) {
          console.log('🚪 Refresh token invalid, logging out');
          await authRef!.logout();
        }
        
        return null;
      }

      const data = await response.json();
      const newToken = data.access_token;
      
      console.log('✅ Token refreshed successfully');
      
      // Update token in auth context
      authRef!.setToken(newToken);
      
      return newToken;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  if (!authRef) {
    throw new Error('Auth ref not initialized. Make sure AuthProvider is mounted.');
  }

  const makeRequest = async (token: string | null) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };

  // First attempt with current token
  let response = await makeRequest(authRef.token);

  // ✅ If 401, try to refresh and retry ONCE
  if (response.status === 401) {
    console.log('🔄 Got 401, attempting token refresh...');
    
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      console.log('✅ Token refreshed, retrying request...');
      // Retry with new token
      response = await makeRequest(newToken);
    } else {
      console.log('❌ Refresh failed, request will fail');
    }
  }

  return response;
};