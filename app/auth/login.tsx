import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// TODO: Replace these with your actual Google OAuth client IDs
const GOOGLE_WEB_CLIENT_ID = '1029983278193-mtp0p9h5njv6fodimh0glnedincv9rq9.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '1029983278193-mgl5t7mtqajk2a3vocs6qchbir317o9q.apps.googleusercontent.com';

export default function LoginScreen() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin } = useAuth();


  useEffect(() => {
    console.log('📱 Login screen mounted');
  }, []);
  
  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
      accountName: '',
    });
  }, []);

  const signInWithGoogle = async () => {
    if (googleLoading) return;
    
    setGoogleLoading(true);
    try {
      console.log('🔍 Starting Google Sign-In process...');

      // Check if Play Services are available (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      
      console.log('✅ Play Services available');

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful, userInfo structure:', JSON.stringify(userInfo, null, 2));

      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      console.log('✅ Got Google tokens');

      // ✅ FIXED: Handle different userInfo structures
      let email, name, googleId;
      
      if (userInfo.data) {
        email = userInfo.data.user?.email;
        name = userInfo.data.user?.name;
        googleId = userInfo.data.user?.id;
      }

      console.log('📧 Extracted user data:', { email, name, googleId });

      if (!email || !name) {
        throw new Error('Missing required user information from Google');
      }

      // Prepare user data for backend
      const googleUserData = {
        email: email,
        name: name,
        googleId: googleId,
      };

      console.log('📤 Sending Google login data to backend...');
      
      // Send to backend
      const result = await googleLogin(tokens.idToken, googleUserData);
      console.log('✅ Backend response:', result);

      // if (result.success) {
      //   console.log('🎉 Google login successful!');
        
      //   );
      // }
      if (result.success) {
        console.log('🎉 Google login successful!');
        console.log('📱 requires_phone:', result.requires_phone);
        
        if (result.requires_phone) {
          console.log('📱 Phone number required, redirecting...');
          setTimeout(() => {
            router.replace('/auth/phone');
          }, 500);
        } else {
          console.log('🏠 Redirecting to home...');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('ℹ️ User cancelled Google login');
        // User cancelled - no need to show error
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('ℹ️ Google sign-in already in progress');
        Alert.alert('Please Wait', 'Google sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available or outdated');
      } else {
        console.log('❌ Unknown Google Sign-In error:', error);
        Alert.alert('Error', error.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // const handleLogin = async () => {
  //   if (!emailOrPhone || !password) {
  //     Alert.alert('Error', 'Please fill in all fields');
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     console.log('📧 Starting regular login...');
  //     const result = await login(emailOrPhone, password);

  //   }
  // };

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    setLoading(true);
    try {
      console.log('📧 Starting regular login...');
      const result = await login(emailOrPhone, password);
  
      if (result.success) {
        console.log('✅ Regular login successful!');
        console.log('📱 requires_phone:', result.requires_phone);
        
        // ✅ Don't navigate immediately, let the login response determine it
        if (result.requires_phone) {
          console.log('📱 Phone number required, redirecting to phone screen...');
          setTimeout(() => {
            router.replace('/auth/phone');
          }, 500);
        } else {
          console.log('🏠 Redirecting to home...');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 500);
        }
      } else {
        console.error('❌ Regular login failed:', result.error);
        Alert.alert(
          'Login Failed',
          result.error || 'Invalid credentials. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert(
        'Error',
        'Network error. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              editable={!loading && !googleLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              editable={!loading && !googleLoading}
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPassword}
              disabled={loading || googleLoading}
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, (loading || googleLoading) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, (loading || googleLoading) && styles.buttonDisabled]}
              onPress={signInWithGoogle}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={handleRegister}
              disabled={loading || googleLoading}
            >
              <Text style={[styles.linkText, (loading || googleLoading) && styles.disabledText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  form: {
    marginBottom: 30,
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    width: '100%',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  footerText: {
    color: '#666',
    fontSize: 16,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#ccc',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '600',
  },
});