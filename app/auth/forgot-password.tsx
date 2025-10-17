// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ScrollView,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { router } from 'expo-router';
// import { createApiUrl } from '../../config/apiConfig';
// import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

// export default function ForgotPasswordScreen() {
//   const [email, setEmail] = useState('');
//   const [loading, setLoading] = useState(false);

//   const validateEmail = (email: string): boolean => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email.trim());
//   };

//   const handleForgotPassword = async () => {
//     if (!email.trim()) {
//       Alert.alert('Error', 'Please enter your email address');
//       return;
//     }

//     if (!validateEmail(email)) {
//       Alert.alert('Error', 'Please enter a valid email address');
//       return;
//     }

//     setLoading(true);
//     try {
//       console.log('Sending forgot password request for:', email);
      
//       const response = await fetchWithTimeout(
//         createApiUrl('auth/forgot-password'),
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ email: email.trim().toLowerCase() }),
//         },
//         15000
//       );
      
//       const data = await response.json();
//       console.log('Forgot password response:', data);
      
//       if (response.ok) {
//         Alert.alert(
//           'Reset Link Sent', 
//           'If an account with this email exists, you will receive a password reset link shortly. Please check your email.',
//           [
//             { 
//               text: 'OK', 
//               onPress: () => router.back() 
//             }
//           ]
//         );
//       } else {
//         const errorMessage = data.detail || data.message || 'Failed to send reset link';
//         Alert.alert('Error', errorMessage);
//       }
//     } catch (error) {
//       console.error('Forgot password error:', error);
//       Alert.alert(
//         'Error', 
//         'Network error. Please check your connection and try again.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
//     >
//       <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
//         <View style={styles.content}>
//           <Text style={styles.title}>Forgot Password</Text>
//           <Text style={styles.subtitle}>
//             Enter your email address and we'll send you a link to reset your password
//           </Text>

//           <View style={styles.form}>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter your email address"
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               autoComplete="email"
//               returnKeyType="done"
//               onSubmitEditing={handleForgotPassword}
//               editable={!loading}
//             />
            
//             <TouchableOpacity
//               style={[styles.button, loading && styles.buttonDisabled]}
//               onPress={handleForgotPassword}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <Text style={styles.buttonText}>Send Reset Link</Text>
//               )}
//             </TouchableOpacity>
//           </View>

//           <View style={styles.footer}>
//             <Text style={styles.footerText}>Remember your password? </Text>
//             <TouchableOpacity 
//               onPress={() => router.back()}
//               disabled={loading}
//             >
//               <Text style={[styles.linkText, loading && styles.linkTextDisabled]}>
//                 Back to Login
//               </Text>
//             </TouchableOpacity>
//           </View>
          
//           <View style={styles.helpSection}>
//             <Text style={styles.helpTitle}>Need Help?</Text>
//             <Text style={styles.helpText}>
//               • Make sure you enter the email address you used to register{'\n'}
//               • Check your spam/junk folder for the reset email{'\n'}
//               • The reset link will expire in 1 hour{'\n'}
//               • Contact support if you continue to have issues
//             </Text>
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     backgroundColor: '#f5f5f5',
//     justifyContent: 'center',
//   },
//   content: {
//     padding: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 10,
//     color: '#333',
//   },
//   subtitle: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 30,
//     color: '#666',
//     lineHeight: 22,
//   },
//   form: {
//     marginBottom: 30,
//   },
//   input: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     fontSize: 16,
//   },
//   button: {
//     backgroundColor: '#007AFF',
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   buttonDisabled: {
//     backgroundColor: '#ccc',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   footer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginBottom: 30,
//   },
//   footerText: {
//     color: '#666',
//     fontSize: 16,
//   },
//   linkText: {
//     color: '#007AFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   linkTextDisabled: {
//     color: '#ccc',
//   },
//   helpSection: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   helpTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 10,
//   },
//   helpText: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
// });

import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createApiUrl } from '../../config/apiConfig';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending forgot password request for:', email);
      
      const response = await fetchWithTimeout(
        createApiUrl('auth/forgot-password'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        },
        15000
      );
      
      const data = await response.json();
      console.log('Forgot password response:', data);
      
      if (response.ok) {
        Alert.alert(
          'Code Sent', 
          'If an account with this email exists, you will receive a password reset code. Please check your email.',
          [
            { 
              text: 'OK', 
              onPress: () => router.push({
                pathname: '/auth/reset-password',
                params: { email: email.trim().toLowerCase() }
              })
            }
          ]
        );
      } else {
        const errorMessage = data.detail || data.message || 'Failed to send reset code';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert(
        'Error', 
        'Network error. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Ionicons name="lock-closed-outline" size={64} color="#007AFF" style={styles.icon} />
          
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a code to reset your password
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleForgotPassword}
              editable={!loading}
            />
            
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <TouchableOpacity 
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={[styles.linkText, loading && styles.linkTextDisabled]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              • Make sure you enter the email address you used to register{'\n'}
              • Check your spam/junk folder for the reset email{'\n'}
              • The reset code will expire in 10 minutes{'\n'}
              • Contact support if you continue to have issues
            </Text>
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
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  icon: {
    alignSelf: 'center',
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
  form: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
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
  linkTextDisabled: {
    color: '#ccc',
  },
  helpSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});