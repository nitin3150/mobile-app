// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   RefreshControl,
//   Alert,
//   TouchableOpacity,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { router } from 'expo-router';
// import { useFocusEffect } from '@react-navigation/native';
// import { API_ENDPOINTS } from '../../config/apiConfig';
// import { useAuth } from '../../contexts/AuthContext';

// import { RequestProductRef } from '../../components/RequestProductSection';
// import TopBar from '../../components/home/TopBar';
// import SearchBar from '../../components/home/SearchBar';
// import CategoryFilterRow from '../../components/home/CategoryFilterRow';
// import ProductTile from '../../components/home/ProductTile';
// import ProductCard from '../../components/home/ProductCard';
// import CategorySection from '../../components/home/CategorySection';
// import AnimatedLogo from '../../components/home/AnimatedLogo';
// import CartNotification from '../../components/home/CartNotification';
// import RequestProductSectionWrapper from '../../components/home/RequestProductSectionWrapper';

// import { Product, Category, CartQuantities } from '../../types/home.types';
// import { styles } from '../../styles/home.styles';

// const HomeScreen = () => {
//   const { user, token, loading: authLoading } = useAuth();
  
//   const [products, setProducts] = useState<Product[]>([]);
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [showCartNotification, setShowCartNotification] = useState(false);
//   const [userAddress, setUserAddress] = useState<string>('Add Address');
  
//   const [cartQuantities, setCartQuantities] = useState<CartQuantities>({});
//   const [addingToCart, setAddingToCart] = useState<{[key: string]: boolean}>({});
  
//   const initialDataFetched = useRef(false);
//   const lastFetchTime = useRef(0);
//   const isFetching = useRef(false);
//   const requestFormRef = useRef<RequestProductRef>(null);

//   const fetchData = useCallback(async () => {
//     if (isFetching.current) {
//       console.log('Fetch already in progress, skipping...');
//       return;
//     }
    
//     const now = Date.now();
//     if (now - lastFetchTime.current < 2000) {
//       console.log('Too soon since last fetch, skipping...');
//       return;
//     }
    
//     try {
//       isFetching.current = true;
//       lastFetchTime.current = now;
//       setLoading(true);
      
//       console.log('🔄 Fetching initial data...');
//       const timestamp = Date.now();
      
//       const [productsRes, categoriesRes] = await Promise.all([
//         fetch(`${API_ENDPOINTS.PRODUCTS}?_t=${timestamp}`),
//         fetch(`${API_ENDPOINTS.CATEGORIES}?_t=${timestamp}`),
//       ]);
      
//       if (!productsRes.ok || !categoriesRes.ok) {
//         throw new Error(`HTTP Error - Products: ${productsRes.status}, Categories: ${categoriesRes.status}`);
//       }
      
//       const productsData = await productsRes.json();
//       const categoriesData = await categoriesRes.json();
      
//       let productsArray: Product[] = [];
//       if (productsData.products && Array.isArray(productsData.products)) {
//         productsArray = productsData.products;
//       } else if (Array.isArray(productsData)) {
//         productsArray = productsData;
//       }
      
//       let categoriesArray: Category[] = [];
//       if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
//         categoriesArray = categoriesData.categories;
//       } else if (Array.isArray(categoriesData)) {
//         categoriesArray = categoriesData;
//       }
      
//       const activeProducts = productsArray.filter(product => 
//         product.status === 'active' || product.status === undefined
//       );
//       const activeCategories = categoriesArray.filter(category => 
//         category.status === 'active' || category.status === undefined
//       );
      
//       console.log('✅ Data fetched successfully:', {
//         products: activeProducts.length,
//         categories: activeCategories.length
//       });
      
//       setProducts(activeProducts);
//       setFilteredProducts(activeProducts);
//       setCategories(activeCategories);
//       initialDataFetched.current = true;
      
//     } catch (error) {
//       console.error('❌ Error fetching data:', error);
//       Alert.alert('Error', `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     } finally {
//       setLoading(false);
//       isFetching.current = false;
//     }
//   }, []);

//   const fetchFilteredProducts = useCallback(async (search: string = '', categoryId: string | null = null) => {
//     if (isFetching.current) return;
    
