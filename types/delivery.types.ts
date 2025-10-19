import { Float } from "react-native/Libraries/Types/CodegenTypes";

export interface Order {
    _id: string;
    id: string;
    order_status: string;
    total_amount: number;
    created_at: string;
    payment_method: string;
    user_info?: {
      name: string;
      phone: string;
      email: string;
    };
    delivery_address?: {
      address: string;
      city: string;
      state: string;
      pincode: string;
      phone: string;
      latitude: number;
      longitude: number;
    };
    items?: Array<{
      product: string;
      product_name: string;
      product_image: any[];
      quantity: number;
      price: number;
    }>;
  }
  
  export type TabType = 'available' | 'assigned' | 'delivered';