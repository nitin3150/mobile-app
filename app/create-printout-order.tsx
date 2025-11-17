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
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';

const SERVICE_TYPES = [
  { id: 'printouts', label: 'Document Printouts', icon: 'document-text' },
  { id: 'photo', label: 'Photo Prints', icon: 'images' },
];

const PRINT_SIZES = {
  printouts: [
    { id: 'a4', label: 'A4', price: 5 },
    { id: 'a3', label: 'A3', price: 15 },
    { id: 'legal', label: 'Legal', price: 7 },
  ],
  photo: [
    { id: '4x6', label: '4x6 inches', price: 10 },
    { id: '5x7', label: '5x7 inches', price: 15 },
    { id: '8x10', label: '8x10 inches', price: 25 },
    { id: 'passport', label: 'Passport Size', price: 5 },
  ],
};

const COLOR_OPTIONS = [
  { id: 'bw', label: 'Black & White', multiplier: 1 },
  { id: 'color', label: 'Color', multiplier: 2 },
];

interface UploadedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export default function CreatePrintoutOrderScreen() {
  const { user } = useAuth();
  
  const [serviceType, setServiceType] = useState<'printouts' | 'photo'>('printouts');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [colorOption, setColorOption] = useState<string>('bw');
  const [copies, setCopies] = useState('1');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // ✅ Custom Dropdown State
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  // Calculate total price
  const calculatePrice = () => {
    if (!selectedSize || uploadedFiles.length === 0) return 0;
    
    const sizes = PRINT_SIZES[serviceType];
    const sizePrice = sizes.find(s => s.id === selectedSize)?.price || 0;
    const colorMultiplier = COLOR_OPTIONS.find(c => c.id === colorOption)?.multiplier || 1;
    const numCopies = parseInt(copies) || 1;
    const numFiles = uploadedFiles.length;
    
    return sizePrice * colorMultiplier * numCopies * numFiles;
  };

  // ✅ UNIFIED FILE PICKER
  const handleFilePicker = async () => {
    Alert.alert(
      'Upload Files',
      'Choose upload method',
      [
        {
          text: 'Take Photo',
          onPress: handleCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: handleGallery,
        },
        {
          text: 'Select Documents',
          onPress: handleDocuments,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCamera = async () => {
    try {
      setUploading(true);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera');
        setUploading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newFile: UploadedFile = {
          uri: result.assets[0].uri,
          name: `Camera_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: result.assets[0].fileSize,
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setUploading(false);
    }
  };

  const handleGallery = async () => {
    try {
      setUploading(true);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        setUploading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newFiles: UploadedFile[] = result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: `Image_${Date.now()}_${index}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize,
        }));
        
        setUploadedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick images');
    } finally {
      setUploading(false);
    }
  };

  const handleDocuments = async () => {
    try {
      setUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: UploadedFile[] = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        }));
        
        setUploadedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick documents');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    if (uploadedFiles.length === 0) {
      Alert.alert('Error', 'Please upload at least one file');
      return;
    }

    if (!selectedSize) {
      Alert.alert('Error', 'Please select a print size');
      return;
    }

    const numCopies = parseInt(copies);
    if (!numCopies || numCopies < 1) {
      Alert.alert('Error', 'Please enter valid number of copies');
      return;
    }

    if (numCopies > 100) {
      Alert.alert('Error', 'Maximum 100 copies allowed');
      return;
    }

