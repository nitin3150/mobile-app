import { useEffect } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
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

    const inAuthGroup = segments.length > 0 ? segments[0] === 'auth' : false;
    const isPhoneScreen = segments.length > 1 ? segments[1] === 'phone' : false;
    const isLoginScreen = segments.length > 1 ? segments[1] === 'login' : false;
    const isRegisterScreen = segments.length > 1 ? segments[1] === 'register' : false;
    const isVerifyEmailScreen = segments.length > 1 ? segments[1] === 'verify-email' : false;

    if (loading) {
      return;
    }

    if (isPhoneScreen) {
      return;
    }

    if (!token || !user) {
      if (!inAuthGroup) {
        setTimeout(() => {
          router.replace('/auth/login');
        }, 100);
      }
    } else {
      if (inAuthGroup && !isPhoneScreen && !isVerifyEmailScreen) {
        if (isLoginScreen || isRegisterScreen) {
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
      <CartProvider>
        <OrderTrackingProvider>
          <RootLayoutNav />
        </OrderTrackingProvider>
      </CartProvider>
    </AuthProvider>
  );
}