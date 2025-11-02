import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { usePorterRequest } from '../contexts/PorterRequestContext';
import { API_BASE_URL } from '../config/apiConfig';
import { authenticatedFetch } from '../utils/authenticatedFetch';

const WEIGHT_CATEGORIES = [
  { id: '1', label: 'Less than 0.5 kg', value: '< 0.5 kg' },
  { id: '2', label: '0.5 - 1 kg', value: '0.5-1 kg' },
  { id: '3', label: '1 - 2 kg', value: '1-2 kg' },
  { id: '4', label: 'More than 2 kg', value: '> 2 kg' },
];

const DIMENSION_CATEGORIES = [
  { id: '1', label: 'Less than 10 cm', value: '< 10 cm' },
  { id: '2', label: '10 - 20 cm', value: '10-20 cm' },
  { id: '3', label: '20 - 50 cm', value: '20-50 cm' },
  { id: '4', label: 'More than 50 cm', value: '> 50 cm' },
];

export default function CreatePorterRequestScreen() {
  const { token } = useAuth();
  const { pickupAddress, deliveryAddress, clearAddresses } = usePorterRequest();
  
  const [description, setDescription] = useState('');
  const [selectedLength, setSelectedLength] = useState<string | null>(null);
  const [selectedBreadth, setSelectedBreadth] = useState<string | null>(null);
  const [selectedHeight, setSelectedHeight] = useState<string | null>(null);
  const [distance, setDistance] = useState('');
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null);
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSelectPickupAddress = () => {
    router.push({
      pathname: '/address',
      params: { 
        from: 'porter-request',
        addressType: 'pickup',
      }
    });
  };

  const handleSelectDeliveryAddress = () => {
    router.push({
      pathname: '/address',
      params: { 
        from: 'porter-request',
        addressType: 'delivery',
      }
    });
  };

  const renderDimensionSelector = (
    title: string,
    selectedValue: string | null,
    onSelect: (value: string) => void
  ) => {
    return (
      <View style={styles.dimensionSection}>
        <Text style={styles.dimensionTitle}>{title}</Text>
        <View style={styles.dimensionOptionsRow}>
          {DIMENSION_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.dimensionOption,
                selectedValue === category.value && styles.dimensionOptionSelected,
              ]}
              onPress={() => onSelect(category.value)}
            >
              <Text
                style={[
                  styles.dimensionOptionText,
                  selectedValue === category.value && styles.dimensionOptionTextSelected,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const handleSubmit = async () => {
    if (!pickupAddress) {
      Alert.alert('Error', 'Please select a pickup address');
      return;
    }

    if (!deliveryAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide package description');
      return;
    }

    if (!selectedLength || !selectedBreadth || !selectedHeight) {
      Alert.alert('Error', 'Please select all package dimensions');
      return;
    }

    if (!selectedWeight) {
      Alert.alert('Error', 'Please select package weight category');
      return;
    }

    if (!distance || parseFloat(distance) <= 0) {
      Alert.alert('Error', 'Please enter estimated distance in kilometers');
      return;
    }

    setSubmitting(true);

    try {
      const requestData = {
        pickup_address: {
          address: pickupAddress.street || pickupAddress.address || '',
          city: pickupAddress.city || '',
          pincode: pickupAddress.pincode || '',
          latitude: pickupAddress.latitude || null,
          longitude: pickupAddress.longitude || null,
        },
        delivery_address: {
          address: deliveryAddress.street || deliveryAddress.address || '',
          city: deliveryAddress.city || '',
          pincode: deliveryAddress.pincode || '',
          latitude: deliveryAddress.latitude || null,
          longitude: deliveryAddress.longitude || null,
        },
        phone: (pickupAddress.mobile_number || pickupAddress.phone || '').replace(/\D/g, ''),
        description: description.trim(),
        dimensions: {
          length: selectedLength,
          breadth: selectedBreadth,
          height: selectedHeight,
          unit: 'cm',
        },
        weight_category: selectedWeight,
        estimated_distance: parseFloat(distance),
        urgent: urgent,
      };

      console.log('📤 Submitting porter request:', JSON.stringify(requestData, null, 2));

      if (requestData.pickup_address.address.length < 10) {
        Alert.alert('Error', 'Pickup address must be at least 10 characters');
        setSubmitting(false);
        return;
      }

      if (requestData.delivery_address.address.length < 10) {
        Alert.alert('Error', 'Delivery address must be at least 10 characters');
        setSubmitting(false);
        return;
      }

      if (requestData.pickup_address.pincode.length !== 6) {
        Alert.alert('Error', 'Pickup pincode must be exactly 6 digits');
        setSubmitting(false);
        return;
      }

      if (requestData.delivery_address.pincode.length !== 6) {
        Alert.alert('Error', 'Delivery pincode must be exactly 6 digits');
        setSubmitting(false);
        return;
      }

      if (requestData.phone.length < 10) {
        Alert.alert('Error', 'Phone number must be at least 10 digits');
        setSubmitting(false);
        return;
      }

      const response = await authenticatedFetch(
        `${API_BASE_URL}/porter/porter-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Success response:', responseData);
        
        clearAddresses();
        
        Alert.alert(
          'Success! 📦',
          'Your porter request has been submitted. You will receive a notification once the estimated cost is available.',
          [
            {
              text: 'View Request',
              onPress: () => {
                router.replace({
                  pathname: '/orders',
                  params: { tab: 'porter' }
                });
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        Alert.alert('Error', errorData.detail || JSON.stringify(errorData) || 'Failed to submit request');
      }
    } catch (error) {
      console.error('💥 Error submitting porter request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          clearAddresses();
          router.back();
        }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Porter Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Address</Text>
          <TouchableOpacity
            style={styles.addressSelector}
            onPress={handleSelectPickupAddress}
          >
            {pickupAddress ? (
              <View style={styles.selectedAddressContent}>
                <View style={styles.addressIconContainer}>
                  <Ionicons name="location" size={24} color="#34C759" />
                </View>
                <View style={styles.selectedAddressInfo}>
                  <Text style={styles.selectedAddressLabel}>
                    {pickupAddress.label || 'Pickup Address'}
                  </Text>
                  <Text style={styles.selectedAddressText} numberOfLines={2}>
                    {pickupAddress.street}
                  </Text>
                  <Text style={styles.selectedAddressSubtext}>
                    {pickupAddress.city} - {pickupAddress.pincode}
                  </Text>
                  {pickupAddress.mobile_number && (
                    <Text style={styles.selectedAddressPhone}>
                      📱 {pickupAddress.mobile_number}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#007AFF" />
              </View>
            ) : (
              <View style={styles.emptyAddressContent}>
                <Ionicons name="location-outline" size={24} color="#999" />
                <Text style={styles.emptyAddressText}>Select pickup address</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TouchableOpacity
            style={styles.addressSelector}
            onPress={handleSelectDeliveryAddress}
          >
            {deliveryAddress ? (
              <View style={styles.selectedAddressContent}>
                <View style={[styles.addressIconContainer, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="location" size={24} color="#FF3B30" />
                </View>
                <View style={styles.selectedAddressInfo}>
                  <Text style={styles.selectedAddressLabel}>
                    {deliveryAddress.label || 'Delivery Address'}
                  </Text>
                  <Text style={styles.selectedAddressText} numberOfLines={2}>
                    {deliveryAddress.street}
                  </Text>
                  <Text style={styles.selectedAddressSubtext}>
                    {deliveryAddress.city} - {deliveryAddress.pincode}
                  </Text>
                  {deliveryAddress.mobile_number && (
                    <Text style={styles.selectedAddressPhone}>
                      📱 {deliveryAddress.mobile_number}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#007AFF" />
              </View>
            ) : (
              <View style={styles.emptyAddressContent}>
                <Ionicons name="location-outline" size={24} color="#999" />
                <Text style={styles.emptyAddressText}>Select delivery address</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Distance</Text>
          <View style={styles.distanceContainer}>
            <Ionicons name="navigate-outline" size={20} color="#007AFF" style={styles.distanceIcon} />
            <TextInput
              style={styles.distanceInput}
              placeholder="Enter distance in kilometers"
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              maxLength={6}
            />
            <Text style={styles.distanceUnit}>km</Text>
          </View>
          <Text style={styles.distanceHint}>
            Approximate distance between pickup and delivery locations
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe your package (e.g., Documents, Electronics, Groceries)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Dimensions</Text>
          {renderDimensionSelector('Length', selectedLength, setSelectedLength)}
          {renderDimensionSelector('Breadth', selectedBreadth, setSelectedBreadth)}
          {renderDimensionSelector('Height', selectedHeight, setSelectedHeight)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weight Category</Text>
          <View style={styles.weightContainer}>
            {WEIGHT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.weightOption,
                  selectedWeight === category.value && styles.weightOptionSelected,
                ]}
                onPress={() => setSelectedWeight(category.value)}
              >
                <View style={[
                  styles.checkbox,
                  selectedWeight === category.value && styles.checkboxSelected
                ]}>
                  {selectedWeight === category.value && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text
                  style={[
                    styles.weightLabel,
                    selectedWeight === category.value && styles.weightLabelSelected,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.urgentOption}
            onPress={() => setUrgent(!urgent)}
          >
            <View style={styles.urgentLeft}>
              <View style={[styles.urgentIcon, urgent && styles.urgentIconActive]}>
                <Ionicons name="flash" size={20} color={urgent ? '#fff' : '#FF9500'} />
              </View>
              <View>
                <Text style={styles.urgentTitle}>Urgent Delivery</Text>
                <Text style={styles.urgentSubtitle}>Higher priority processing</Text>
              </View>
            </View>
            <View style={[styles.toggle, urgent && styles.toggleActive]}>
              <View style={[styles.toggleThumb, urgent && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { flex: 1 },
  section: { backgroundColor: '#fff', marginTop: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  
  addressSelector: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  selectedAddressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedAddressInfo: { flex: 1 },
  selectedAddressLabel: { fontSize: 14, fontWeight: '600', color: '#007AFF', marginBottom: 4 },
  selectedAddressText: { fontSize: 14, color: '#333', marginBottom: 2, lineHeight: 20 },
  selectedAddressSubtext: { fontSize: 12, color: '#999' },
  selectedAddressPhone: { fontSize: 12, color: '#007AFF', marginTop: 4, fontWeight: '500' },
  emptyAddressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  emptyAddressText: { flex: 1, fontSize: 15, color: '#999' },
  
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  distanceIcon: {
    marginRight: 8,
  },
  distanceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  distanceUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  distanceHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
    backgroundColor: '#fff',
  },
  characterCount: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 4 },
  
  dimensionSection: {
    marginBottom: 16,
  },
  dimensionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  dimensionOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimensionOption: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dimensionOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  dimensionOptionText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  dimensionOptionTextSelected: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  
  weightContainer: { gap: 12 },
  weightOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  weightOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  weightLabel: { fontSize: 15, color: '#333' },
  weightLabelSelected: { fontWeight: '600', color: '#007AFF' },
  
  urgentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  urgentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  urgentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentIconActive: { backgroundColor: '#FF9500' },
  urgentTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  urgentSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    padding: 3,
  },
  toggleActive: { backgroundColor: '#FF9500' },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
  
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: { backgroundColor: '#ccc' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});