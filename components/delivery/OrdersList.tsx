import React from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, TabType } from '../../types/delivery.types';
import OrderCard from './OrderCard';
import { styles } from '../../styles/delivery.styles';
import { openMapsWithAddress } from '../../utils/mapUtils';

interface OrdersListProps {
  currentTab: TabType;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  availableOrders: Order[];
  assignedOrders: Order[];
  deliveredOrders: Order[];
  actionLoading: boolean;
  handleAcceptOrder: (orderId: string) => void;
  handleMarkAsDelivered: (orderId: string) => void;
  openOrderDetails: (order: Order) => void;
}

const OrdersList: React.FC<OrdersListProps> = ({
  currentTab,
  loading,
  refreshing,
  onRefresh,
  availableOrders,
  assignedOrders,
  deliveredOrders,
  actionLoading,
  handleAcceptOrder,
  handleMarkAsDelivered,
  openOrderDetails,
}) => {
  const getCurrentTabData = (): Order[] => {
    switch (currentTab) {
      case 'available': return availableOrders;
      case 'assigned': return assignedOrders;
      case 'delivered': return deliveredOrders;
      default: return [];
    }
  };

  const tabData = getCurrentTabData();
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tabData}
      renderItem={({ item }) => (
        <OrderCard 
          item={item}
          currentTab={currentTab}
          actionLoading={actionLoading}
          handleAcceptOrder={handleAcceptOrder}
          handleMarkAsDelivered={handleMarkAsDelivered}
          openOrderDetails={openOrderDetails}
        />
      )}
      keyExtractor={(item) => item.id}
      style={styles.ordersList}
      contentContainerStyle={styles.ordersListContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={currentTab === 'available' ? 'storefront-outline' : 
                 currentTab === 'assigned' ? 'bicycle-outline' : 'checkmark-circle-outline'} 
            size={64} 
            color="#ccc" 
          />
          <Text style={styles.emptyTitle}>
            {currentTab === 'available' ? 'No Available Orders' :
             currentTab === 'assigned' ? 'No Assigned Orders' : 'No Delivered Orders'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {currentTab === 'available' ? 'Check back later for new delivery opportunities' :
             currentTab === 'assigned' ? 'You have no orders assigned for delivery' : 
             'You haven\'t delivered any orders yet'}
          </Text>
        </View>
      }
    />
  );
};

export default OrdersList;