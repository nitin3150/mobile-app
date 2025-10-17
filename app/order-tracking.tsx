import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOrderTracking } from '../contexts/OrderTrackingContext';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/authenticatedFetch';
import { createApiUrl } from '../config/apiConfig';

export default function OrderTrackingScreen() {
  const { activeOrder, loading, refreshActiveOrder } = useOrderTracking();
  const { token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [partnerRating, setPartnerRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showOrderItemsModal, setShowOrderItemsModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshActiveOrder();
    setRefreshing(false);
  };

  const handleCallDeliveryPartner = () => {
    if (activeOrder?.delivery_partner?.phone) {
      Linking.openURL(`tel:${activeOrder.delivery_partner.phone}`);
    } else {
      Alert.alert('Info', 'Delivery partner contact not available yet');
    }
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

  // Render order items modal
  const renderOrderItemsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showOrderItemsModal}
      onRequestClose={() => setShowOrderItemsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Pressable 
          style={styles.modalBackdrop} 
          onPress={() => setShowOrderItemsModal(false)}
        />
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Order Items</Text>
              <TouchableOpacity
                onPress={() => setShowOrderItemsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Items List */}
          <ScrollView style={styles.modalItemsList} showsVerticalScrollIndicator={false}>
            <View style={styles.itemsContainer}>
              {activeOrder?.items?.map((item: any, index: number) => (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.itemHeader}>
                    <View style={styles.vegIconSmall}>
                      <View style={styles.vegDotSmall} />
                    </View>
                    <Text style={styles.itemName}>{item.product}</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                  {item.variant && (
                    <Text style={styles.itemVariant}>{item.variant}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Price Breakdown */}
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Item Total</Text>
                <Text style={styles.priceValue}>₹{activeOrder?.subtotal?.toFixed(2) || '0.00'}</Text>
              </View>
              
              {(activeOrder?.delivery_charge ?? 0) > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Delivery Charge</Text>
                  <Text style={styles.priceValue}>₹{activeOrder?.delivery_charge?.toFixed(2)}</Text>
                </View>
              )}
              
              {(activeOrder?.tax ?? 0) > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Taxes & Fees</Text>
                  <Text style={styles.priceValue}>₹{activeOrder?.tax?.toFixed(2)}</Text>
                </View>
              )}
              
              {(activeOrder?.app_fee ?? 0) > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Platform Fee</Text>
                  <Text style={styles.priceValue}>₹{activeOrder?.app_fee?.toFixed(2)}</Text>
                </View>
              )}
              
              {(activeOrder?.promo_discount ?? 0) > 0 && (
                <View style={[styles.priceRow, styles.discountRow]}>
                  <Text style={styles.discountLabel}>Discount</Text>
                  <Text style={styles.discountValue}>-₹{activeOrder?.promo_discount?.toFixed(2)}</Text>
                </View>
              )}
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{activeOrder?.total_amount?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
          </ScrollView>
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
      {/* Green Header */}
      <View style={[styles.header, { backgroundColor: getStatusColor() }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            {/* <Text style={styles.headerTitle}>{activeOrder.restaurant_name || 'Restaurant'}</Text> */}
            <View style={{ width: 32 }} />
          </View>

          {/* Status Section */}
          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>{getStatusText(activeOrder.order_status)}</Text>
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryText}>
                Arriving in {activeOrder.estimated_delivery_time || '30'} mins • On time
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
        {/* Tip Section - Show when assigning */}
        {activeOrder.order_status === 'assigning' && (
          <View style={styles.tipSection}>
            <View style={styles.tipHeader}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="person-circle-outline" size={40} color="#E74C3C" />
              </View>
              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>Assigning delivery partner shortly</Text>
              </View>
            </View>
            <Text style={styles.tipDescription}>
              Make their day by leaving a tip. 100% of the amount will go to them after delivery
            </Text>
            <View style={styles.tipOptions}>
              {[20, 30, 50].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.tipButton, selectedTip === amount && styles.tipButtonSelected]}
                  onPress={() => setSelectedTip(amount)}
                >
                  <Text style={[styles.tipButtonText, selectedTip === amount && styles.tipButtonTextSelected]}>
                    ₹{amount}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.tipButton, selectedTip === 0 && styles.tipButtonSelected]}
                onPress={() => setSelectedTip(0)}
              >
                <Text style={[styles.tipButtonText, selectedTip === 0 && styles.tipButtonTextSelected]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delivery Partner Section - Only show when partner is assigned */}
        {showDeliveryPartner && (
          <View style={styles.deliveryPartnerSection}>
            <View style={styles.partnerHeader}>
              <View style={styles.partnerAvatar}>
                <Ionicons name="person" size={28} color="#fff" />
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerLabel}>Your Delivery Partner</Text>
                <Text style={styles.partnerName}>
                  {activeOrder.delivery_partner.name || 'Delivery Partner'}
                </Text>
                {activeOrder.delivery_partner.rating && (
                  <View style={styles.partnerRatingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.partnerRatingText}>
                      {activeOrder.delivery_partner.rating.toFixed(1)}
                    </Text>
                    {activeOrder.delivery_partner.deliveries > 0 && (
                      <Text style={styles.deliveriesText}>
                        • {activeOrder.delivery_partner.deliveries} deliveries
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.callPartnerButton}
                onPress={handleCallDeliveryPartner}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delivery Details Card */}
        <View style={styles.deliveryDetailsCard}>
          <View style={styles.deliveryDetailsHeader}>
            <Text style={styles.deliveryDetailsTitle}>
              All your delivery details in one place 👇
            </Text>
          </View>

          {/* Phone Number */}
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={24} color="#666" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailTitle}>
                {activeOrder.delivery_address?.phone || activeOrder.delivery_address?.phone || 'Phone Number'}
              </Text>
              <Text style={styles.detailSubtitle}>Delivery partner may call this number</Text>
            </View>
          </View>

          {/* Delivery Address */}
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

        {/* Order Details Card - Tappable to show full items */}
        <View style={styles.restaurantCard}>
          <TouchableOpacity 
            style={styles.orderDetailsRow}
            onPress={() => setShowOrderItemsModal(true)}
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

        {/* Rate Delivery Partner - Show only when delivered */}
        {activeOrder.order_status === 'delivered' && showDeliveryPartner && (
          <View style={styles.ratePartnerSection}>
            <View style={styles.ratePartnerHeader}>
              <View style={styles.partnerAvatarSmall}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={styles.ratePartnerTextContainer}>
                <Text style={styles.ratePartnerTitle}>
                  {activeOrder.delivery_partner.name || 'Delivery Partner'}
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
      {renderOrderItemsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#00A65A',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
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
  },
  deliveryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginRight: 8,
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
  tipSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIconContainer: {
    marginRight: 12,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  tipOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  tipButtonSelected: {
    backgroundColor: '#00A65A',
  },
  tipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tipButtonTextSelected: {
    color: '#fff',
  },
  deliveryPartnerSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  partnerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerRatingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  deliveriesText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  callPartnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  // Modal styles
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
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalItemsList: {
    flex: 1,
  },
  itemsContainer: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vegIconSmall: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#00A65A',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  vegDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00A65A',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  itemVariant: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  priceBreakdown: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  discountRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
    paddingTop: 12,
  },
  discountLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});