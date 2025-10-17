import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOrderTracking } from '../contexts/OrderTrackingContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function OrderStatusBanner() {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const { activeOrder, dismissBanner } = useOrderTracking();
  const { token } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Auto-slide effect
  useEffect(() => {
    if (shouldShow && activeOrder?.order_status === 'delivered') {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          const next = prev === 0 ? 1 : 0;
          Animated.spring(slideX, {
            toValue: -next * (SCREEN_WIDTH - 32),
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
          return next;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [shouldShow, activeOrder?.order_status, slideX]);

  // Pan responder for swipe
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (activeOrder?.order_status === 'delivered') {
          if (gestureState.dx < -50 && currentSlide === 0) {
            setCurrentSlide(1);
            Animated.spring(slideX, {
              toValue: -(SCREEN_WIDTH - 32),
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          } else if (gestureState.dx > 50 && currentSlide === 1) {
            setCurrentSlide(0);
            Animated.spring(slideX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    console.log('🎨 Banner effect triggered:', {
      activeOrder: activeOrder?.id,
      status: activeOrder?.order_status,
    });

    const activeStatuses = ['preparing', 'assigned', 'assigning', 'out_for_delivery', 'delivered'];
    const shouldDisplay = activeOrder && activeStatuses.includes(activeOrder.order_status);
    
    console.log('🎨 Should display banner:', shouldDisplay);
    setShouldShow(!!shouldDisplay);

    if (shouldDisplay) {
      console.log('🎨 Animating banner IN');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      setCurrentSlide(0);
      slideX.setValue(0);
      setRating(0); // Reset rating for new order
    } else {
      console.log('🎨 Animating banner OUT');
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [activeOrder, slideAnim, slideX]);

  const handleCloseBanner = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShouldShow(false);
      if (activeOrder?.order_status === 'delivered') {
        dismissBanner();
      }
    });
  };

  const handleRatingSubmit = async (selectedRating: number) => {
    if (submittingRating || !activeOrder) return;

    console.log('⭐ Rating submitted:', selectedRating);
    setRating(selectedRating);
    setSubmittingRating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${activeOrder.id}/rate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: selectedRating,
          order_id: activeOrder.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      const data = await response.json();
      console.log('✅ Rating saved:', data);

      // Show success feedback
      Alert.alert('Thank you!', 'Your rating has been submitted successfully.');

      // Close banner after short delay
      setTimeout(() => {
        handleCloseBanner();
      }, 1000);
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
      setRating(0); // Reset rating on error
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleIndicatorPress = (index: number) => {
    setCurrentSlide(index);
    Animated.spring(slideX, {
      toValue: -index * (SCREEN_WIDTH - 32),
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  if (!shouldShow || !activeOrder) {
    console.log('🎨 Banner not rendering (shouldShow:', shouldShow, ')');
    return null;
  }

  console.log('🎨 Banner IS RENDERING');

  const getStatusConfig = () => {
    switch (activeOrder.order_status) {
      case 'preparing':
        return {
          text: 'Preparing your order',
          icon: 'restaurant' as const,
          bgColor: '#FFFFFF',
          textColor: '#1C1C1C',
        };
      case 'assigning':
        return {
          text: 'Assigning to a delivery partner',
          icon: 'restaurant' as const,
          bgColor: '#FFFFFF',
          textColor: '#1C1C1C',
        };
      case 'assigned':
        return {
          text: 'Delivery partner assigned',
          icon: 'bicycle' as const,
          bgColor: '#FFFFFF',
          textColor: '#1C1C1C',
        };
      case 'out_for_delivery':
        return {
          text: 'Preparing your order',
          icon: 'bicycle' as const,
          bgColor: '#FFFFFF',
          textColor: '#1C1C1C',
        };
      case 'delivered':
        return {
          text: 'Your order has arrived!',
          icon: 'checkmark-circle' as const,
          bgColor: '#FFFFFF',
          textColor: '#1C1C1C',
        };
      default:
        return {
          text: 'Order in progress',
          icon: 'time' as const,
          bgColor: '#FFFFFF',
          textColor: '#1C1C1C',
        };
    }
  };

  const config = getStatusConfig();
  const showRatingSlide = activeOrder.order_status === 'delivered';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.wrapper} {...panResponder.panHandlers}>
        <View style={styles.sliderWrapper}>
          <Animated.View
            style={[
              styles.sliderContainer,
              {
                transform: [{ translateX: slideX }],
              },
            ]}
          >
            {/* Slide 1: Order Status */}
            <TouchableOpacity
              style={styles.slide}
              onPress={() => {
                console.log('🎨 Banner tapped, navigating to order-tracking');
                router.push('/order-tracking');
              }}
              activeOpacity={0.9}
            >
              <View style={styles.content}>
                <View style={styles.iconContainer}>
                  <Ionicons name={config.icon} size={22} color="#1C1C1C" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.restaurantName, { color: config.textColor }]}>
                      {config.text}
                  </Text>
                  {/* <Text style={styles.statusText}>{config.text} ▸</Text> */}
                </View>
                {activeOrder.estimated_delivery && (
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>arriving in</Text>
                    <Text style={styles.timeValue}>
                      {activeOrder.estimated_delivery} mins
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Slide 2: Rating */}
            {showRatingSlide && (
              <View style={styles.slide}>
                <View style={styles.content}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="restaurant" size={22} color="#1C1C1C" />
                  </View>
                  <View style={styles.ratingTextContainer}>
                    {/* <Text style={[styles.restaurantName, { color: config.textColor }]}>
                      {activeOrder.restaurant_name || 'Restaurant Name'}
                    </Text> */}
                    <Text style={styles.ratingQuestion}>How was your experience?</Text>
                  </View>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => !submittingRating && handleRatingSubmit(star)}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                        disabled={submittingRating}
                      >
                        <Ionicons
                          name={rating >= star ? 'star' : 'star-outline'}
                          size={26}
                          color={submittingRating ? '#ccc' : '#FFB800'}
                          style={styles.star}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleCloseBanner}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>

        {showRatingSlide && (
          <View style={styles.indicatorContainer}>
            <TouchableOpacity
              onPress={() => handleIndicatorPress(0)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.indicator, currentSlide === 0 && styles.activeIndicator]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleIndicatorPress(1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.indicator, currentSlide === 1 && styles.activeIndicator]} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    left: 16,
    right: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  wrapper: {
    width: '100%',
  },
  sliderWrapper: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
  },
  slide: {
    width: SCREEN_WIDTH - 32,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 40,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
  timeContainer: {
    backgroundColor: '#00B56A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '400',
    marginBottom: 2,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  ratingTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  ratingQuestion: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginLeft: 2,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 8,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D0D0',
  },
  activeIndicator: {
    backgroundColor: '#666',
  },
});