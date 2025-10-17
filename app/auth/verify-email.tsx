import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { createApiUrl, API_ENDPOINTS } from '../../config/apiConfig';
import { useAuth } from '../../contexts/AuthContext';
import { secureStorage } from '../../utils/secureStorage';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams();
  const { token: contextToken } = useAuth();  // ✅ Get token from context to trigger re-render
  const [email] = useState(params.email as string);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCodeDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '');
    
    const newCodeDigits = [...codeDigits];
    newCodeDigits[index] = digit;
    setCodeDigits(newCodeDigits);
    
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
    
    const fullCode = newCodeDigits.join('');
    if (fullCode.length === 6 && !loading) {
      handleVerifyCode(fullCode);
    }
  };

  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || codeDigits.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(createApiUrl('auth/verify-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: codeToVerify,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Email verified, received tokens');
        
        // ✅ Store auth data
        await secureStorage.storeAuthData(
          data.access_token,
          data.refresh_token,
          null
        );
        
        console.log('✅ Tokens stored in secure storage');
        
        // ✅ Important: Navigate and let the app reload auth state
        // The app will pick up the stored tokens on next render
        if (data.requires_phone) {
          Alert.alert('Success', 'Email verified! Please add your phone number.', [
            {
              text: 'OK',
              onPress: () => {
                // Use replace to ensure clean navigation
                router.replace('/auth/phone');
              }
            }
          ]);
        } else {
          Alert.alert('Success', 'Email verified successfully!', [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(tabs)');
              }
            }
          ]);
        }
      } else {
        Alert.alert('Error', data.detail || 'Invalid verification code');
        setCodeDigits(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verify code error:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      const response = await fetch(createApiUrl('auth/resend-verification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Verification code sent again');
        setCountdown(60);
        setCanResend(false);
        setCodeDigits(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', data.detail || 'Failed to resend code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Email</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Ionicons name="mail-outline" size={64} color="#007AFF" style={styles.icon} />
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to {email}
          </Text>

          <View style={styles.codeInputContainer}>
            {codeDigits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {codeInputRefs.current[index] = ref;}}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                  loading && styles.codeInputDisabled
                ]}
                value={digit}
                onChangeText={(value) => handleCodeDigitChange(index, value)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={() => handleVerifyCode()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={!canResend || loading}
            >
              <Text style={[styles.linkText, (!canResend || loading) && styles.linkTextDisabled]}>
                {canResend ? 'Resend' : `Resend in ${countdown}s`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    width: '100%',
    paddingHorizontal: 20,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#fff',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  codeInputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  linkTextDisabled: {
    color: '#ccc',
  },
});