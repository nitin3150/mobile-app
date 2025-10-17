import { useEffect } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { OrderTrackingProvider } from '../contexts/OrderTrackingContext';
import { View, ActivityIndicator, Text } from 'react-native';

function RootLayoutNav() {
  const { user, loading, token } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) {
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const isPhoneScreen = segments[1] === 'phone';
    const isLoginScreen = segments[1] === 'login';
    const isRegisterScreen = segments[1] === 'register';
    const isVerifyEmailScreen = segments[1] === 'verify-email';

    console.log('🔍 Navigation check:', {
      hasUser: !!user,
      hasToken: !!token,
      userEmail: user?.email,
      userPhone: user?.phone,
      inAuthGroup,
      isPhoneScreen,
      currentSegments: segments,
      loading,
    });

    // Wait for loading to complete
    if (loading) {
      console.log('⏳ Auth still loading...');
      return;
    }

    // ✅ Allow phone screen even when authenticated
    if (isPhoneScreen) {
      console.log('📱 On phone screen, allowing access');
      return;  // Don't redirect away from phone screen
    }

    if (!token || !user) {
      // User is not authenticated
      console.log('🔒 No auth - need to show login');
      if (!inAuthGroup) {
        console.log('➡️ Redirecting to /auth/login');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 100);
      }
    } else {
      // User is authenticated
      console.log('✅ User authenticated:', user.email);
      
      // ✅ Don't redirect away from verification screens
      if (inAuthGroup && !isPhoneScreen && !isVerifyEmailScreen) {
        // Only redirect away from login/register screens
        if (isLoginScreen || isRegisterScreen) {
          console.log('➡️ Redirecting to home from login/register');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 100);
        }
      }
    }
  }, [user, loading, token, segments, navigationState?.key]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (!navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Initializing...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="order-tracking" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OrderTrackingProvider>
        <RootLayoutNav />
      </OrderTrackingProvider>
    </AuthProvider>
  );
}