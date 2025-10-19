import React, { useState, useRef,useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOrderTracking } from '../contexts/OrderTrackingContext';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/authenticatedFetch';
import { createApiUrl } from '../config/apiConfig';

// Import modular components
import {
  OrderItemsModal,
  TipSection,
  DeliveryPartnerCard,
} from '../components/order-tracking';

export default function OrderTrackingScreen() {
  const { activeOrder, loading, refreshActiveOrder } = useOrderTracking();
  const { token } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [showCustomTipModal, setShowCustomTipModal] = useState(false);
  const [savingTip, setSavingTip] = useState(false);
  const [partnerRating, setPartnerRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showOrderItemsModal, setShowOrderItemsModal] = useState(false);
  
  // Countdown timer state
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [countdownInitialized, setCountdownInitialized] = useState<string | null>(null);

  // Initialize countdown timer
  // useEffect(() => {
  //   if (!activeOrder) {
  //     setTimeRemainingSeconds(null);
  //     setCountdownInitialized(null);
  //     return;
  //   }
  
  //   const orderId = activeOrder.id;
  //   const orderStatus = activeOrder.order_status;
    
  //   const validStatuses = ['assigned', 'out_for_delivery'];
    
  //   if (!validStatuses.includes(orderStatus)) {
  //     setTimeRemainingSeconds(null);
  //     setCountdownInitialized(null);
  //     return;
  //   }
  
  //   if (countdownInitialized === orderId) {
  //     return;
  //   }
  
  //   let estimatedMinutes = 30;
  //   const rawValue = activeOrder.estimated_delivery_time;
  //   console.log("raw time: ",rawValue)
  //   if (rawValue && typeof rawValue === 'number') {
  //     if (rawValue >= 5 && rawValue <= 60) {
  //       estimatedMinutes = Math.round(rawValue);
  //     } else if (rawValue > 60 && rawValue < 3600) {
  //       const convertedMinutes = Math.round(rawValue / 60);
  //       if (convertedMinutes >= 5 && convertedMinutes <= 60) {
  //         estimatedMinutes = convertedMinutes;
  //       }
  //     }
  //   }
    
  //   let remainingSeconds = estimatedMinutes * 60;
    
  //   if (activeOrder.assigned_at) {
  //     try {
  //       const assignedTime = new Date(activeOrder.assigned_at).getTime();
  //       const currentTime = new Date().getTime();
  //       const elapsedSeconds = Math.floor((currentTime - assignedTime) / 1000);
  //       remainingSeconds = Math.max(0, remainingSeconds - elapsedSeconds);
  //     } catch (error) {
  //       console.error('⏱️ Error calculating time:', error);
  //     }
  //   }
    
  //   setTimeRemainingSeconds(remainingSeconds);
  //   setCountdownInitialized(orderId || null);
  // }, [activeOrder?.id, activeOrder?.order_status]);
  const assignedTimeRef = useRef<number | null>(null); // 🕓 store assigned time in memory only

  useEffect(() => {
    if (!activeOrder) {
      setTimeRemainingSeconds(null);
      setCountdownInitialized(null);
      assignedTimeRef.current = null;
      return;
    }

    const orderId = activeOrder.id;
    const orderStatus = activeOrder.order_status;
    const validStatuses = ['assigned', 'out_for_delivery'];

    if (!validStatuses.includes(orderStatus)) {
      setTimeRemainingSeconds(null);
      setCountdownInitialized(null);
      assignedTimeRef.current = null;
      return;
    }

    // 🧠 Set assigned time only once when status becomes "assigned"
    if (orderStatus === 'assigned' && !assignedTimeRef.current) {
      assignedTimeRef.current = new Date(activeOrder.assigned_at || Date.now()).getTime();
      // Log the raw milliseconds
  console.log('⏱️ Assigned time (ms):', assignedTimeRef.current);
  
  // Log as readable date
  console.log('⏱️ Assigned time (Date):', new Date(assignedTimeRef.current).toString());
  
  // Log as ISO string
  console.log('⏱️ Assigned time (ISO):', new Date(assignedTimeRef.current).toISOString());

    }
    // Prevent restarting the timer for same order
    if (countdownInitialized === orderId) {
      return;
    }

    // Default estimated time
    let estimatedMinutes = 30;
    const rawValue = activeOrder.estimated_delivery_time;
    console.log(rawValue)
    if (rawValue && typeof rawValue === 'number') {
      if (rawValue >= 5 && rawValue <= 30) {
        estimatedMinutes = Math.round(rawValue);
      } else if (rawValue > 60 && rawValue < 3600) {
        const convertedMinutes = Math.round(rawValue / 60);
        if (convertedMinutes >= 5 && convertedMinutes <= 60) {
          estimatedMinutes = convertedMinutes;
        }
      }
    }

    let remainingSeconds = estimatedMinutes * 60;

    // ⏱️ Calculate elapsed time since assigned
    if (assignedTimeRef.current) {
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - assignedTimeRef.current) / 1000);
      console.log(elapsedSeconds)
      remainingSeconds = Math.max(0, remainingSeconds - elapsedSeconds);
    }

    setTimeRemainingSeconds(remainingSeconds);
    setCountdownInitialized(orderId || null);
  }, [activeOrder?.id, activeOrder?.order_status]);


  // Countdown update
  useEffect(() => {
    if (timeRemainingSeconds === null || timeRemainingSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev === null || prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemainingSeconds]);

  const formatCountdown = () => {
    if (timeRemainingSeconds === null) {
      return `${activeOrder?.estimated_delivery_time || 30} mins`;
    }
    
    if (timeRemainingSeconds <= 0) {
      return 'Arriving soon';
    }

    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = timeRemainingSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshActiveOrder();
    setRefreshing(false);
  };

  // Handle tip selection
  const handleTipSelection = (amount: number) => {
    if (amount === 0) {
      setShowCustomTipModal(true);
    } else {
      setSelectedTip(amount);
      confirmAndSaveTip(amount);
    }
  };

  const confirmAndSaveTip = (amount: number) => {
    Alert.alert(
      'Add Tip',
      `Add ₹${amount} tip for your delivery partner?\n\n100% of the amount will go to them after delivery.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Tip',
          onPress: () => saveTip(amount),
        },
      ]
    );
  };

  const saveTip = async (amount: number) => {
    if (!activeOrder) return;

    setSavingTip(true);
    try {
      const response = await authenticatedFetch(
        createApiUrl(`orders/${activeOrder.id}/add-tip`),
        {
          method: 'POST',
          body: JSON.stringify({
            tip_amount: amount,
            order_id: activeOrder.id,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', `₹${amount} tip added successfully! Thank you for your generosity.`);
        setSelectedTip(amount);
        await refreshActiveOrder();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Failed to add tip');
        setSelectedTip(null);
      }
    } catch (error) {
      console.error('Error adding tip:', error);
      Alert.alert('Error', 'Failed to add tip. Please try again.');
      setSelectedTip(null);
    } finally {
      setSavingTip(false);
    }
  };

  const handleCustomTipSubmit = () => {
    const amount = parseInt(customTipAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid tip amount');
      return;
    }

    if (amount > 500) {
      Alert.alert('Error', 'Maximum tip amount is ₹500');
      return;
    }

    setShowCustomTipModal(false);
    setSelectedTip(amount);
    confirmAndSaveTip(amount);
    setCustomTipAmount('');
  };

  const handleSubmitPartnerRating = async (rating: number) => {
    if (!activeOrder?.delivery_partner || submittingRating) return;

    setPartnerRating(rating);
    setSubmittingRating(true);

    try {
      const response = await authenticatedFetch(
        createApiUrl(`orders/${activeOrder.id}/rate-partner`),
        {
          method: 'POST',
          body: JSON.stringify({
            partner_rating: rating,
            order_id: activeOrder.id,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Thank you!', 'Your rating for the delivery partner has been submitted.');
      } else {
        Alert.alert('Error', 'Failed to submit rating. Please try again.');
        setPartnerRating(0);
      }
    } catch (error) {
      console.error('Error rating partner:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
      setPartnerRating(0);
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusColor = () => {
    return '#00A65A';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'Preparing your order';
      case 'assigning':
        return 'Assigning delivery partner shortly';
      case 'assigned':
        return 'Delivery partner assigned';
      case 'out_for_delivery':
        return 'On the way';
      case 'delivered':
        return 'Order delivered';
      default:
        return 'Order in progress';
    }
  };

  const showDeliveryPartner = activeOrder && 
    activeOrder.delivery_partner && 
    ['assigned', 'out_for_delivery', 'delivered'].includes(activeOrder.order_status);

  // Custom tip modal
  const renderCustomTipModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showCustomTipModal}
      onRequestClose={() => setShowCustomTipModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Pressable 
          style={styles.modalBackdrop} 
          onPress={() => setShowCustomTipModal(false)}
        />
        <View style={styles.customTipModal}>
          <View style={styles.customTipHeader}>
            <Text style={styles.customTipTitle}>Enter Tip Amount</Text>
            <TouchableOpacity onPress={() => setShowCustomTipModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.customTipContent}>
            <Text style={styles.customTipLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.customTipInput}
              value={customTipAmount}
              onChangeText={setCustomTipAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              autoFocus
              maxLength={3}
            />
            <Text style={styles.customTipHint}>Maximum tip amount: ₹500</Text>
          </View>
          
          <View style={styles.customTipButtons}>
            <TouchableOpacity
              style={styles.customTipCancelButton}
              onPress={() => {
                setShowCustomTipModal(false);
                setCustomTipAmount('');
              }}
            >
              <Text style={styles.customTipCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.customTipConfirmButton}
              onPress={handleCustomTipSubmit}
            >
              <Text style={styles.customTipConfirmText}>Add Tip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !activeOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A65A" />
          <Text style={styles.loadingText}>Loading order status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-down" size={28} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Active Orders</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any orders being delivered right now
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getStatusColor() }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>{getStatusText(activeOrder.order_status)}</Text>
            <View style={styles.deliveryInfo}>
              <Ionicons name="time-outline" size={18} color="#fff" />
              <Text style={styles.deliveryText}>
                Arriving in {formatCountdown()}
              </Text>
              <TouchableOpacity onPress={onRefresh} style={styles.refreshIcon}>
                <Ionicons name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Tip Section */}
        <TipSection
          selectedTip={selectedTip}
          onSelectTip={handleTipSelection}
          saving={savingTip}
          orderStatus={activeOrder.order_status}
          tipAmount={activeOrder.tip_amount}
        />

        {/* Delivery Partner */}
        {showDeliveryPartner && (
          <DeliveryPartnerCard partner={activeOrder.delivery_partner!} />
        )}

        {/* Delivery Details */}
        <View style={styles.deliveryDetailsCard}>
          <View style={styles.deliveryDetailsHeader}>
            <Text style={styles.deliveryDetailsTitle}>
              All your delivery details in one place 👇
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={24} color="#666" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailTitle}>
                {activeOrder.delivery_address?.phone || 'Phone Number'}
              </Text>
              <Text style={styles.detailSubtitle}>Delivery partner may call this number</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="home-outline" size={24} color="#666" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailTitle}>
                {activeOrder.delivery_address?.label || 'Delivery Address'}
              </Text>
              <Text style={styles.detailSubtitle} numberOfLines={2}>
                {activeOrder.delivery_address?.street || activeOrder.delivery_address?.address || 'Address not available'}
                {activeOrder.delivery_address?.city && `, ${activeOrder.delivery_address.city}`}
                {activeOrder.delivery_address?.pincode && ` - ${activeOrder.delivery_address.pincode}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Details Card */}
        <View style={styles.restaurantCard}>
          <TouchableOpacity 
            style={styles.orderDetailsRow}
            onPress={() => {
              console.log('🔍 Opening items modal with data:', activeOrder?.items);
              setShowOrderItemsModal(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={24} color="#666" />
            <View style={styles.orderDetailsText}>
              <Text style={styles.orderNumber}>Order #{activeOrder.id}</Text>
              <View style={styles.orderItemsPreview}>
                <View style={styles.vegIcon}>
                  <View style={styles.vegDot} />
                </View>
                <Text style={styles.orderItemsText} numberOfLines={1}>
                  {activeOrder.items?.length || 0} items • ₹{activeOrder.total_amount?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Rate Partner */}
        {activeOrder.order_status === 'delivered' && showDeliveryPartner && (
          <View style={styles.ratePartnerSection}>
            <View style={styles.ratePartnerHeader}>
              <View style={styles.partnerAvatarSmall}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={styles.ratePartnerTextContainer}>
                <Text style={styles.ratePartnerTitle}>
                  {activeOrder.delivery_partner!.name || 'Delivery Partner'}
                </Text>
                <Text style={styles.ratePartnerSubtitle}>How was your delivery experience?</Text>
              </View>
            </View>
            <View style={styles.partnerStarsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => !submittingRating && handleSubmitPartnerRating(star)}
                  disabled={submittingRating}
                  hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                >
                  <Ionicons
                    name={partnerRating >= star ? 'star' : 'star-outline'}
                    size={32}
                    color={submittingRating ? '#ccc' : '#FFB800'}
                    style={styles.partnerStar}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {partnerRating > 0 && (
              <Text style={styles.ratingThankYou}>
                Thank you for rating your delivery partner!
              </Text>
            )}
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <TouchableOpacity 
            style={styles.helpRow}
            onPress={() => router.push('/help-support')}
          >
            <View style={styles.helpIconContainer}>
              <Ionicons name="headset-outline" size={28} color="#E74C3C" />
            </View>
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>Need help with your order?</Text>
              <Text style={styles.helpSubtitle}>Get help & support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Order Items Modal */}
      <OrderItemsModal
        visible={showOrderItemsModal}
        onClose={() => setShowOrderItemsModal(false)}
        order={activeOrder}
      />

      {/* Custom Tip Modal */}
      {renderCustomTipModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 4,
  },
  statusSection: {
    alignItems: 'center',
    paddingTop: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  deliveryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  refreshIcon: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#00A65A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  deliveryDetailsCard: {
    backgroundColor: '#FFF9E6',
    marginTop: 8,
    padding: 16,
  },
  deliveryDetailsHeader: {
    marginBottom: 16,
  },
  deliveryDetailsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B4513',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  restaurantCard: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  orderDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  orderDetailsText: {
    flex: 1,
    marginLeft: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  orderItemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vegIcon: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#00A65A',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00A65A',
  },
  orderItemsText: {
    fontSize: 13,
    color: '#666',
  },
  ratePartnerSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  ratePartnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  partnerAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ratePartnerTextContainer: {
    flex: 1,
  },
  ratePartnerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  ratePartnerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  partnerStarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  partnerStar: {
    marginHorizontal: 4,
  },
  ratingThankYou: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  helpSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  helpIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  helpSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  customTipModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  customTipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  customTipTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  customTipContent: {
    marginBottom: 20,
  },
  customTipLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  customTipInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
  },
  customTipHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  customTipButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  customTipCancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  customTipCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  customTipConfirmButton: {
    flex: 1,
    backgroundColor: '#00A65A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  customTipConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});