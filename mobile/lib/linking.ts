import { Linking, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export const openWebCheckout = async (courseId: string) => {
  const url = `${process.env.EXPO_PUBLIC_APP_URL}/checkout?course_id=${courseId}&source=mobile`;
  
  try {
    // Use WebBrowser for a better user experience
    const result = await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#0066FF',
      controlsColor: '#FFFFFF',
      enableBarCollapsing: true,
    });
    
    // Handle the result if needed (e.g., check if user completed checkout)
    console.log('Web browser result:', result);
  } catch (error) {
    console.error('Error opening browser:', error);
    // Fallback to regular linking
    Linking.openURL(url);
  }
};

// Handle deep links coming into the app
export const handleIncomingLinks = () => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    // Handle deep links from web checkout (e.g., after successful purchase)
    if (url.includes('/purchase-success')) {
      // Extract parameters and navigate accordingly
      const urlObj = new URL(url);
      const courseId = urlObj.searchParams.get('course_id');
      
      if (courseId) {
        // Navigate to course or show success message
        Alert.alert('Purchase Successful', 'You can now access your course');
        // You might want to refresh course data here
      }
    }
  });

  return subscription;
};

// Enhanced: Handle incoming deep links with callback pattern
export const setupDeepLinking = (callback: (url: string) => void) => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });

  // Check initial URL if app was opened from a deep link
  Linking.getInitialURL().then((url) => {
    if (url) {
      callback(url);
    }
  });

  return subscription;
};