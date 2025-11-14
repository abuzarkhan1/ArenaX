import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import { authAPI } from './api';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export async function requestNotificationPermissions() {
  try {
    console.log('🔔 Step 1: Requesting notification permissions...');
    
    if (!Device.isDevice) {
      console.log('⚠️ Must use physical device for push notifications');
      Alert.alert(
        'Device Required',
        'Push notifications only work on physical devices, not simulators/emulators.'
      );
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00E5FF',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('Requesting permission...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Permission result:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push notification permission!');
      Alert.alert(
        'Permission Denied',
        'Please enable notifications in your device settings to receive tournament updates.'
      );
      return false;
    }

    console.log('✅ Notification permission granted');
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    Alert.alert('Error', 'Failed to request notification permissions');
    return false;
  }
}

/**
 * Get the Expo push token for this device
 * @returns {Promise<string|null>} - The push token or null if failed
 */
export async function getExpoPushToken() {
  try {
    console.log('📱 Step 2: Getting Expo push token...');
    
    if (!Device.isDevice) {
      console.log('⚠️ Must use physical device for push notifications');
      return null;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                     Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error('❌ Project ID not found');
      Alert.alert('Config Error', 'Project ID not found in app configuration');
      return null;
    }

    console.log('Using project ID:', projectId);

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
      ...(Platform.OS === 'android' && {
        applicationId: 'com.anonymous.mobile',
      }),
    });

    const token = tokenData.data;
    console.log('✅ Expo Push Token obtained:', token);
    console.log('Token length:', token?.length);

    if (!token) {
      console.error('❌ No token received');
      return null;
    }

    return token;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    let errorMessage = 'Failed to get push token';
    if (error.message?.includes('Firebase')) {
      errorMessage = 'Firebase configuration error. Please rebuild the app after setting up FCM.';
    } else if (error.message?.includes('project')) {
      errorMessage = 'Project configuration error. Check app.json settings.';
    }
    
    Alert.alert('Token Error', errorMessage);
    return null;
  }
}

/**
 * Register the push token with the backend
 * @param {string} pushToken - The Expo push token
 * @returns {Promise<boolean>} - Whether registration was successful
 */
export async function registerPushTokenWithBackend(pushToken) {
  try {
    if (!pushToken) {
      console.log('⚠️ No push token to register');
      return false;
    }

    console.log('📤 Step 3: Registering push token with backend...');
    console.log('Token to register:', pushToken);
    console.log('Token length:', pushToken.length);
    
    const response = await authAPI.registerPushToken(pushToken);
    
    console.log('Backend response:', {
      status: response.status,
      success: response.data?.success,
      message: response.data?.message,
      pushToken: response.data?.pushToken
    });
    
    if (response.data.success) {
      console.log('✅ Push token registered successfully with backend');
      console.log('Registered token:', response.data.pushToken);
      
      if (response.data.pushToken === pushToken) {
        console.log('✅ Token verified - matches sent token');
        return true;
      } else {
        console.warn('⚠️ Token mismatch in response');
        console.log('Sent:', pushToken);
        console.log('Got back:', response.data.pushToken);
        return false;
      }
    }
    
    console.log('⚠️ Backend returned success: false');
    console.log('Response:', response.data);
    return false;
  } catch (error) {
    console.error('❌ Error registering push token with backend:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method
    });
    
    Alert.alert(
      'Registration Failed',
      `Failed to register push token: ${error.response?.data?.message || error.message}`
    );
    return false;
  }
}

/**
 * Complete setup process for push notifications
 * This should be called after user logs in
 * @returns {Promise<string|null>} - The push token or null if failed
 */
export async function setupPushNotifications() {
  try {
    console.log('\n🔔 ========================================');
    console.log('🔔 Starting push notification setup...');
    console.log('🔔 ========================================\n');
    
    console.log('--- STEP 1: PERMISSIONS ---');
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('❌ Setup failed at Step 1: No permission');
      return null;
    }
    console.log('✅ Step 1 Complete: Permission granted\n');

    console.log('--- STEP 2: GET TOKEN ---');
    const pushToken = await getExpoPushToken();
    if (!pushToken) {
      console.log('❌ Setup failed at Step 2: No token');
      return null;
    }
    console.log('✅ Step 2 Complete: Token obtained\n');

    console.log('--- STEP 3: REGISTER WITH BACKEND ---');
    const registered = await registerPushTokenWithBackend(pushToken);
    if (!registered) {
      console.log('❌ Setup failed at Step 3: Registration failed');
      return null;
    }
    console.log('✅ Step 3 Complete: Registered with backend\n');

    console.log('🎉 ========================================');
    console.log('🎉 Push notifications setup complete!');
    console.log('🎉 ========================================\n');
    return pushToken;
  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ Error setting up push notifications');
    console.error('❌ ========================================');
    console.error(error);
    console.error('========================================\n');
    return null;
  }
}