    router.push({
      pathname: '/checkout',
      params: {
        isPrintoutOrder: 'true',
        printoutData: JSON.stringify({
          serviceType,
          files: uploadedFiles,
          size: selectedSize,
          colorOption,
          copies: numCopies,
          description: description.trim(),
          totalPrice: calculatePrice(),
        }),
      },
    });
  };

  // ✅ Get selected size label
  const getSelectedSizeLabel = () => {
    if (!selectedSize) return 'Choose size...';
    const size = PRINT_SIZES[serviceType].find(s => s.id === selectedSize);
    return size ? `${size.label} - ₹${size.price}/page` : 'Choose size...';
  };

  const totalPrice = calculatePrice();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Print Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Service</Text>
          <View style={styles.serviceTypeContainer}>
            {SERVICE_TYPES.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceTypeCard,
                  serviceType === service.id && styles.serviceTypeCardSelected,
                ]}
                onPress={() => {
                  setServiceType(service.id as 'printouts' | 'photo');
                  setSelectedSize('');
                  setUploadedFiles([]);
                }}
              >
                <Ionicons
                  name={service.icon as any}
                  size={32}
                  color={serviceType === service.id ? '#007AFF' : '#666'}
                />
                <Text
                  style={[
                    styles.serviceTypeLabel,
                    serviceType === service.id && styles.serviceTypeLabelSelected,
                  ]}
                >
                  {service.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SINGLE UPLOAD BUTTON */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Files</Text>
          
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleFilePicker}
            disabled={uploading}
          >
            <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
            <Text style={styles.uploadButtonTitle}>Upload Files</Text>
            <Text style={styles.uploadButtonSubtitle}>
              Photos, PDFs, Documents
            </Text>
          </TouchableOpacity>

          {uploading && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <View style={styles.filesContainer}>
              <Text style={styles.filesTitle}>
                Uploaded Files ({uploadedFiles.length})
              </Text>
              {uploadedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  {file.type.startsWith('image/') && (
                    <Image source={{ uri: file.uri }} style={styles.fileThumbnail} />
                  )}
                  {!file.type.startsWith('image/') && (
                    <View style={styles.fileIconContainer}>
                      <Ionicons name="document-text" size={24} color="#007AFF" />
                    </View>
                  )}
                  
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    {file.size && (
                      <Text style={styles.fileSize}>
                        {(file.size / 1024).toFixed(2)} KB
                      </Text>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFile(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ✅ CUSTOM DROPDOWN FOR SIZE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Size</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowSizeDropdown(true)}
          >
            <Text style={[styles.dropdownButtonText, !selectedSize && styles.dropdownPlaceholder]}>
              {getSelectedSizeLabel()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Color Option */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Print Type</Text>
          <View style={styles.colorContainer}>
            {COLOR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.colorOption,
                  colorOption === option.id && styles.colorOptionSelected,
                ]}
                onPress={() => setColorOption(option.id)}
              >
                <View
                  style={[
                    styles.colorRadio,
                    colorOption === option.id && styles.colorRadioSelected,
                  ]}
                >
                  {colorOption === option.id && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text
                  style={[
                    styles.colorLabel,
                    colorOption === option.id && styles.colorLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Number of Copies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Copies</Text>
          <View style={styles.copiesContainer}>
            <TouchableOpacity
              style={styles.copiesButton}
              onPress={() => {
                const num = parseInt(copies) || 1;
                if (num > 1) setCopies(String(num - 1));
              }}
            >
              <Ionicons name="remove" size={24} color="#007AFF" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.copiesInput}
              value={copies}
              onChangeText={(text) => {
                const num = text.replace(/[^0-9]/g, '');
                setCopies(num || '1');
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
            
            <TouchableOpacity
              style={styles.copiesButton}
              onPress={() => {
                const num = parseInt(copies) || 1;
                if (num < 100) setCopies(String(num + 1));
              }}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.copiesHint}>Maximum 100 copies</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add any special printing instructions..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Price Summary */}
        {totalPrice > 0 && (
          <View style={styles.section}>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Files:</Text>
                <Text style={styles.priceValue}>{uploadedFiles.length}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Copies per file:</Text>
                <Text style={styles.priceValue}>{copies}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total pages/photos:</Text>
                <Text style={styles.priceValue}>
                  {uploadedFiles.length * parseInt(copies)}
                </Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>₹{totalPrice}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (uploadedFiles.length === 0 || !selectedSize) && styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={uploadedFiles.length === 0 || !selectedSize}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout {totalPrice > 0 && `(₹${totalPrice})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ CUSTOM SIZE DROPDOWN MODAL */}
      <Modal
        visible={showSizeDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSizeDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSizeDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Size</Text>
              <TouchableOpacity onPress={() => setShowSizeDropdown(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PRINT_SIZES[serviceType]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedSize === item.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedSize(item.id);
                    setShowSizeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {item.label} - ₹{item.price}/page
                  </Text>
                  {selectedSize === item.id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  
  serviceTypeContainer: { flexDirection: 'row', gap: 12 },
  serviceTypeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  serviceTypeCardSelected: { borderColor: '#007AFF', backgroundColor: '#E3F2FD' },
  serviceTypeLabel: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  serviceTypeLabelSelected: { fontWeight: '600', color: '#007AFF' },
  
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: '#F0F8FF',
  },
  uploadButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 12,
  },
  uploadButtonSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  uploadingText: { fontSize: 14, color: '#666' },
  
  filesContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  filesTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  fileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 2 },
  fileSize: { fontSize: 12, color: '#999' },
  removeButton: { padding: 4 },
  
  // ✅ CUSTOM DROPDOWN STYLES
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 400,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },
  
  colorContainer: { gap: 12 },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  colorOptionSelected: { borderColor: '#007AFF', backgroundColor: '#E3F2FD' },
  colorRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorRadioSelected: { borderColor: '#007AFF', backgroundColor: '#007AFF' },
  colorLabel: { fontSize: 15, color: '#666' },
  colorLabelSelected: { fontWeight: '600', color: '#007AFF' },
  
  copiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  copiesButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiesInput: {
    width: 100,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    color: '#333',
  },
  copiesHint: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 8 },
  
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  characterCount: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 4 },
  
  priceCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: { fontSize: 14, color: '#666' },
  priceValue: { fontSize: 14, fontWeight: '500', color: '#333' },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#90CAF9',
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#007AFF' },
  
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonDisabled: { backgroundColor: '#ccc' },
  checkoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});