//     try {
//       isFetching.current = true;
//       console.log('🔍 Fetching filtered products:', { search, categoryId });
      
//       if (categoryId && !search) {
//         console.log('🎯 Filtering locally by category:', categoryId);
//         const filtered = products.filter(product => {
//           if (typeof product.category === 'object') {
//             return product.category.id === categoryId;
//           }
//           return product.category === categoryId;
//         });
//         console.log('✅ Local filter result:', filtered.length, 'products');
//         setFilteredProducts(filtered);
//         isFetching.current = false;
//         return;
//       }
      
//       const timestamp = Date.now();
//       let productsUrl = `${API_ENDPOINTS.PRODUCTS}?_t=${timestamp}`;
      
//       if (search) {
//         productsUrl += `&search=${encodeURIComponent(search)}`;
//       }
//       if (categoryId) {
//         productsUrl += `&category=${encodeURIComponent(categoryId)}`;
//       }
  
//       const response = await fetch(productsUrl);
      
//       if (!response.ok) {
//         throw new Error(`HTTP Error: ${response.status}`);
//       }
      
//       const productsData = await response.json();
      
//       let productsArray: Product[] = [];
//       if (productsData.products && Array.isArray(productsData.products)) {
//         productsArray = productsData.products;
//       } else if (Array.isArray(productsData)) {
//         productsArray = productsData;
//       }
      
//       const activeProducts = productsArray.filter(product => 
//         product.status === 'active' || product.status === undefined
//       );
      
//       console.log('✅ Backend search result:', activeProducts.length, 'products');
//       setFilteredProducts(activeProducts);
      
//     } catch (error) {
//       console.error('❌ Error fetching filtered products:', error);
//     } finally {
//       isFetching.current = false;
//     }
//   }, [products]);

//   const fetchCartCount = useCallback(async () => {
//     if (!token) {
//       setCartCount(0);
//       setCartQuantities({});
//       return;
//     }
    
//     try {
//       const response = await fetch(API_ENDPOINTS.CART, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });
      
//       if (response.ok) {
//         const cartData = await response.json();
//         const items = cartData.items || [];
//         setCartCount(items.length);
        
//         const quantities: CartQuantities = {};
//         items.forEach((item: any) => {
//           if (item.product && item.product.id) {
//             quantities[item.product.id] = item.quantity;
//           }
//         });
//         setCartQuantities(quantities);
//       } else {
//         setCartCount(0);
//         setCartQuantities({});
//       }
//     } catch (error) {
//       console.error('Error fetching cart count:', error);
//       setCartCount(0);
//       setCartQuantities({});
//     }
//   }, [token]);

//   const fetchUserAddress = useCallback(async () => {
//     if (!token) {
//       setUserAddress('Add Address');
//       return;
//     }
    
//     try {
//       const profileResponse = await fetch(`${API_ENDPOINTS.MY_ADDRESS}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       if (profileResponse.ok) {
//         const userData = await profileResponse.json();
//         let displayAddress = null;
        
//         if (Array.isArray(userData)) {
//           const defaultAddress = userData.find(addr => addr.is_default) || userData[0];
//           if (defaultAddress) {
//             const addressParts = [];
//             if (defaultAddress.street) addressParts.push(defaultAddress.street);
//             if (defaultAddress.city) addressParts.push(defaultAddress.city);
//             if (defaultAddress.state) addressParts.push(defaultAddress.state);
//             if (defaultAddress.pincode) addressParts.push(defaultAddress.pincode);
            
//             if (addressParts.length > 0) {
//               displayAddress = addressParts.join(', ');
//             }
//           }
//         }
        
//         if (displayAddress) {
//           if (displayAddress.length > 30) {
//             displayAddress = displayAddress.substring(0, 27) + '...';
//           }
//           setUserAddress(displayAddress);
//         } else {
//           setUserAddress('Add Address');
//         }
//       } else {
//         setUserAddress('Add Address');
//       }
      
//     } catch (error) {
//       console.error('Error fetching user address:', error);
//       setUserAddress('Add Address');
//     }
//   }, [token]);

