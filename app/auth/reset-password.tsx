// import { router, useLocalSearchParams } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { createApiUrl } from '../../config/apiConfig';
// import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [token, setToken] = useState('');

//       Alert.alert('Error', 'Invalid reset link', [
//         { text: 'OK', onPress: () => router.replace('/auth/login') }
//       ]);
//     }
//   }, [params.token]);

//     }
//     return null;
//   };

//   const handleResetPassword = async () => {
//     if (!token) {
//       Alert.alert('Error', 'Reset token is missing');
//       return;
//     }


//     if (newPassword !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match');
//       return;
//     }

//     setLoading(true);
//     try {
//       console.log('Resetting password with token:', token.substring(0, 10) + '...');
      
//         15000
//       );
      
//       const data = await response.json();
//       console.log('Reset password response:', data);
      
//   };

//   const getPasswordStrength = (password: string): { strength: string; color: string } => {
//     if (!password) return { strength: '', color: '#ccc' };
    
    
//     if (score < 3) return { strength: 'Weak', color: '#FF3B30' };
//     if (score < 5) return { strength: 'Medium', color: '#FF9500' };
//     return { strength: 'Strong', color: '#34C759' };
//   };

//   const passwordStrength = getPasswordStrength(newPassword);

//       <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
//         <View style={styles.content}>
//           <Ionicons name="lock-closed" size={64} color="#007AFF" style={styles.icon} />
          
//           <Text style={styles.title}>Reset Your Password</Text>
//           <Text style={styles.subtitle}>
//             Choose a strong new password for your account
//           </Text>

//                   size={20} 
//                   color="#666" 
//                 />
//               </TouchableOpacity>
//             </View>

//               </View>
//             )}
            
//                   size={20} 
//                   color="#666" 
//                 />
//               </TouchableOpacity>
//             </View>

//             {confirmPassword.length > 0 && newPassword !== confirmPassword && (
//               <Text style={styles.errorText}>Passwords do not match</Text>
//             )}
            


// });

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createApiUrl } from '../../config/apiConfig';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const [email] = useState(params.email as string);
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      handleVerifyOTP(fullCode);
    }
  };

  const handleVerifyOTP = async (code?: string) => {
    const codeToVerify = code || codeDigits.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithTimeout(
        createApiUrl('auth/verify-reset-otp'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            otp: codeToVerify,
          }),
        },
        15000
      );
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Code verified! Now set your new password.');
        setStep('password');
      } else {
        Alert.alert('Error', data.detail || 'Invalid or expired code');
        setCodeDigits(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      const response = await fetchWithTimeout(
        createApiUrl('auth/forgot-password'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        },
        15000
      );
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Reset code sent again');
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

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleResetPassword = async () => {
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithTimeout(
        createApiUrl('auth/reset-password'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: email,
            otp: codeDigits.join(''),
            new_password: newPassword 
          }),
        },
        15000
      );
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been reset successfully. You can now log in with your new password.',
          [
            { 
              text: 'Go to Login', 
              onPress: () => router.replace('/auth/login') 
            }
          ]
        );
      } else {
        const errorMessage = data.detail || data.message || 'Failed to reset password';
        Alert.alert('Reset Failed', errorMessage);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert(
        'Error', 
        'Network error. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (!password) return { strength: '', color: '#ccc' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[@$!%*?&])/.test(password)) score++;
    
    if (score < 2) return { strength: 'Weak', color: '#FF3B30' };
    if (score < 4) return { strength: 'Medium', color: '#FF9500' };
    return { strength: 'Strong', color: '#34C759' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const renderOTPStep = () => (
    <View style={styles.stepContent}>
      <Ionicons name="mail-outline" size={64} color="#007AFF" style={styles.icon} />
      <Text style={styles.title}>Enter Reset Code</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to {email}
      </Text>

      <View style={styles.codeInputContainer}>
        {codeDigits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (codeInputRefs.current[index] = ref)}
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
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => handleVerifyOTP()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify Code</Text>
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
  );

  const renderPasswordStep = () => (
    <View style={styles.stepContent}>
      <Ionicons name="lock-closed" size={64} color="#007AFF" style={styles.icon} />
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>
        Choose a strong new password for your account
      </Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <Text style={styles.strengthLabel}>Password Strength: </Text>
            <Text style={[styles.strengthValue, { color: passwordStrength.color }]}>
              {passwordStrength.strength}
            </Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={loading}
          >
            <Ionicons 
              name={showConfirmPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
        <View style={styles.requirement}>
          <Ionicons 
            name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'} 
            size={16} 
            color={newPassword.length >= 6 ? '#34C759' : '#ccc'} 
          />
          <Text style={styles.requirementText}>At least 6 characters</Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {step === 'otp' ? renderOTPStep() : renderPasswordStep()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  stepContent: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
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
    lineHeight: 22,
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
  form: {
    marginBottom: 30,
    width: '100%',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    paddingRight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  strengthLabel: {
    fontSize: 14,
    color: '#666',
  },
  strengthValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
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
  requirementsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});