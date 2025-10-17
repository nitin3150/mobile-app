import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import { useAuth } from './AuthContext';

interface DeliveryPartner {
  name: string;
  phone: string;
  rating?: number;
  deliveries?: number;
}

interface Order {
    _id: string;
    id?: string;  
    order_status: 'preparing' | 'assigning' | 'assigned' | 'out_for_delivery' | 'delivered' | 'arrived';
    delivery_partner?: DeliveryPartner;
    estimated_delivery?: string;
    actual_delivery?: string;
    delivery_partner_location?: {
      latitude: number;
      longitude: number;
    };
    status_message?: string;
    timeline?: Array<{
      status: string;
      timestamp: string;
      message?: string;
    }>;

    items?: Array<{
      product_name?: string;
      product?: string;
      quantity: number;
      price: number;
    }>;
    subtotal?: number;
    tax?: number;
    delivery_charge?: number;
    app_fee?: number;
    promo_discount?: number;
    total_amount?: number;
    delivery_address?: {
      address: string;
      city: string;
      state: string;
      pincode: string;
      phone: string;
    };
    status_change_history?: Array<{
      status: string;
      changed_at: string;
    }>;
    delivered_at?: string;
    arrived_at?: string;
    out_for_delivery_at?: string;
    assigned_at?: string;
    preparing_at?: string;
    confirmed_at?: string;
    created_at?: string;
}

interface OrderTrackingContextType {
  activeOrder: Order | null;
  loading: boolean;
  error: string | null;
  refreshActiveOrder: () => Promise<void>;
  dismissBanner: () => void;
  resumePolling: () => void;
}

const OrderTrackingContext = createContext<OrderTrackingContextType | undefined>(undefined);

export function useOrderTracking() {
  const context = useContext(OrderTrackingContext);
  if (!context) {
    throw new Error('useOrderTracking must be used within OrderTrackingProvider');
  }
  return context;
}

export function OrderTrackingProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null);

  // ✅ Add logging to see when context initializes
  useEffect(() => {
    console.log('🎯 OrderTrackingProvider mounted');
    return () => {
      console.log('🎯 OrderTrackingProvider unmounted');
    };
  }, []);

  // ✅ Log when auth state changes
  useEffect(() => {
    console.log('🎯 Auth state in OrderTracking:', {
      hasToken: !!token,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
    });
  }, [token, user]);

  const fetchActiveOrder = async () => {
    if (!token || !user || !isPollingEnabled) {
      console.log('⏸️ Skipping fetch - token:', !!token, 'user:', !!user, 'user.id:', user?.id, 'polling:', isPollingEnabled);
      return;
    }

    try {
      console.log('📡 Fetching active order...');
      console.log('📡 URL:', `${API_BASE_URL}/orders/active`);
      console.log('📡 User ID:', user.id);
      
      const response = await fetch(`${API_BASE_URL}/orders/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.status === 404) {
        console.log('📦 No active orders (404)');
        setActiveOrder(null);
        setError(null);
        setDismissedOrderId(null);
        return;
      }

      if (response.status === 401) {
        console.log('🔒 Unauthorized (401)');
        setActiveOrder(null);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Active order received:', {
        id: data?.id,
        status: data?.order_status,
        // restaurant: data?.restaurant_name,
      });

      if (!data) {
        console.log('📦 No data returned');
        setActiveOrder(null);
        return;
      }

      // Check dismissed orders
      if (dismissedOrderId && data.id !== dismissedOrderId) {
        setDismissedOrderId(null);
        setIsPollingEnabled(true);
      }

      if (dismissedOrderId === data.id && data.order_status === 'delivered') {
        console.log('🚫 Order dismissed');
        return;
      }

      console.log('✅ Setting active order');
      setActiveOrder(data);
      setError(null);
    } catch (err) {
      console.error('⚠️ Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActiveOrder(null);
    }
  };

  const refreshActiveOrder = async () => {
    setLoading(true);
    await fetchActiveOrder();
    setLoading(false);
  };

  const dismissBanner = () => {
    console.log('❌ Dismissing banner');
    if (activeOrder?.order_status === 'delivered') {
      setDismissedOrderId(activeOrder.id);
      setActiveOrder(null);
    }
  };

  const resumePolling = () => {
    console.log('▶️ Resuming polling');
    setIsPollingEnabled(true);
    setDismissedOrderId(null);
  };

  // Polling effect
  useEffect(() => {
    console.log('🔄 Polling effect triggered:', {
      hasToken: !!token,
      hasUser: !!user,
      userId: user?.id,
      isPollingEnabled,
    });

    if (!token || !user || !isPollingEnabled) {
      console.log('⏸️ Polling NOT started - missing requirements');
      return;
    }

    console.log('▶️ Starting order polling for user:', user.email);

    // Initial fetch
    fetchActiveOrder();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      console.log('⏰ Polling interval triggered');
      fetchActiveOrder();
    }, 10000);

    return () => {
      console.log('⏹️ Stopping order polling');
      clearInterval(interval);
    };
  }, [token, user, isPollingEnabled, dismissedOrderId]);

  return (
    <OrderTrackingContext.Provider
      value={{
        activeOrder,
        loading,
        error,
        refreshActiveOrder,
        dismissBanner,
        resumePolling,
      }}
    >
      {children}
    </OrderTrackingContext.Provider>
  );
}