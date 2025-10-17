import Constants from 'expo-constants';

// ✅ Make sure API_BASE_URL doesn't have trailing slash
const rawApiUrl = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
  process.env.EXPO_PUBLIC_API_URL || 
  'http://10.0.0.88:8000/api';

// Remove trailing slashes
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

console.log('Using API URL:', API_BASE_URL);

export const API_ENDPOINTS = {
  // Auth endpoints - ✅ Single slash only
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  PROFILE: `${API_BASE_URL}/auth/profile`,
  UPDATE_PHONE: `${API_BASE_URL}/auth/phone`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  RESEND_VERIFICATION: `${API_BASE_URL}/auth/resend-verification`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  
  // Cart - ✅ Single slash
  CART: `${API_BASE_URL}/cart`,
  CART_COUNT: `${API_BASE_URL}/cart/count`,
  CART_ADD: `${API_BASE_URL}/cart/add`,
  CART_REMOVE: `${API_BASE_URL}/cart/remove`,
  CART_UPDATE: `${API_BASE_URL}/cart/update`,

  // Address - ✅ Single slash
  ADDRESSES: `${API_BASE_URL}/address`,
  
  // Orders - ✅ Single slash
  ORDERS: `${API_BASE_URL}/orders`,
  ACTIVE_ORDER: `${API_BASE_URL}/orders/active`,
  MY_ORDERS: `${API_BASE_URL}/orders/my`,
  
  // Notifications - ✅ Single slash
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  UNREAD_COUNT: `${API_BASE_URL}/notifications/unread-count`,
  
  // Products - ✅ Single slash
  PRODUCTS: `${API_BASE_URL}/products`,

  CATEGORIES: `${API_BASE_URL}/categories`,
  BRANDS: `${API_BASE_URL}/brands`,

  // Settings
  SETTINGS: `${API_BASE_URL}/settings/public`,

  // // User & Address Services - Fixed the paths
  USER_ADDRESS: `${API_BASE_URL}/address`,
  GEOCODE: `${API_BASE_URL}/geocode`, 
  REVERSE_GEOCODE: `${API_BASE_URL}/reverse-geocode`,
  MY_ADDRESS: `${API_BASE_URL}/address/my`,

};

export const createApiUrl = (endpoint: string) => {
  // Remove any leading slashes from endpoint
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  
  // Construct URL with single slash
  const url = `${API_BASE_URL}/${cleanEndpoint}`;
  
  // Debug: log the URL being created
  console.log(`📍 Creating URL: "${endpoint}" -> "${url}"`);
  
  return url;
};

export const API_REQUEST_TIMEOUT = 15000;