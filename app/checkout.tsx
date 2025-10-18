import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '../config/apiConfig';
import { authenticatedFetch } from '../utils/authenticatedFetch';

interface CartItem {
  _id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    brand: { name: string };
    stock: number;
  };
  quantity: number;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AddressData {
  _id?: string;
  label?: string;
  street?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  mobile_number?: string;
  phone: string;
  landmark?: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  coordinates?: Coordinates;
  is_default?: boolean;
}

interface PromoCode {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount?: number;
  is_active: boolean;
}

export default function CheckoutScreen() {
  const { token, user } = useAuth();
  const params = useLocalSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<AddressData | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [updatingQuantity, setUpdatingQuantity] = useState<{[key: string]: boolean}>({});
  
  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Success animation states
  const [showSuccess, setShowSuccess] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      const cartResponse = await authenticatedFetch(API_ENDPOINTS.CART);
      
      if (cartResponse.ok) {
        const cartData = await cartResponse.json();
        setCartItems(cartData.items || []);
      }
      
      const settingsResponse = await fetch(API_ENDPOINTS.SETTINGS);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }
      
      if (!params.address) {
        await loadDefaultAddress();
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultAddress = async () => {
    try {
      const addressResponse = await authenticatedFetch(API_ENDPOINTS.MY_ADDRESS);
      
      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
        console.log('📍 Loaded addresses:', addressData);
        
        let addresses = [];
        if (Array.isArray(addressData)) {
          addresses = addressData;
        } else if (addressData.addresses && Array.isArray(addressData.addresses)) {
          addresses = addressData.addresses;
        }
        
        const defaultAddress = addresses.find((addr: any) => addr.is_default) || addresses[0];
        
        if (defaultAddress) {
          console.log('📍 Default address:', defaultAddress);
          
          // ✅ Format address with all fields including coordinates
          setDeliveryAddress({
            _id: defaultAddress._id,
            label: defaultAddress.label,
            street: defaultAddress.street,
            address: defaultAddress.street || defaultAddress.address,
            city: defaultAddress.city || '',
            state: defaultAddress.state || '',
            pincode: defaultAddress.pincode || '',
            mobile_number: defaultAddress.mobile_number,
            phone: defaultAddress.mobile_number || defaultAddress.phone || user?.phone || '',
            landmark: defaultAddress.landmark,
            fullAddress: `${defaultAddress.street || defaultAddress.address}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.pincode}`,
            latitude: defaultAddress.latitude,
            longitude: defaultAddress.longitude,
            coordinates: defaultAddress.latitude && defaultAddress.longitude 
              ? { latitude: defaultAddress.latitude, longitude: defaultAddress.longitude }
              : undefined,
            is_default: defaultAddress.is_default,
          });
        }
      }
    } catch (error) {
      console.error('Error loading default address:', error);
    }
  };

  // ✅ Update address from params (when user selects from address page)
  useEffect(() => {
    const addressFromParams = params.address as string;
    const fullAddressFromParams = params.fullAddress as string;
    
    if (addressFromParams && fullAddressFromParams) {
      console.log('📍 Address from params:', params);
      
      setDeliveryAddress({
        _id: params.addressId as string,
        label: params.addressLabel as string,
        street: addressFromParams,
        address: addressFromParams,
        city: params.city as string || '',
        state: params.state as string || '',
        pincode: params.pincode as string || '',
        mobile_number: params.mobile_number as string,
        phone: params.mobile_number as string || params.phone as string || user?.phone || '',
        landmark: params.landmark as string,
        fullAddress: fullAddressFromParams,
        latitude: params.latitude ? Number(params.latitude) : undefined,
        longitude: params.longitude ? Number(params.longitude) : undefined,
        coordinates: params.latitude && params.longitude
          ? {
              latitude: Number(params.latitude),
              longitude: Number(params.longitude),
            }
          : undefined,
        is_default: params.is_default === 'true',
      });
    }
  }, [params]);

  const updateCartQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      Alert.alert(
        'Remove Item',
        'Are you sure you want to remove this item from your cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: () => removeCartItem(itemId)
          }
        ]
      );
      return;
    }

    const cartItem = cartItems.find(item => item._id === itemId);
    if (cartItem && newQuantity > cartItem.product.stock) {
      Alert.alert('Stock Limit', `Only ${cartItem.product.stock} items available in stock`);
      return;
    }

    setUpdatingQuantity(prev => ({ ...prev, [itemId]: true }));

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.CART_UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      });

      if (response.ok) {
        setCartItems(prevItems =>
          prevItems.map(item =>
            item._id === itemId ? { ...item, quantity: newQuantity } : item
          )
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    } finally {
      setUpdatingQuantity(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const removeCartItem = async (itemId: string) => {
    setUpdatingQuantity(prev => ({ ...prev, [itemId]: true }));

    try {
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.CART_REMOVE}?item_id=${itemId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    } finally {
      setUpdatingQuantity(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/promocodes/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: promoCode.trim().toUpperCase(),
            order_amount: getSubtotal(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedPromo(data.promocode);
        calculatePromoDiscount(data.promocode);
        Alert.alert('Success', 'Promo code applied successfully!');
      } else {
        Alert.alert('Error', data.message || 'Invalid promo code');
        setAppliedPromo(null);
        setPromoDiscount(0);
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      Alert.alert('Error', 'Failed to apply promo code');
      setAppliedPromo(null);
      setPromoDiscount(0);
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setPromoDiscount(0);
  };

  const calculatePromoDiscount = (promo: PromoCode) => {
    const subtotal = getSubtotal();
    let discount = 0;

    if (promo.discount_type === 'percentage') {
      discount = subtotal * (promo.discount_value / 100);
      if (promo.max_discount) {
        discount = Math.min(discount, promo.max_discount);
      }
    } else {
      discount = promo.discount_value;
    }

    setPromoDiscount(discount);
  };

  const showSuccessAnimation = () => {
    setShowSuccess(true);
    
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccess(false);
        router.push('/(tabs)');
      });
    }, 2500);
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTax = () => {
    if (!settings) return 0;
    const taxableAmount = getSubtotal() - promoDiscount;
    return taxableAmount * (settings.tax_rate / 100);
  };

  const getDeliveryCharge = () => {
    if (!settings || !settings.delivery_fee) return 0;
    const subtotal = getSubtotal();
    
    if (subtotal >= settings.delivery_fee.free_delivery_threshold) {
      return 0;
    }
    
    return settings.delivery_fee.base_fee;
  };

  const getAppFee = () => {
    if (!settings || !settings.app_fee) return 0;
    const subtotal = getSubtotal() - promoDiscount;
    
    if (settings.app_fee.type === 'percentage') {
      const calculatedFee = subtotal * (settings.app_fee.value / 100);
      return Math.max(settings.app_fee.min_fee, Math.min(calculatedFee, settings.app_fee.max_fee));
    }
    
    return settings.app_fee.value;
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const tax = getTax();
    const deliveryCharge = getDeliveryCharge();
    const appFee = getAppFee();
    return subtotal + tax + deliveryCharge + appFee - promoDiscount;
  };

  const handleSelectAddress = () => {
    router.push('/address?from=checkout');
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Please login to place an order');
      return;
    }

    // ✅ Validate complete address
    if (!deliveryAddress.address || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
      Alert.alert('Error', 'Please provide complete address information');
      return;
    }

    // ✅ Validate phone number
    if (!deliveryAddress.phone && !deliveryAddress.mobile_number) {
      Alert.alert('Error', 'Please provide a phone number for delivery');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setPlacingOrder(true);
    try {
      // ✅ Prepare complete delivery address with all fields
      const deliveryAddressData = {
        // Address text fields
        street: deliveryAddress.street || deliveryAddress.address,
        address: deliveryAddress.address,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        pincode: deliveryAddress.pincode,
        
        // Contact information
        phone: deliveryAddress.phone || deliveryAddress.mobile_number || user?.phone || '',
        mobile_number: deliveryAddress.mobile_number || deliveryAddress.phone || user?.phone || '',
        
        // Optional fields
        label: deliveryAddress.label || 'Home',
        landmark: deliveryAddress.landmark || '',
        
        // ✅ GPS Coordinates - include if available
        ...(deliveryAddress.latitude && deliveryAddress.longitude && {
          latitude: deliveryAddress.latitude,
          longitude: deliveryAddress.longitude,
          coordinates: {
            latitude: deliveryAddress.latitude,
            longitude: deliveryAddress.longitude,
          }
        }),
      };

      const orderData = {
        items: cartItems.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        delivery_address: deliveryAddressData,  // ✅ Complete address with coordinates
        payment_method: paymentMethod,
        subtotal: getSubtotal(),
        tax: getTax(),
        delivery_charge: getDeliveryCharge(),
        app_fee: getAppFee(),
        promo_code: appliedPromo?.code || null,
        promo_discount: promoDiscount,
        total_amount: getTotal(),
      };
      
      console.log('📦 Placing order with data:', {
        itemsCount: orderData.items.length,
        hasCoordinates: !!(deliveryAddressData.latitude && deliveryAddressData.longitude),
        coordinates: deliveryAddressData.coordinates,
        phone: deliveryAddressData.phone,
        address: deliveryAddressData.address,
      });

      const response = await authenticatedFetch(API_ENDPOINTS.ORDERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const orderResult = await response.json();
        console.log('✅ Order placed successfully:', orderResult);
        showSuccessAnimation();
      } else {
        const errorData = await response.json();
        console.error('❌ Order placement failed:', errorData);
        Alert.alert('Error', errorData.detail || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some products to proceed to checkout
          </Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopNowText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={placingOrder}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={!placingOrder}>
        {/* Delivery Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          
          {deliveryAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressInfo}>
                <View style={styles.addressLabelRow}>
                  {deliveryAddress.label && (
                    <View style={styles.labelBadge}>
                      <Ionicons 
                        name={deliveryAddress.label === 'Home' ? 'home' : deliveryAddress.label === 'Office' ? 'business' : 'location'} 
                        size={14} 
                        color="#007AFF" 
                      />
                      <Text style={styles.labelText}>{deliveryAddress.label}</Text>
                    </View>
                  )}
                  {deliveryAddress.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>{deliveryAddress.fullAddress}</Text>
                {deliveryAddress.phone && (
                  <Text style={styles.phoneText}>📱 {deliveryAddress.phone}</Text>
                )}
                {deliveryAddress.latitude && deliveryAddress.longitude && (
                  <View style={styles.coordinatesRow}>
                    <Ionicons name="navigate" size={12} color="#4CAF50" />
                    <Text style={styles.coordinatesText}>
                      GPS: {deliveryAddress.latitude.toFixed(4)}, {deliveryAddress.longitude.toFixed(4)}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity 
                style={styles.changeAddressButton}
                onPress={handleSelectAddress}
                disabled={placingOrder}
              >
                <Ionicons name="create-outline" size={16} color="#007AFF" />
                <Text style={styles.changeAddressText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.selectAddressButton}
              onPress={handleSelectAddress}
              disabled={placingOrder}
            >
              <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
              <Text style={styles.selectAddressText}>Select Delivery Address</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          
          {cartItems.map((item) => (
            <View key={item._id} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName}>{item.product.name}</Text>
                <Text style={styles.orderItemBrand}>{item.product.brand?.name}</Text>
                <Text style={styles.orderItemPrice}>₹{item.product.price} each</Text>
                
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[styles.quantityButton, updatingQuantity[item._id] && styles.disabledQuantityButton]}
                    onPress={() => updateCartQuantity(item._id, item.quantity - 1)}
                    disabled={updatingQuantity[item._id] || placingOrder}
                  >
                    <Ionicons name="remove" size={16} color="#007AFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.quantityDisplay}>
                    {updatingQuantity[item._id] ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.quantityButton, 
                      (updatingQuantity[item._id] || item.quantity >= item.product.stock) && styles.disabledQuantityButton
                    ]}
                    onPress={() => updateCartQuantity(item._id, item.quantity + 1)}
                    disabled={updatingQuantity[item._id] || item.quantity >= item.product.stock}
                  >
                    <Ionicons name="add" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.orderItemRight}>
                <Text style={styles.orderItemTotal}>₹{item.product.price * item.quantity}</Text>
                {item.product.stock <= 5 && (
                  <Text style={styles.stockWarning}>Only {item.product.stock} left</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Promo Code Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Promo Code</Text>
          </View>
          
          {appliedPromo ? (
            <View style={styles.appliedPromoContainer}>
              <View style={styles.appliedPromoInfo}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <View style={styles.appliedPromoText}>
                  <Text style={styles.appliedPromoCode}>{appliedPromo.code}</Text>
                  <Text style={styles.appliedPromoDiscount}>
                    You saved ₹{promoDiscount.toFixed(2)}!
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={removePromoCode} disabled={placingOrder}>
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInputContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                editable={!promoLoading && !placingOrder} 
              />
              <TouchableOpacity
                style={[styles.applyPromoButton, promoLoading && styles.disabledButton]}
                onPress={applyPromoCode}
                disabled={promoLoading || placingOrder}
              >
                {promoLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.applyPromoText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Price Breakdown Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₹{getSubtotal().toFixed(2)}</Text>
          </View>
          
          {promoDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.discountLabel]}>Promo Discount</Text>
              <Text style={[styles.priceValue, styles.discountValue]}>-₹{promoDiscount.toFixed(2)}</Text>
            </View>
          )}
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax ({settings ? settings.tax_rate : 0}% GST)</Text>
            <Text style={styles.priceValue}>₹{getTax().toFixed(2)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Delivery Charge
              {getSubtotal() >= (settings?.delivery_fee?.free_delivery_threshold || 0) && 
                <Text style={styles.freeDeliveryText}> (Free)</Text>
              }
            </Text>
            <Text style={styles.priceValue}>₹{getDeliveryCharge().toFixed(2)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>App Fee</Text>
            <Text style={styles.priceValue}>₹{getAppFee().toFixed(2)}</Text>
          </View>
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{getTotal().toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.paymentOption}
            onPress={() => setPaymentMethod('cod')}
            disabled={placingOrder}
          >
            <View style={styles.paymentOptionLeft}>
              <Ionicons name="cash-outline" size={24} color="#007AFF" />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentOptionSubtitle}>Pay when you receive your order</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer with Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, placingOrder && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order - ₹{getTotal().toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Animation Modal */}
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="none"
      >
        <View style={styles.successOverlay}>
          <Animated.View 
            style={[
              styles.successContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={80} color="#fff" />
            </View>
            <Text style={styles.successText}>Order Placed Successfully!</Text>
            <Text style={styles.successSubtext}>Your order will be delivered soon</Text>
          </Animated.View>
        </View>
      </Modal>

      {placingOrder && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingOverlayContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingOverlayText}>Placing your order...</Text>
            <Text style={styles.loadingOverlaySubtext}>Please wait, don't close the app</Text>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  disabledSection: {
    opacity: 0.6,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayContent: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingOverlayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  loadingOverlaySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  addressCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addressInfo: {
    marginBottom: 12,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  coordinatesText: {
    fontSize: 11,
    color: '#4CAF50',
    // fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  changeAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  changeAddressText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
  },
  selectAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderItemBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderItemRight: {
    alignItems: 'flex-end',
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stockWarning: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  disabledQuantityButton: {
    opacity: 0.5,
  },
  quantityDisplay: {
    marginHorizontal: 16,
    minWidth: 30,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  promoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  applyPromoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyPromoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appliedPromoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fff0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  appliedPromoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedPromoText: {
    marginLeft: 12,
  },
  appliedPromoCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appliedPromoDiscount: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  discountLabel: {
    color: '#4CAF50',
  },
  discountValue: {
    color: '#4CAF50',
  },
  freeDeliveryText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
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
  shopNowButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentOptionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
    padding: 40,
  },
  successCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
});