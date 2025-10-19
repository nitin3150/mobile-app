// components/home/ShopClosedModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './ShopClosedModal.styles';

interface ShopClosedModalProps {
  visible: boolean;
  onClose: () => void;
  reopenTime: string | null;
  reason: string | null;
}

export const ShopClosedModal: React.FC<ShopClosedModalProps> = ({
  visible,
  onClose,
  reopenTime,
  reason,
}) => {
  const formatReopenTime = (timeStr: string | null) => {
    if (!timeStr) return 'soon';
    
    try {
      const date = new Date(timeStr);
      const now = new Date();
      
      // Check if today
      const isToday = date.toDateString() === now.toDateString();
      
      // Check if tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();
      
      const timeString = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      if (isToday) {
        return `today at ${timeString}`;
      } else if (isTomorrow) {
        return `tomorrow at ${timeString}`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.error('Error formatting reopen time:', error);
      return 'soon';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={64} color="#FF9500" />
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>We're Currently Closed</Text>

          {/* Message */}
          <Text style={styles.modalMessage}>
            {reason || 'Our shop is temporarily closed.'}
          </Text>

          {/* Reopen Time */}
          {reopenTime && (
            <View style={styles.reopenTimeContainer}>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <Text style={styles.reopenTimeText}>
                We'll be back {formatReopenTime(reopenTime)}
              </Text>
            </View>
          )}

          {/* Information Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              You can browse our products, but orders cannot be placed until we reopen.
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};