//   const addToCart = useCallback(async (productId: string) => {
//     if (!token) {
//       Alert.alert(
//         'Login Required',
//         'Please login to add items to your cart',
//         [
//           { text: 'Cancel', style: 'cancel' },
//           { text: 'Login', onPress: () => router.push('/auth/login') }
//         ]
//       );
//       return;
//     }

//     const product = [...products, ...filteredProducts].find(p => p.id === productId);
//     if (!product) {
//       Alert.alert('Error', 'Product not found');
//       return;
//     }

//     if (product.stock === 0) {
//       Alert.alert('Error', 'Product is out of stock');
//       return;
//     }

//     setAddingToCart(prev => ({ ...prev, [productId]: true }));

//     try {
//       const response = await fetch(API_ENDPOINTS.CART_ADD, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({ 
//           productId: productId,
//           quantity: 1 
//         }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setCartQuantities(prev => ({
//           ...prev,
//           [productId]: (prev[productId] || 0) + 1
//         }));
        
//         setCartCount(prev => prev + 1);
//         setShowCartNotification(true);
//         setTimeout(() => setShowCartNotification(false), 2000);
//       } else {
//         if (response.status === 401) {
//           Alert.alert('Session Expired', 'Please login again');
//         } else {
//           Alert.alert('Error', data.message || 'Failed to add to cart');
//         }
//       }
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       Alert.alert('Error', 'Failed to add to cart');
//     } finally {
//       setAddingToCart(prev => ({ ...prev, [productId]: false }));
//     }
//   }, [token, products, filteredProducts]);

//   const updateCartQuantity = useCallback(async (productId: string, newQuantity: number) => {
//     if (!token) {
//       Alert.alert('Error', 'Please login to manage cart');
//       return;
//     }

//     setAddingToCart(prev => ({ ...prev, [productId]: true }));

//     try {
//       const cartResponse = await fetch(API_ENDPOINTS.CART, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
      
//       if (!cartResponse.ok) {
//         throw new Error('Failed to fetch cart');
//       }
      
//       const cartData = await cartResponse.json();
//       const cartItem = cartData.items?.find((item: any) => item.product?.id === productId);
      
//       if (!cartItem) {
//         console.log('Cart item not found for product:', productId);
//         setAddingToCart(prev => ({ ...prev, [productId]: false }));
//         return;
//       }

//       if (newQuantity <= 0) {
//         const response = await fetch(`${API_ENDPOINTS.CART_REMOVE}?item_id=${cartItem._id}`, {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         });

//         if (response.ok) {
//           setCartQuantities(prev => {
//             const updated = { ...prev };
//             delete updated[productId];
//             return updated;
//           });
//           setCartCount(prev => Math.max(0, prev - (cartQuantities[productId] || 0)));
//         } else {
//           const errorData = await response.json();
//           Alert.alert('Error', errorData.message || 'Failed to remove item');
//         }
//       } else {
//         const response = await fetch(API_ENDPOINTS.CART_UPDATE, {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//           },
//           body: JSON.stringify({ itemId: cartItem._id, quantity: newQuantity }),
//         });

//         if (response.ok) {
//           const oldQuantity = cartQuantities[productId] || 0;
//           const quantityDiff = newQuantity - oldQuantity;
          
//           setCartQuantities(prev => ({
//             ...prev,
//             [productId]: newQuantity
//           }));
          
//           setCartCount(prev => prev + quantityDiff);
//         } else {
//           const errorData = await response.json();
//           Alert.alert('Error', errorData.message || 'Failed to update quantity');
//         }
//       }
//     } catch (error) {
//       console.error('Error updating cart:', error);
//       Alert.alert('Error', 'Failed to update cart');
//     } finally {
//       setAddingToCart(prev => ({ ...prev, [productId]: false }));
//     }
//   }, [token, cartQuantities]);

//   useEffect(() => {
//     if (!initialDataFetched.current && !isFetching.current) {
//       console.log('🚀 Initial data fetch triggered');
//       fetchData();
//     }
//   }, [fetchData]);

