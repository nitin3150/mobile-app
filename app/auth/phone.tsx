// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { useAuth } from "../../contexts/AuthContext";
// import { router } from "expo-router";

// export default function PhoneNumberScreen() {
//   const [phone, setPhone] = useState("");
//   const [displayPhone, setDisplayPhone] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { updatePhone } = useAuth();

//   const formatPhoneNumber = (number: string) => {
//     // Remove all non-digits
//     const cleaned = number.replace(/\D/g, '');
    
//     // Add country code if not present
//     if (cleaned.length === 10) {
//       return `+91${cleaned}`;
//     } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
//       return `+${cleaned}`;
//     }
    
//     return cleaned.length > 0 ? `+${cleaned}` : '';
//   };

//   const handlePhoneChange = (text: string) => {
//     // Remove all non-digits
//     const cleaned = text.replace(/\D/g, '');
    
//     // Limit to 10 digits
//     const limited = cleaned.substring(0, 10);
    
//     // Format for display (XXX-XXX-XXXX)
//     let formatted = limited;
//     if (limited.length >= 6) {
//       formatted = `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
//     } else if (limited.length >= 3) {
//       formatted = `${limited.slice(0, 3)}-${limited.slice(3)}`;
//     }
    
//     setPhone(limited);
//     setDisplayPhone(formatted);
//   };

//   const handleSavePhone = async () => {
//     if (!phone.trim()) {
//       Alert.alert("Error", "Please enter your phone number");
//       return;
//     }

//     if (phone.length !== 10) {
//       Alert.alert("Error", "Please enter a valid 10-digit phone number");
//       return;
//     }

//     const formattedPhone = formatPhoneNumber(phone);
    
//     setLoading(true);
//     try {
//       console.log('Updating phone:', formattedPhone);
//       const result = await updatePhone(formattedPhone);

//       if (result && result.success) {
//         console.log('Phone updated successfully');
//         Alert.alert(
//           "Success", 
//           "Phone number updated successfully!",
//           [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
//         );
//       } else {
//         const errorMessage = result?.error || "Failed to save phone number";
//         console.error('Phone update failed:', errorMessage);
//         Alert.alert("Error", errorMessage);
//       }
//     } catch (error) {
//       console.error("Phone update error:", error);
//       Alert.alert("Error", "Network error. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <View style={styles.container}>
//         <Text style={styles.title}>Enter Your Phone Number</Text>
//         <Text style={styles.subtitle}>
//           Phone number is required to complete your registration and for order updates
//         </Text>

//         <View style={styles.phoneInputContainer}>
//           <Text style={styles.countryCode}>+91</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Enter 10-digit phone number"
//             value={displayPhone}
//             onChangeText={handlePhoneChange}
//             keyboardType="phone-pad"
//             maxLength={12} // XXX-XXX-XXXX format
//             returnKeyType="done"
//             onSubmitEditing={handleSavePhone}
//             editable={!loading}
//           />
//         </View>

//         <TouchableOpacity
//           style={[styles.button, (loading || phone.length < 10) && styles.buttonDisabled]}
//           onPress={handleSavePhone}
//           disabled={loading || phone.length < 10}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.buttonText}>Complete Registration</Text>
//           )}
//         </TouchableOpacity>

//         <Text style={styles.helperText}>
//           Your phone number will be used for order updates, delivery notifications, and account security
//         </Text>

//         <Text style={styles.requiredText}>
//           * Phone number is required to continue
//         </Text>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#f5f5f5",
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "bold",
//     color: "#333",
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "#666",
//     textAlign: "center",
//     marginBottom: 40,
//     lineHeight: 22,
//   },
//   phoneInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 20,
//     width: "100%",
//   },
//   countryCode: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#333",
//     paddingRight: 10,
//     borderRightWidth: 1,
//     borderRightColor: "#ddd",
//     marginRight: 15,
//     paddingVertical: 15,
//   },
//   input: {
//     flex: 1,
//     backgroundColor: "#fff",
//     padding: 15,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     fontSize: 16,
//   },
//   button: {
//     backgroundColor: "#007AFF",
//     padding: 16,
//     borderRadius: 8,
//     alignItems: "center",
//     width: "100%",
//     marginBottom: 20,
//   },
//   buttonDisabled: {
//     backgroundColor: "#ccc",
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   helperText: {
//     fontSize: 12,
//     color: "#666",
//     textAlign: "center",
//     lineHeight: 16,
//     paddingHorizontal: 20,
//     marginBottom: 10,
//   },
//   requiredText: {
//     fontSize: 12,
//     color: "#e74c3c",
//     textAlign: "center",
//     fontWeight: "500",
//   },
// });

import React, { useState } from "react";
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
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { router } from "expo-router";

export default function PhoneNumberScreen() {
  const [phone, setPhone] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { updatePhone } = useAuth();

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    
    return cleaned.length > 0 ? `+${cleaned}` : '';
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.substring(0, 10);
    
    let formatted = limited;
    if (limited.length >= 6) {
      formatted = `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
    } else if (limited.length >= 3) {
      formatted = `${limited.slice(0, 3)}-${limited.slice(3)}`;
    }
    
    setPhone(limited);
    setDisplayPhone(formatted);
  };

  const handleSavePhone = async () => {
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (phone.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    setLoading(true);
    try {
      console.log('Updating phone:', formattedPhone);
      const result = await updatePhone(formattedPhone);

      if (result && result.success) {
        console.log('Phone updated successfully');
        Alert.alert(
          "Success", 
          "Phone number updated successfully!",
          [{ 
            text: "OK", 
            onPress: () => router.replace("/(tabs)") 
          }]
        );
      } else {
        const errorMessage = result?.error || "Failed to save phone number";
        console.error('Phone update failed:', errorMessage);
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("Phone update error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Enter Your Phone Number</Text>
        <Text style={styles.subtitle}>
          Phone number is required to complete your registration and for order updates
        </Text>

        <View style={styles.phoneInputContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit phone number"
            value={displayPhone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={12}
            returnKeyType="done"
            onSubmitEditing={handleSavePhone}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, (loading || phone.length < 10) && styles.buttonDisabled]}
          onPress={handleSavePhone}
          disabled={loading || phone.length < 10}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Complete Registration</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Your phone number will be used for order updates, delivery notifications, and account security
        </Text>

        <Text style={styles.requiredText}>
          * Phone number is required to continue
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    marginRight: 15,
    paddingVertical: 15,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  requiredText: {
    fontSize: 12,
    color: "#e74c3c",
    textAlign: "center",
    fontWeight: "500",
  },
});