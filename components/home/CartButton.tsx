import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, CartQuantities } from '../../types/home.types';
import { styles } from '../../styles/home.styles';

interface CartButtonProps {
  product: Product;
  cartQuantities: CartQuantities;
  addingToCart: {[key: string]: boolean};
  addToCart: (productId: string) => void;
  updateCartQuantity: (productId: string, newQuantity: number) => void;
}

const CartButton: React.FC<CartButtonProps> = ({
  product,
  cartQuantities,
  addingToCart,
  addToCart,
  updateCartQuantity,
}) => {
  const productId = product.id;
  const quantity = cartQuantities[productId] || 0;
  const isLoading = addingToCart[productId] || false;
  const isOutOfStock = product.stock <= 0;

  if (isOutOfStock) {
    return (
      <View style={styles.outOfStockButton}>
        <Text style={styles.outOfStockText}>Out of Stock</Text>
      </View>
    );
  }

  if (quantity > 0) {
    return (
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={[styles.quantityButton, isLoading && styles.disabledButton]}
          onPress={() => updateCartQuantity(productId, quantity - 1)}
          disabled={isLoading}
        >
          <Ionicons name="remove" size={16} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{quantity}</Text>
        <TouchableOpacity
          style={[styles.quantityButton, isLoading && styles.disabledButton]}
          onPress={() => updateCartQuantity(productId, quantity + 1)}
          disabled={isLoading || quantity >= product.stock}
        >
          <Ionicons name="add" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.addToCartButton, isLoading && styles.disabledButton]}
      onPress={() => addToCart(productId)}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons name="add" size={16} color="#fff" />
      )}
    </TouchableOpacity>
  );
};

export default CartButton;