//   useEffect(() => {
//     if (!authLoading) {
//       console.log('🔐 Auth state changed, fetching user data');
//       fetchCartCount();
//       fetchUserAddress();
//     }
//   }, [authLoading, fetchCartCount, fetchUserAddress]);

//   useFocusEffect(
//     useCallback(() => {
//       if (token && !authLoading) {
//         fetchCartCount();
//       }
//     }, [token, authLoading, fetchCartCount])
//   );

//   useEffect(() => {
//     if (!initialDataFetched.current) return;
    
//     const handler = setTimeout(() => {
//       if (searchQuery.length === 0 || searchQuery.length > 2) {
//         console.log('🔎 Search/filter triggered:', { searchQuery, selectedCategory });
//         fetchFilteredProducts(searchQuery, selectedCategory);
//       }
//     }, 500);

//     return () => clearTimeout(handler);
//   }, [searchQuery, selectedCategory, fetchFilteredProducts]);

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     initialDataFetched.current = false;
//     await fetchData();
//     await fetchCartCount();
//     await fetchUserAddress();
//     setRefreshing(false);
//   }, [fetchData, fetchCartCount, fetchUserAddress]);

//   const retryConnection = useCallback(() => {
//     initialDataFetched.current = false;
//     fetchData();
//   }, [fetchData]);

//   const handleCategoryPress = useCallback((categoryId: string | null) => {
//     console.log('📂 Category pressed:', categoryId);
//     setSelectedCategory(categoryId);
//   }, []);

//   const handleRequestSubmitted = useCallback(() => {
//     Alert.alert('Thank you!', 'Your product request has been submitted.');
//   }, []);

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <AnimatedLogo />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const isGridMode = searchQuery.trim() || selectedCategory;

//   return (
//     <SafeAreaView style={styles.container}>
//       <TopBar 
//         userAddress={userAddress}
//         cartCount={cartCount}
//         authLoading={authLoading}
//         token={token}
//       />
//       <SearchBar 
//         searchQuery={searchQuery}
//         setSearchQuery={setSearchQuery}
//       />
//       <CategoryFilterRow 
//         categories={categories}
//         selectedCategory={selectedCategory}
//         handleCategoryPress={handleCategoryPress}
//         requestFormRef={requestFormRef}
//       />
      
//       {isGridMode ? (
//         <FlatList
//           key="products-grid-view"
//           data={filteredProducts}
//           renderItem={({ item, index }) => (
//             <ProductTile 
//               item={item}
//               index={index}
//               cartQuantities={cartQuantities}
//               addingToCart={addingToCart}
//               addToCart={addToCart}
//               updateCartQuantity={updateCartQuantity}
//             />
//           )}
//           keyExtractor={(item, index) => `grid-product-${item.id || index}-${index}`}
//           numColumns={2}
//           ListEmptyComponent={
//             <View style={{ alignItems: 'center', marginTop: 32 }}>
//               <Text style={{ color: '#888', fontSize: 16 }}>No products found.</Text>
//             </View>
//           }
//           ListFooterComponent={() => (
//             <RequestProductSectionWrapper 
//               requestFormRef={requestFormRef}
//               handleRequestSubmitted={handleRequestSubmitted}
//             />
//           )}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 180 }}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#007AFF']}
//               tintColor="#007AFF"
//             />
//           }
//           removeClippedSubviews={false}
//           initialNumToRender={6}
//           maxToRenderPerBatch={8}
//           windowSize={10}
//         />
//       ) : (
//         <FlatList
//           key="categories-browse-view"
//           data={categories}
//           renderItem={({ item, index }) => (
//             <CategorySection 
//               category={item}
//               index={index}
//               products={products}
//               cartQuantities={cartQuantities}
//               addingToCart={addingToCart}
//               addToCart={addToCart}
//               updateCartQuantity={updateCartQuantity}
//               handleCategoryPress={handleCategoryPress}
//             />
//           )}
//           keyExtractor={(item, index) => `category-section-${item.id}-${index}`}
//           ListFooterComponent={() => (
//             <RequestProductSectionWrapper 
//               requestFormRef={requestFormRef}
//               handleRequestSubmitted={handleRequestSubmitted}
//             />
//           )}
//           ListEmptyComponent={
//             <View style={{ alignItems: 'center', marginTop: 32 }}>
//               <Text style={{ color: '#888', fontSize: 16 }}>No categories found.</Text>
//               <TouchableOpacity style={styles.retryButton} onPress={retryConnection}>
//                 <Text style={styles.retryButtonText}>Retry Loading</Text>
//               </TouchableOpacity>
//             </View>
//           }
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#007AFF']}
//               tintColor="#007AFF"
//             />
//           }
//           contentContainerStyle={{ paddingTop: 16, paddingBottom: 180 }}
//           removeClippedSubviews={false}
//           initialNumToRender={5}
//           maxToRenderPerBatch={5}
//           windowSize={8}
//         />
//       )}
      
