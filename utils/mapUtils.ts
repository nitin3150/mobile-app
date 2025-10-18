import { Platform, Linking, Alert } from 'react-native';

export const openMapsWithCoordinates = (
  latitude: number,
  longitude: number,
  label: string = 'Delivery Location'
) => {
  // Create platform-specific URL
  const scheme = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(label)}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(label)})`,
  });
  
  const url = scheme || `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        return Linking.openURL(googleMapsUrl);
      }
    })
    .catch((err) => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps application');
    });
};

export const openMapsWithAddress = (address: {
  latitude?: number;
  longitude?: number;
  street?: string;
  city?: string;
  label?: string;
}) => {
  if (!address.latitude || !address.longitude) {
    Alert.alert('No Location', 'GPS coordinates not available for this address');
    return;
  }

  const label = address.label || address.street || 'Delivery Location';
  openMapsWithCoordinates(address.latitude, address.longitude, label);
};