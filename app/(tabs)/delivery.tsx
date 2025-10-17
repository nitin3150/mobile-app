import React, { useEffect, useState, useCallback } from 'react';
import { View, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { API_BASE_URL } from '../../config/apiConfig';
import { Order, TabType } from '../../types/delivery.types';
import { styles } from '../../styles/delivery.styles';

import DeliveryHeader from '../../components/delivery/DeliveryHeader';
import DeliveryTabs from '../../components/delivery/DeliveryTabs';
import OrdersList from '../../components/delivery/OrdersList';
import OrderDetailsModal from '../../components/delivery/OrderDetailsModal';

export default function DeliveryScreen() {
  console.log('DeliveryScreen component loaded');
  
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('available');
  
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAvailableOrders = async () => {
    if (!token) return [];
    
    try {
      console.log('Fetching available orders...');
      const response = await fetch(`${API_BASE_URL}/delivery/available`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Only delivery partners can access this.');
        }
        throw new Error(`Failed to fetch available orders: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Available orders fetched:', data.length);
      return data;
    } catch (error) {
      console.error('Error fetching available orders:', error);
      throw error;
    }
  };

  const fetchAssignedOrders = async () => {
    if (!token) return [];
    
    try {
      console.log('Fetching assigned orders...');
      const response = await fetch(`${API_BASE_URL}/delivery/assigned`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Only delivery partners can access this.');
        }
        throw new Error(`Failed to fetch assigned orders: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Assigned orders fetched:', data.length);
      return data;
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
      throw error;
    }
  };

  const fetchDeliveredOrders = async () => {
    if (!token) return [];
    
    try {
      console.log('Fetching delivered orders...');
      const response = await fetch(`${API_BASE_URL}/delivery/delivered`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Only delivery partners can access this.');
        }
        throw new Error(`Failed to fetch delivered orders: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Delivered orders fetched:', data.length);
      return data;
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
      throw error;
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    console.log('Fetching delivery orders...');
    
    try {
      const [available, assigned, delivered] = await Promise.all([
        fetchAvailableOrders(),
        fetchAssignedOrders(),
        fetchDeliveredOrders()
      ]);

      setAvailableOrders(available);
      setAssignedOrders(assigned);
      setDeliveredOrders(delivered);

      console.log('All orders loaded successfully');

    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', `Failed to fetch orders: ${error instanceof Error ? (error.message || 'Please check your connection.') : 'Please check your connection.'}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    console.log('DeliveryScreen useEffect - User role:', user?.role);
    
    if (user && user.role !== 'delivery_partner') {
      Alert.alert(
        'Access Denied',
        'This section is only for delivery partners.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
      return;
    }

    if (user?.role === 'delivery_partner') {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  const handleAcceptOrder = async (orderId: string) => {
    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActionLoading(true);
            try {
              console.log('Accepting order:', orderId);
              
              const response = await fetch(`${API_BASE_URL}/delivery/${orderId}/accept`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to accept order');
              }

              const data = await response.json();
              console.log('Order accepted:', data);
              
              Alert.alert('Success', 'Order accepted!');
              
              await fetchOrders();
              setCurrentTab('assigned');
              
            } catch (error) {
              console.error('Error accepting order:', error);
              Alert.alert('Error', `Failed to accept order: ${error instanceof Error ? (error.message || 'Please check your connection.') : 'Please check your connection.'}`);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    Alert.alert(
      'Mark as Delivered',
      'Confirm that this order has been delivered to the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              console.log('Marking order as delivered:', orderId);
              
              const response = await fetch(`${API_BASE_URL}/delivery/${orderId}/mark-delivered`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to mark order as delivered');
              }

              const data = await response.json();
              console.log('Order marked as delivered:', data);
              
              Alert.alert('Success', 'Order marked as delivered!');
              
              await fetchOrders();
              setIsModalVisible(false);
              setCurrentTab('delivered');
              
            } catch (error) {
              console.error('Error marking as delivered:', error);
              Alert.alert('Error', `Failed to update order status: ${error instanceof Error ? (error.message || 'Please check your connection.') : 'Please check your connection.'}`);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  console.log('Rendering DeliveryScreen component');

  return (
    <SafeAreaView style={styles.container}>
      <DeliveryHeader 
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <DeliveryTabs 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        availableCount={availableOrders.length}
        assignedCount={assignedOrders.length}
        deliveredCount={deliveredOrders.length}
      />

      <OrdersList 
        currentTab={currentTab}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        availableOrders={availableOrders}
        assignedOrders={assignedOrders}
        deliveredOrders={deliveredOrders}
        actionLoading={actionLoading}
        handleAcceptOrder={handleAcceptOrder}
        handleMarkAsDelivered={handleMarkAsDelivered}
        openOrderDetails={openOrderDetails}
      />

      {selectedOrder && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <OrderDetailsModal 
            selectedOrder={selectedOrder}
            actionLoading={actionLoading}
            handleMarkAsDelivered={handleMarkAsDelivered}
            setIsModalVisible={setIsModalVisible}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}