//       <CartNotification showCartNotification={showCartNotification} />
//     </SafeAreaView>
//   );
// };

// export default HomeScreen;

// (tabs)/index.tsx - UPDATED WITH SHOP STATUS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { API_ENDPOINTS, API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../contexts/AuthContext';

import { RequestProductRef } from '../../components/RequestProductSection';
import TopBar from '../../components/home/TopBar';
import SearchBar from '../../components/home/SearchBar';
import CategoryFilterRow from '../../components/home/CategoryFilterRow';
import ProductTile from '../../components/home/ProductTile';
import CategorySection from '../../components/home/CategorySection';
import AnimatedLogo from '../../components/home/AnimatedLogo';
import CartNotification from '../../components/home/CartNotification';
import RequestProductSectionWrapper from '../../components/home/RequestProductSectionWrapper';
import { ShopClosedModal } from '../../components/home/ShopClosedModal';

import { Product, Category, CartQuantities } from '../../types/home.types';
import { styles } from '../../styles/home.styles';

interface ShopStatus {
  is_open: boolean;
  reopen_time: string | null;
  reason: string | null;
}

const HomeScreen = () => {
  const { user, token, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [showCartNotification, setShowCartNotification] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('Add Address');
  
  const [cartQuantities, setCartQuantities] = useState<CartQuantities>({});
  const [addingToCart, setAddingToCart] = useState<{[key: string]: boolean}>({});
  
  // ✅ NEW: Shop status states
  const [shopStatus, setShopStatus] = useState<ShopStatus | null>(null);
  const [showShopClosedModal, setShowShopClosedModal] = useState(false);
  const [shopStatusChecked, setShopStatusChecked] = useState(false);
  
  const initialDataFetched = useRef(false);
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);
  const requestFormRef = useRef<RequestProductRef>(null);

  // ✅ NEW: Fetch shop status
  const fetchShopStatus = useCallback(async () => {
    try {
      console.log('🏪 Fetching shop status...');
      const response = await fetch(`${API_BASE_URL}/shop/status`);
      
      if (response.ok) {
        const status = await response.json();
        console.log('🏪 Shop status:', status);
        setShopStatus(status);
        
        // Show modal if shop is closed and user hasn't seen it yet
        if (!status.is_open && !shopStatusChecked) {
          console.log('⚠️ Shop is closed, showing modal');
          setShowShopClosedModal(true);
          setShopStatusChecked(true);
        }
      } else {
        console.log('⚠️ Failed to fetch shop status, assuming open');
        setShopStatus({ is_open: true, reopen_time: null, reason: null });
      }
    } catch (error) {
      console.error('❌ Error fetching shop status:', error);
      // Assume open on error
      setShopStatus({ is_open: true, reopen_time: null, reason: null });
    }
  }, [shopStatusChecked]);

  const fetchData = useCallback(async () => {
    if (isFetching.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    const now = Date.now();
    if (now - lastFetchTime.current < 2000) {
      console.log('Too soon since last fetch, skipping...');
      return;
    }
    
    try {
      isFetching.current = true;
      lastFetchTime.current = now;
      setLoading(true);
      
      console.log('🔄 Fetching initial data...');
      const timestamp = Date.now();
      
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.PRODUCTS}?_t=${timestamp}`),
        fetch(`${API_ENDPOINTS.CATEGORIES}?_t=${timestamp}`),
      ]);
      
      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error(`HTTP Error - Products: ${productsRes.status}, Categories: ${categoriesRes.status}`);
      }
      
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      
      let productsArray: Product[] = [];
      if (productsData.products && Array.isArray(productsData.products)) {
        productsArray = productsData.products;
      } else if (Array.isArray(productsData)) {
        productsArray = productsData;
      }
      
      let categoriesArray: Category[] = [];
      if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
        categoriesArray = categoriesData.categories;
      } else if (Array.isArray(categoriesData)) {
        categoriesArray = categoriesData;
      }
      
      const activeProducts = productsArray.filter(product => 
        product.status === 'active' || product.status === undefined
      );
      const activeCategories = categoriesArray.filter(category => 
        category.status === 'active' || category.status === undefined
      );
      
      console.log('✅ Data fetched successfully:', {
        products: activeProducts.length,
        categories: activeCategories.length
      });
      
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);
      setCategories(activeCategories);
      initialDataFetched.current = true;
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      Alert.alert('Error', `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const fetchFilteredProducts = useCallback(async (search: string = '', categoryId: string | null = null) => {
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      console.log('🔍 Fetching filtered products:', { search, categoryId });
      
      if (categoryId && !search) {
        console.log('🎯 Filtering locally by category:', categoryId);
        const filtered = products.filter(product => {
          if (typeof product.category === 'object') {
            return product.category.id === categoryId;
          }
          return product.category === categoryId;
        });
        console.log('✅ Local filter result:', filtered.length, 'products');
        setFilteredProducts(filtered);
        isFetching.current = false;
        return;
      }
      
      const timestamp = Date.now();
      let productsUrl = `${API_ENDPOINTS.PRODUCTS}?_t=${timestamp}`;
      
      if (search) {
        productsUrl += `&search=${encodeURIComponent(search)}`;
      }
      if (categoryId) {
        productsUrl += `&category=${encodeURIComponent(categoryId)}`;
      }
  
      const response = await fetch(productsUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const productsData = await response.json();
      
      let productsArray: Product[] = [];
      if (productsData.products && Array.isArray(productsData.products)) {
        productsArray = productsData.products;
      } else if (Array.isArray(productsData)) {
        productsArray = productsData;
      }
      
      const activeProducts = productsArray.filter(product => 
        product.status === 'active' || product.status === undefined
      );
      
      console.log('✅ Backend search result:', activeProducts.length, 'products');
      setFilteredProducts(activeProducts);
      
    } catch (error) {
      console.error('❌ Error fetching filtered products:', error);
    } finally {
      isFetching.current = false;
    }
  }, [products]);

  const fetchCartCount = useCallback(async () => {
    if (!token) {
      setCartCount(0);
      setCartQuantities({});
      return;
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.CART, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const cartData = await response.json();
        const items = cartData.items || [];
        setCartCount(items.length);
        
        const quantities: CartQuantities = {};
        items.forEach((item: any) => {
          if (item.product && item.product.id) {
            quantities[item.product.id] = item.quantity;
          }
        });
        setCartQuantities(quantities);
      } else {
        setCartCount(0);
        setCartQuantities({});
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
      setCartQuantities({});
    }
  }, [token]);

  const fetchUserAddress = useCallback(async () => {
    if (!token) {
      setUserAddress('Add Address');
      return;
    }
    
    try {
      const profileResponse = await fetch(`${API_ENDPOINTS.MY_ADDRESS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (profileResponse.ok) {
        const userData = await profileResponse.json();
        let displayAddress = null;
        
        if (Array.isArray(userData)) {
          const defaultAddress = userData.find(addr => addr.is_default) || userData[0];
          if (defaultAddress) {
            const addressParts = [];
            if (defaultAddress.street) addressParts.push(defaultAddress.street);
            if (defaultAddress.city) addressParts.push(defaultAddress.city);
            if (defaultAddress.state) addressParts.push(defaultAddress.state);
            if (defaultAddress.pincode) addressParts.push(defaultAddress.pincode);
            
            if (addressParts.length > 0) {
              displayAddress = addressParts.join(', ');
            }
          }
        }
        
        if (displayAddress) {
          if (displayAddress.length > 30) {
            displayAddress = displayAddress.substring(0, 27) + '...';
          }
          setUserAddress(displayAddress);
        } else {
          setUserAddress('Add Address');
        }
      } else {
        setUserAddress('Add Address');
      }
      
    } catch (error) {
      console.error('Error fetching user address:', error);
      setUserAddress('Add Address');
    }
  }, [token]);

  const addToCart = useCallback(async (productId: string) => {
    // ✅ Check if shop is closed before adding to cart
    if (shopStatus && !shopStatus.is_open) {
      setShowShopClosedModal(true);
      return;
    }

    if (!token) {
      Alert.alert(
        'Login Required',
        'Please login to add items to your cart',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }

    const product = [...products, ...filteredProducts].find(p => p.id === productId);
    if (!product) {
      Alert.alert('Error', 'Product not found');
      return;
    }

    if (product.stock === 0) {
      Alert.alert('Error', 'Product is out of stock');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [productId]: true }));

    try {
      const response = await fetch(API_ENDPOINTS.CART_ADD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          productId: productId,
          quantity: 1 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCartQuantities(prev => ({
          ...prev,
          [productId]: (prev[productId] || 0) + 1
        }));
        
        setCartCount(prev => prev + 1);
        setShowCartNotification(true);
        setTimeout(() => setShowCartNotification(false), 2000);
      } else {
        if (response.status === 401) {
          Alert.alert('Session Expired', 'Please login again');
        } else {
          Alert.alert('Error', data.message || 'Failed to add to cart');
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  }, [token, products, filteredProducts, shopStatus]);

  const updateCartQuantity = useCallback(async (productId: string, newQuantity: number) => {
    // ✅ Check if shop is closed before updating cart
    if (shopStatus && !shopStatus.is_open && newQuantity > (cartQuantities[productId] || 0)) {
      setShowShopClosedModal(true);
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Please login to manage cart');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [productId]: true }));

    try {
      const cartResponse = await fetch(API_ENDPOINTS.CART, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!cartResponse.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      const cartData = await cartResponse.json();
      const cartItem = cartData.items?.find((item: any) => item.product?.id === productId);
      
      if (!cartItem) {
        console.log('Cart item not found for product:', productId);
        setAddingToCart(prev => ({ ...prev, [productId]: false }));
        return;
      }

      if (newQuantity <= 0) {
        const response = await fetch(`${API_ENDPOINTS.CART_REMOVE}?item_id=${cartItem._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setCartQuantities(prev => {
            const updated = { ...prev };
            delete updated[productId];
            return updated;
          });
          setCartCount(prev => Math.max(0, prev - (cartQuantities[productId] || 0)));
        } else {
          const errorData = await response.json();
          Alert.alert('Error', errorData.message || 'Failed to remove item');
        }
      } else {
        const response = await fetch(API_ENDPOINTS.CART_UPDATE, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ itemId: cartItem._id, quantity: newQuantity }),
        });

        if (response.ok) {
          const oldQuantity = cartQuantities[productId] || 0;
          const quantityDiff = newQuantity - oldQuantity;
          
          setCartQuantities(prev => ({
            ...prev,
            [productId]: newQuantity
          }));
          
          setCartCount(prev => prev + quantityDiff);
        } else {
          const errorData = await response.json();
          Alert.alert('Error', errorData.message || 'Failed to update quantity');
        }
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      Alert.alert('Error', 'Failed to update cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  }, [token, cartQuantities, shopStatus]);

  // ✅ NEW: Fetch shop status on mount
  useEffect(() => {
    fetchShopStatus();
  }, [fetchShopStatus]);

  useEffect(() => {
    if (!initialDataFetched.current && !isFetching.current) {
      console.log('🚀 Initial data fetch triggered');
      fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    if (!authLoading) {
      console.log('🔐 Auth state changed, fetching user data');
      fetchCartCount();
      fetchUserAddress();
    }
  }, [authLoading, fetchCartCount, fetchUserAddress]);

  useFocusEffect(
    useCallback(() => {
      if (token && !authLoading) {
        fetchCartCount();
        fetchShopStatus(); // ✅ Check shop status when screen focused
      }
    }, [token, authLoading, fetchCartCount, fetchShopStatus])
  );

  useEffect(() => {
    if (!initialDataFetched.current) return;
    
    const handler = setTimeout(() => {
      if (searchQuery.length === 0 || searchQuery.length > 2) {
        console.log('🔎 Search/filter triggered:', { searchQuery, selectedCategory });
        fetchFilteredProducts(searchQuery, selectedCategory);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategory, fetchFilteredProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    initialDataFetched.current = false;
    setShopStatusChecked(false); // Reset so modal can show again
    await Promise.all([
      fetchData(),
      fetchCartCount(),
      fetchUserAddress(),
      fetchShopStatus(), // ✅ Refresh shop status
    ]);
    setRefreshing(false);
  }, [fetchData, fetchCartCount, fetchUserAddress, fetchShopStatus]);

  const retryConnection = useCallback(() => {
    initialDataFetched.current = false;
    fetchData();
  }, [fetchData]);

  const handleCategoryPress = useCallback((categoryId: string | null) => {
    console.log('📂 Category pressed:', categoryId);
    setSelectedCategory(categoryId);
  }, []);

  const handleRequestSubmitted = useCallback(() => {
    Alert.alert('Thank you!', 'Your product request has been submitted.');
  }, []);

  // ✅ NEW: Handle modal close
  const handleCloseShopModal = () => {
    setShowShopClosedModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <AnimatedLogo />
        </View>
      </SafeAreaView>
    );
  }

  const isGridMode = searchQuery.trim() || selectedCategory;

  return (
    <SafeAreaView style={styles.container}>
      <TopBar 
        userAddress={userAddress}
        cartCount={cartCount}
        authLoading={authLoading}
        token={token}
      />
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <CategoryFilterRow 
        categories={categories}
        selectedCategory={selectedCategory}
        handleCategoryPress={handleCategoryPress}
        requestFormRef={requestFormRef}
      />
      
      {isGridMode ? (
        <FlatList
          key="products-grid-view"
          data={filteredProducts}
          renderItem={({ item, index }) => (
            <ProductTile 
              item={item}
              index={index}
              cartQuantities={cartQuantities}
              addingToCart={addingToCart}
              addToCart={addToCart}
              updateCartQuantity={updateCartQuantity}
            />
          )}
          keyExtractor={(item, index) => `grid-product-${item.id || index}-${index}`}
          numColumns={2}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Text style={{ color: '#888', fontSize: 16 }}>No products found.</Text>
            </View>
          }
          ListFooterComponent={() => (
            <RequestProductSectionWrapper 
              requestFormRef={requestFormRef}
              handleRequestSubmitted={handleRequestSubmitted}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 180 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          removeClippedSubviews={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={10}
        />
      ) : (
        <FlatList
          key="categories-browse-view"
          data={categories}
          renderItem={({ item, index }) => (
            <CategorySection 
              category={item}
              index={index}
              products={products}
              cartQuantities={cartQuantities}
              addingToCart={addingToCart}
              addToCart={addToCart}
              updateCartQuantity={updateCartQuantity}
              handleCategoryPress={handleCategoryPress}
            />
          )}
          keyExtractor={(item, index) => `category-section-${item.id}-${index}`}
          ListFooterComponent={() => (
            <RequestProductSectionWrapper 
              requestFormRef={requestFormRef}
              handleRequestSubmitted={handleRequestSubmitted}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Text style={{ color: '#888', fontSize: 16 }}>No categories found.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retryConnection}>
                <Text style={styles.retryButtonText}>Retry Loading</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 180 }}
          removeClippedSubviews={false}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={8}
        />
      )}
      
      <CartNotification showCartNotification={showCartNotification} />
      
      {/* ✅ NEW: Shop Closed Modal */}
      <ShopClosedModal
        visible={showShopClosedModal}
        onClose={handleCloseShopModal}
        reopenTime={shopStatus?.reopen_time || null}
        reason={shopStatus?.reason || null}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;