import React, {useEffect,useState} from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { styles } from '../../styles/home.styles';
import { API_ENDPOINTS } from '@/config/apiConfig';

interface TopBarProps {
  userAddress: string;
  cartCount: number;
  authLoading: boolean;
  token: string | null;
}

const TopBar: React.FC<TopBarProps> = ({ userAddress, cartCount, authLoading, token }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!token) return;
      try {
        const response = await fetch(API_ENDPOINTS.UNREAD_COUNT, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [token]);

  const handleCartPress = () => {
    if (authLoading) {
      Alert.alert('Please wait', 'Checking login status...');
      return;
    }
    if (!token) {
      Alert.alert(
        'Login Required',
        'Please login to view your cart',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    router.push('/(tabs)/explore');
  };

  const handleNotificationPress = () => {
    if (authLoading) {
      Alert.alert('Please wait', 'Checking login status...');
      return;
    }
    if (!token) {
      Alert.alert(
        'Login Required',
        'Please login to view notifications',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    router.push('/notifications');
  };

  return (
    <View style={styles.topBar}>
      <TouchableOpacity 
        style={styles.locationContainer} 
        onPress={() => router.push('/address')}
      >
        <Ionicons name="location-outline" size={20} color="#333" />
        <Text style={styles.locationText} numberOfLines={1}>{userAddress}</Text>
        <Ionicons name="chevron-down" size={16} color="#333" />
      </TouchableOpacity>
      <View style={styles.topBarActions}>
        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={handleNotificationPress}
        >
          <Ionicons name="notifications-outline" size={24} color="#333" />
          {/* Uncomment below if you want to show notification badge */}
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
          <Ionicons name="bag-outline" size={24} color="#333" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TopBar;