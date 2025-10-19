// components/order-tracking/TipSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './TipSection.styles';

interface TipSectionProps {
  selectedTip: number | null;
  onSelectTip: (amount: number) => void;
  saving: boolean;
  orderStatus: string;
  tipAmount?: number;
}

export const TipSection: React.FC<TipSectionProps> = ({
  selectedTip,
  onSelectTip,
  saving,
  orderStatus,
  tipAmount,
}) => {
  // Don't show if tip already added
  if (tipAmount && tipAmount > 0) {
    return (
      <View style={styles.tipAddedSection}>
        <Ionicons name="heart" size={24} color="#E74C3C" />
        <Text style={styles.tipAddedText}>
          You added ₹{tipAmount} tip. Thank you for your generosity! 💚
        </Text>
      </View>
    );
  }

  // Only show for assigning/assigned orders
  if (!['assigning', 'assigned'].includes(orderStatus)) {
    return null;
  }

  return (
    <View style={styles.tipSection}>
      <View style={styles.tipHeader}>
        <View style={styles.tipIconContainer}>
          <Ionicons name="person-circle-outline" size={40} color="#E74C3C" />
        </View>
        <View style={styles.tipTextContainer}>
          <Text style={styles.tipTitle}>
            {orderStatus === 'assigning' 
              ? 'Assigning delivery partner shortly'
              : 'Support your delivery partner'}
          </Text>
        </View>
      </View>
      <Text style={styles.tipDescription}>
        Make their day by leaving a tip. 100% of the amount will go to them after delivery
      </Text>
      <View style={styles.tipOptions}>
        {[10, 20, 50].map((amount) => (
          <TouchableOpacity
            key={amount}
            style={[
              styles.tipButton, 
              selectedTip === amount && styles.tipButtonSelected,
              saving && styles.tipButtonDisabled
            ]}
            onPress={() => onSelectTip(amount)}
            disabled={saving}
          >
            <Text style={[
              styles.tipButtonText, 
              selectedTip === amount && styles.tipButtonTextSelected
            ]}>
              ₹{amount}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.tipButton, 
            selectedTip !== null && 
            ![10, 20, 50].includes(selectedTip) && 
            styles.tipButtonSelected,
            saving && styles.tipButtonDisabled
          ]}
          onPress={() => onSelectTip(0)}
          disabled={saving}
        >
          <Text style={[
            styles.tipButtonText, 
            selectedTip !== null && 
            ![10, 20, 50].includes(selectedTip) && 
            styles.tipButtonTextSelected
          ]}>
            Other
          </Text>
        </TouchableOpacity>
      </View>
      {saving && (
        <View style={styles.savingTipIndicator}>
          <ActivityIndicator size="small" color="#00A65A" />
          <Text style={styles.savingTipText}>Adding tip...</Text>
        </View>
      )}
    </View>
  );
};