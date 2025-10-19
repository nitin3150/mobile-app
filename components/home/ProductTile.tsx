import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { Product, CartQuantities } from '../../types/home.types';
import { getImageUrl } from '../../utils/ImageUtils';
import CartButton from './CartButton';
import { styles } from '../../styles/home.styles';

interface ProductTileProps {
  item: Product;
  index: number;
  cartQuantities: CartQuantities;
  addingToCart: {[key: string]: boolean};
  addToCart: (productId: string) => void;
  updateCartQuantity: (productId: string, newQuantity: number) => void;
}

const ProductTile: React.FC<ProductTileProps> = ({
  item,
  index,
  cartQuantities,
  addingToCart,
  addToCart,
  updateCartQuantity,
}) => {
  const imageUrl = getImageUrl(item.images);
  const isOutOfStock = item.stock <= 0;
  
  const handleProductPress = () => {
    const productId = item.id;
    
    if (!productId) {
      Alert.alert('Error', 'Product ID not found');
      return;
    }
    
    router.push(`/product/${productId}`);
  };

  return (
    <View style={[styles.productTile, isOutOfStock && styles.outOfStockTile]}>
      <TouchableOpacity 
        onPress={handleProductPress}
        disabled={isOutOfStock}
        style={isOutOfStock ? styles.disabledTouchable : undefined}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.productTileImage, isOutOfStock && styles.dimmedImage]}
            resizeMode="cover"
            onError={() => {
              console.log('Product image failed to load for:', item.name);
            }}
          />
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockOverlayText}>Out of Stock</Text>
            </View>
          )}
        </View>
        <View style={styles.productTileContent}>
          <Text style={[styles.productTileName, isOutOfStock && styles.dimmedText]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.productTileBrand, isOutOfStock && styles.dimmedText]} numberOfLines={1}>{item.brand?.name || 'No Brand'}</Text>
          <Text style={[styles.productTilePrice, isOutOfStock && styles.dimmedPrice]}>₹{item.price}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.cartButtonContainer}>
        <CartButton 
          product={item}
          cartQuantities={cartQuantities}
          addingToCart={addingToCart}
          addToCart={addToCart}
          updateCartQuantity={updateCartQuantity}
        />
      </View>
    </View>
  );
};

export default ProductTile;