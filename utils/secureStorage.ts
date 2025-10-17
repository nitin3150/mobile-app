// // utils/secureStorage.ts
// import * as SecureStore from 'expo-secure-store';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform } from 'react-native';

// export const STORAGE_KEYS = {
//   ACCESS_TOKEN: 'access_token',
//   REFRESH_TOKEN: 'refresh_token',
//   USER_DATA: 'user_data',
//   BIOMETRIC_ENABLED: 'biometric_enabled',
// } as const;

// class SecureStorageManager {
//   async setSecureItem(key: string, value: string): Promise<void> {
//     try {
//       if (Platform.OS === 'web') {
//         await AsyncStorage.setItem(key, value);
//         return;
//       }

//       await SecureStore.setItemAsync(key, value, {
//         requireAuthentication: false,
//         keychainService: 'smartbag_keychain',
//         sharedPreferencesName: 'smartbag_prefs',
//       });
//     } catch (error) {
//       console.error(`Error storing secure item ${key}:`, error);
//       await AsyncStorage.setItem(key, value);
//     }
//   }

//   async getSecureItem(key: string): Promise<string | null> {
//     try {
//       if (Platform.OS === 'web') {
//         return await AsyncStorage.getItem(key);
//       }

//       return await SecureStore.getItemAsync(key, {
//         keychainService: 'smartbag_keychain',
//         sharedPreferencesName: 'smartbag_prefs',
//       });
//     } catch (error) {
//       console.error(`Error retrieving secure item ${key}:`, error);
//       return await AsyncStorage.getItem(key);
//     }
//   }

//   async removeSecureItem(key: string): Promise<void> {
//     try {
//       if (Platform.OS === 'web') {
//         await AsyncStorage.removeItem(key);
//         return;
//       }

//       await SecureStore.deleteItemAsync(key, {
//         keychainService: 'smartbag_keychain',
//         sharedPreferencesName: 'smartbag_prefs',
//       });
//     } catch (error) {
//       console.error(`Error removing secure item ${key}:`, error);
//       await AsyncStorage.removeItem(key);
//     }
//   }

//   async storeAuthData(accessToken: string, refreshToken?: string, userData?: any): Promise<void> {
//     try {
//       await Promise.all([
//         this.setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
//         refreshToken ? this.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken) : Promise.resolve(),
//         userData ? this.setSecureItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)) : Promise.resolve(),
//       ]);
//     } catch (error) {
//       console.error('Error storing auth data:', error);
//       throw new Error('Failed to store authentication data');
//     }
//   }

//   async getAuthData(): Promise<{
//     accessToken: string | null;
//     refreshToken: string | null;
//     userData: any | null;
//   }> {
//     try {
//       const [accessToken, refreshToken, userDataString] = await Promise.all([
//         this.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
//         this.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
//         this.getSecureItem(STORAGE_KEYS.USER_DATA),
//       ]);

//       let userData = null;
//       if (userDataString) {
//         try {
//           userData = JSON.parse(userDataString);
//         } catch (parseError) {
//           console.error('Error parsing user data:', parseError);
//         }
//       }

//       return {
//         accessToken,
//         refreshToken,
//         userData,
//       };
//     } catch (error) {
//       console.error('Error retrieving auth data:', error);
//       return {
//         accessToken: null,
//         refreshToken: null,
//         userData: null,
//       };
//     }
//   }

//   async clearAuthData(): Promise<void> {
//     try {
//       await Promise.all([
//         this.removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
//         this.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
//         this.removeSecureItem(STORAGE_KEYS.USER_DATA),
//       ]);
//     } catch (error) {
//       console.error('Error clearing auth data:', error);
//       throw new Error('Failed to clear authentication data');
//     }
//   }

//   async hasAuthData(): Promise<boolean> {
//     try {
//       const accessToken = await this.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
//       return !!accessToken;
//     } catch (error) {
//       console.error('Error checking auth data:', error);
//       return false;
//     }
//   }
// }

// export const secureStorage = new SecureStorageManager();

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

export const secureStorage = {
  async storeAuthData(
    accessToken: string,
    refreshToken?: string,
    userData?: any
  ): Promise<void> {
    try {
      console.log('💾 Storing auth data...');
      console.log('Token length:', accessToken?.length);
      console.log('User data:', userData ? JSON.stringify(userData) : 'null');
      
      if (accessToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        console.log('✅ Access token stored');
      }
      
      if (refreshToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        console.log('✅ Refresh token stored');
      }
      
      if (userData) {
        const userDataString = JSON.stringify(userData);
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, userDataString);
        console.log('✅ User data stored:', userDataString.substring(0, 100));
      }
      
      console.log('✅ All auth data stored successfully');
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
      throw error;
    }
  },

  async getAuthData(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    userData: any | null;
  }> {
    try {
      console.log('🔍 Reading auth data from secure storage...');
      
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const userDataString = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      
      console.log('Token found:', !!accessToken);
      console.log('Refresh token found:', !!refreshToken);
      console.log('User data string found:', !!userDataString);
      
      let userData = null;
      if (userDataString) {
        try {
          userData = JSON.parse(userDataString);
          console.log('✅ Parsed user data:', JSON.stringify(userData));
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError);
          console.log('Raw user data string:', userDataString);
        }
      }

      return {
        accessToken,
        refreshToken,
        userData,
      };
    } catch (error) {
      console.error('❌ Error reading auth data:', error);
      return {
        accessToken: null,
        refreshToken: null,
        userData: null,
      };
    }
  },

  async clearAuthData(): Promise<void> {
    try {
      console.log('🗑️ Clearing auth data...');
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      console.log('✅ Auth data cleared');
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },
};