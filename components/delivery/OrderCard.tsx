import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, TabType } from '../../types/delivery.types';
import { formatDate, getStatusColor } from '../../utils/dateUtils';
import { styles } from '../../styles/delivery.styles';

interface OrderCardProps {
  item: Order;
  currentTab: TabType;
  actionLoading: boolean;
  handleAcceptOrder: (orderId: string) => void;
  handleMarkAsDelivered: (orderId: string) => void;
  openOrderDetails: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  item,
  currentTab,
  actionLoading,
  handleAcceptOrder,
  handleMarkAsDelivered,
  openOrderDetails,
}) => {
  // ✅ FIX: Handle navigation to customer address
  const handleGetDirections = () => {
    const address = item.delivery_address;
    
    if (!address) {
      Alert.alert('Error', 'Delivery address not available');
      return;
    }

    // Check if coordinates are available
    if (address.latitude && address.longitude) {
      // Use coordinates for accurate navigation
      const url = Platform.select({
        ios: `maps://app?daddr=${address.latitude},${address.longitude}`,
        android: `google.navigation:q=${address.latitude},${address.longitude}`,
      });

      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`;

      Linking.canOpenURL(url!).then((supported) => {
        if (supported) {
          Linking.openURL(url!);
        } else {
          Linking.openURL(fallbackUrl);
        }
      }).catch(() => {
        Linking.openURL(fallbackUrl);
      });
    } else {
      // Fallback: Use address string
      const addressString = `${address.address}, ${address.city}, ${address.state} ${address.pincode}`;
      const url = Platform.select({
        ios: `maps://app?daddr=${encodeURIComponent(addressString)}`,
        android: `google.navigation:q=${encodeURIComponent(addressString)}`,
      });

      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;

      Linking.canOpenURL(url!).then((supported) => {
        if (supported) {
          Linking.openURL(url!);
        } else {
          Linking.openURL(fallbackUrl);
        }
      }).catch(() => {
        Linking.openURL(fallbackUrl);
      });
    }
  };

  // ✅ FIX: Handle calling customer
  const handleCallCustomer = () => {
    const phone = item.delivery_address?.phone;
    
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Error', 'Customer phone number not available');
    }
  };

  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => currentTab === 'assigned' ? openOrderDetails(item) : undefined}
      activeOpacity={currentTab === 'assigned' ? 0.7 : 1}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{item.id.toUpperCase()}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.order_status) }]}>
          <Text style={styles.statusText}>{item.order_status}</Text>
        </View>
      </View>

      {currentTab === 'assigned' && (
        <View style={styles.assignedOrderDetails}>
          <View style={styles.customerSection}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.customerName}>{item.user_info?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.addressSection}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.deliveryAddress} numberOfLines={2}>
              {item.delivery_address ? 
                `${item.delivery_address.address}, ${item.delivery_address.city}, ${item.delivery_address.state} - ${item.delivery_address.pincode}` : 
                'Address not available'
              }
            </Text>
          </View>

          <View style={styles.itemsPreview}>
            <Ionicons name="cube-outline" size={16} color="#666" />
            <Text style={styles.itemsCount}>
              {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? 's' : ''}
            </Text>
          </View>

          {item.payment_method === 'cod' && (
            <View style={styles.amountSection}>
              <Ionicons name="cash-outline" size={16} color="#34C759" />
              <Text style={styles.codLabel}>Cash on Delivery</Text>
              <Text style={styles.orderAmount}>₹{(item.total_amount || 0).toFixed(2)}</Text>
            </View>
          )}

          {/* ✅ NEW: Action Buttons for Assigned Orders */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={handleGetDirections}
            >
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={styles.directionsButtonText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallCustomer}
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentTab === 'available' && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAcceptOrder(item.id);
          }}
          disabled={actionLoading}
        >
          <Text style={styles.acceptButtonText}>
            {actionLoading ? 'Accepting...' : 'Accept Delivery'}
          </Text>
        </TouchableOpacity>
      )}

      {currentTab === 'assigned' && (
        <TouchableOpacity
          style={styles.deliveredButton}
          onPress={(e) => {
            e.stopPropagation();
            handleMarkAsDelivered(item.id);
          }}
          disabled={actionLoading}
        >
          <Text style={styles.deliveredButtonText}>
            {actionLoading ? 'Updating...' : 'Mark as Delivered'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default OrderCard;