/**
 * ✅ NEW: Handle notification link (web URL or deep link)
 * @param {string} link - The link from notification
 * @param {Object} navigation - React Navigation object
 * @param {Object} data - Additional notification data
 */
export async function handleNotificationLink(link, navigation, data = {}) {
  try {
    console.log('🔗 Handling notification link:', link);
    
    if (!link) {
      console.log('No link provided');
      return;
    }

    // Handle deep links (app://)
    if (link.startsWith('app://')) {
      handleDeepLink(link, navigation, data);
    }
    // Handle web URLs
    else if (link.startsWith('http://') || link.startsWith('https://')) {
      const supported = await Linking.canOpenURL(link);
      
      if (supported) {
        console.log('Opening web URL:', link);
        await Linking.openURL(link);
      } else {
        console.error('Cannot open URL:', link);
        Alert.alert('Error', 'Cannot open this link');
      }
    }
    // Unknown format
    else {
      console.warn('Unknown link format:', link);
      Alert.alert('Invalid Link', 'The notification link format is not supported');
    }
  } catch (error) {
    console.error('Error handling notification link:', error);
    Alert.alert('Error', 'Failed to open link');
  }
}

/**
 * ✅ NEW: Handle deep links within the app
 * @param {string} link - Deep link (app://screen/id)
 * @param {Object} navigation - React Navigation object
 * @param {Object} data - Additional notification data
 */
export function handleDeepLink(link, navigation, data = {}) {
  try {
    // Remove app:// prefix
    const path = link.replace('app://', '');
    console.log('Deep link path:', path);
    
    // Parse the path
    const parts = path.split('/');
    const screen = parts[0];
    const id = parts[1];
    
    console.log('Navigating to screen:', screen, 'with id:', id);
    
    // Navigate based on the screen
    switch (screen.toLowerCase()) {
      case 'tournament':
        if (id) {
          navigation.navigate('TournamentDetail', { tournamentId: id });
        } else {
          navigation.navigate('Main', { screen: 'Home' });
        }
        break;
        
      case 'profile':
        navigation.navigate('Main', { screen: 'Profile' });
        break;
        
      case 'wallet':
        navigation.navigate('Main', { screen: 'Wallet' });
        break;
        
      case 'home':
        navigation.navigate('Main', { screen: 'Home' });
        break;
        
      case 'chat':
        if (id) {
          navigation.navigate('Chat', { tournamentId: id });
        }
        break;
        
      default:
        console.log('Unknown deep link screen:', screen);
        navigation.navigate('Main', { screen: 'Home' });
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
    Alert.alert('Navigation Error', 'Failed to navigate to the requested screen');
  }
}

/**
 * Setup notification listeners
 * @param {Function} onNotificationReceived - Callback when notification is received (app in foreground)
 * @param {Function} onNotificationTapped - Callback when notification is tapped
 * @param {Object} navigation - React Navigation object
 * @returns {Object} - Object with cleanup functions
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationTapped, navigation) {
  // Listener for when a notification is received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📬 Notification received in foreground:', notification);
    console.log('Notification data:', notification.request.content.data);
    
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener for when user taps on a notification
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Notification tapped:', response);
    const data = response.notification.request.content.data;
    console.log('Notification data:', data);
    
    // Priority 1: Handle link if present
    if (data?.link) {
      console.log('Found link in notification:', data.link);
      handleNotificationLink(data.link, navigation, data);
    }
    // Priority 2: Custom callback
    else if (onNotificationTapped) {
      onNotificationTapped(response);
    }
    // Priority 3: Fallback to tournament navigation
    else if (data?.type === 'tournament' && data?.relatedTournament) {
      console.log('Fallback: Navigating to tournament');
      navigation.navigate('TournamentDetail', { tournamentId: data.relatedTournament });
    }
  });

  // Return cleanup function
  return {
    remove: () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    },
  };
}

/**
 * Show a local notification (for testing)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data (can include link)
 */
export async function showLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Set notification badge count (iOS)
 * @param {number} count - Badge count
 */
export async function setBadgeCount(count) {
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(count);
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

export default {
  requestNotificationPermissions,
  getExpoPushToken,
  registerPushTokenWithBackend,
  setupPushNotifications,
  setupNotificationListeners,
  handleNotificationLink,
  handleDeepLink,
  showLocalNotification,
  setBadgeCount,
  clearAllNotifications,
};