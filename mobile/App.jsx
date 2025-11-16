// App.tsx - Fixed with all screens registered

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import ResetPasswordScreen from './src/screens/Auth/ResetPassword';
import HomeScreen from './src/screens/Home/HomeScreen';
import SubCategoryScreen from './src/screens/Home/SubCategoryScreen'; // Import SubCategory
import TournamentListScreen from './src/screens/Home/TournamentListScreen'; // Import TournamentList
import ClashSquadScreen from './src/screens/Home/ClashSquadScreen'; // Import ClashSquad
import TournamentDetailScreen from './src/screens/Tournaments/TournamentDetailScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import EditProfileScreen from './src/screens/Profile/EditProfileScreen';
import NotificationsScreen from './src/screens/Notifications/NotificationsScreen';
import WalletScreen from './src/screens/Wallet/WalletScreen';
import ChatScreen from './src/screens/Chat/ChatScreen';
import { View, Text, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const API_URL = Constants.expoConfig?.extra?.apiUrl ||
               process.env.EXPO_PUBLIC_API_URL || 
               'http://192.168.15.3:5000' ||
               'https://overcritically-telaesthetic-hayley.ngrok-free.dev'
               || 'http://10.0.2.2'
               ;

console.log('🌐 API URL:', API_URL);

const getProjectId = () => {
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                   Constants?.easConfig?.projectId;
  
  if (!projectId) {
    console.error('❌ CRITICAL: No project ID found in app.json!');
    console.log('Constants.expoConfig:', Constants.expoConfig);
    console.log('Constants.easConfig:', Constants.easConfig);
  } else {
    console.log('✅ Project ID:', projectId);
  }
  
  return projectId;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 191, 255, 0.2)',
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#00BFFF',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 50,
                height: 40,
              }}
            >
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 50,
                height: 40,
              }}
            >
              <Ionicons
                name={focused ? 'wallet' : 'wallet-outline'}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 50,
                height: 40,
              }}
            >
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const navigationRef = useRef();
  const notificationReceivedListener = useRef();
  const notificationResponseListener = useRef();
  const [expoPushToken, setExpoPushToken] = useState('');

  const handleNotificationLink = async (link, navigationRef, data) => {
    try {
      console.log('🔗 Handling notification link:', link);
      
      if (!link) {
        console.log('No link provided in notification');
        return;
      }

      if (link.startsWith('app://')) {
        handleDeepLink(link, navigationRef, data);
      } 
      else if (link.startsWith('http://') || link.startsWith('https://')) {
        const supported = await Linking.canOpenURL(link);
        
        if (supported) {
          console.log('Opening URL:', link);
          await Linking.openURL(link);
        } else {
          Alert.alert('Error', `Cannot open URL: ${link}`);
        }
      } else {
        console.warn('Unknown link format:', link);
      }
    } catch (error) {
      console.error('Error handling notification link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleDeepLink = (link, navigationRef, data) => {
    try {
      const path = link.replace('app://', '');
      console.log('Deep link path:', path);
      
      const parts = path.split('/');
      const screen = parts[0];
      const id = parts[1];
      
      console.log('Navigating to screen:', screen, 'with id:', id);
      
      switch (screen) {
        case 'tournament':
          if (id) {
            navigationRef.current?.navigate('TournamentDetail', { tournamentId: id });
          } else {
            navigationRef.current?.navigate('Main', { screen: 'Home' });
          }
          break;
          
        case 'profile':
          navigationRef.current?.navigate('Main', { screen: 'Profile' });
          break;
          
        case 'wallet':
          navigationRef.current?.navigate('Main', { screen: 'Wallet' });
          break;
          
        case 'home':
          navigationRef.current?.navigate('Main', { screen: 'Home' });
          break;
          
        default:
          console.log('Unknown deep link screen:', screen);
          navigationRef.current?.navigate('Main', { screen: 'Home' });
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      Alert.alert('Error', 'Failed to navigate');
    }
  };

  const registerForPushNotificationsAsync = async () => {
    console.log('\n🔔 ========================================');
    console.log('🔔 Starting Push Notification Setup');
    console.log('🔔 ========================================\n');

    let token;

    if (Platform.OS === 'android') {
      console.log('📱 Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00E5FF',
        sound: 'default',
      });
      console.log('✅ Android channel configured');
    }

    if (!Device.isDevice) {
      console.log('⚠️ Not a physical device - push notifications won\'t work');
      Alert.alert('Info', 'Push notifications require a physical device');
      return null;
    }

    try {
      console.log('\n--- STEP 1: PERMISSIONS ---');
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
        console.log('❌ Notification permission not granted');
        Alert.alert('Permission Required', 'Please enable notifications to receive updates!');
        return null;
      }
      console.log('✅ Permission granted\n');
      
      console.log('--- STEP 2: GET PROJECT ID ---');
      const projectId = getProjectId();
      
      if (!projectId) {
        console.error('❌ CRITICAL: Cannot proceed without project ID');
        Alert.alert(
          'Configuration Error',
          'Project ID not found in app.json. Please check your configuration.'
        );
        return null;
      }
      console.log('✅ Project ID obtained\n');
      
      console.log('--- STEP 3: GET PUSH TOKEN ---');
      console.log('Using project ID:', projectId);
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
        ...(Platform.OS === 'android' && {
          applicationId: 'com.anonymous.mobile',
        }),
      });
      
      token = tokenData.data;
      console.log('✅ Push Token Generated:', token);
      console.log('Token length:', token?.length);
      
      console.log('\n--- STEP 4: SAVE TO BACKEND ---');
      if (token) {
        await savePushTokenToBackend(token);
      }
      
      console.log('\n🎉 ========================================');
      console.log('🎉 Push Notification Setup Complete!');
      console.log('🎉 ========================================\n');
      
    } catch (error) {
      console.error('\n❌ ========================================');
      console.error('❌ Error getting push token');
      console.error('❌ ========================================');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('========================================\n');
      
      let errorMessage = 'Failed to get push token';
      if (error.message?.includes('Firebase')) {
        errorMessage = 'Firebase configuration error. Please rebuild the app after setting up FCM.';
      } else if (error.message?.includes('project')) {
        errorMessage = 'Project configuration error. Check app.json settings.';
      }
      
      Alert.alert('Error', errorMessage);
    }

    return token;
  };

  const savePushTokenToBackend = async (pushToken) => {
    try {
      console.log('💾 Saving push token to backend...');
      
      const jwtToken = await AsyncStorage.getItem('userToken');
      
      if (!jwtToken) {
        console.error('❌ No JWT token found in AsyncStorage');
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }
      
      console.log('API URL:', `${API_URL}/api/auth/push-token`);
      console.log('JWT Token exists:', !!jwtToken);
      console.log('Push Token:', pushToken);
      console.log('Push Token length:', pushToken.length);
      console.log('Platform:', Platform.OS);
      
      const response = await fetch(`${API_URL}/api/auth/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          pushToken: pushToken,
          platform: Platform.OS,
        }),
      });

      const responseText = await response.text();
      console.log('Backend response status:', response.status);
      console.log('Backend response:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        console.log('✅ Push token saved to backend:', result);
      } else {
        console.error('❌ Failed to save push token:', response.status, responseText);
        Alert.alert('Warning', 'Could not enable notifications. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Error saving push token to backend:', error);
      console.error('Error details:', error.message);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('👤 User logged in, registering for push notifications...');
      
      const timeoutId = setTimeout(() => {
        registerForPushNotificationsAsync().then(token => {
          if (token) {
            setExpoPushToken(token);
          }
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  useEffect(() => {
    notificationReceivedListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📩 Notification received in foreground:', notification);
        console.log('Notification data:', notification.request.content.data);
        
        const data = notification.request.content.data;
        const link = data?.link;
        
        if (link) {
          Alert.alert(
            notification.request.content.title || 'New Notification',
            notification.request.content.body || '',
            [
              { text: 'Dismiss', style: 'cancel' },
              { 
                text: 'Open', 
                onPress: () => handleNotificationLink(link, navigationRef, data)
              }
            ]
          );
        } else {
          Alert.alert(
            notification.request.content.title || 'New Notification',
            notification.request.content.body || ''
          );
        }
      }
    );

    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        const data = response.notification.request.content.data;
        console.log('Notification data:', data);
        
        if (data?.link) {
          console.log('Found link in notification:', data.link);
          handleNotificationLink(data.link, navigationRef, data);
        }
        else if (data?.type === 'tournament' && data?.relatedTournament) {
          console.log('No link found, using fallback tournament navigation');
          navigationRef.current?.navigate('TournamentDetail', {
            tournamentId: data.relatedTournament,
          });
        }
        else {
          console.log('No link or tournament, navigating to home');
          navigationRef.current?.navigate('Main', { screen: 'Home' });
        }
      }
    );

    return () => {
      if (notificationReceivedListener.current) {
        notificationReceivedListener.current.remove();
      }
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#121212',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#00BFFF" />
        <Text
          style={{
            color: '#FFFFFF',
            marginTop: 20,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            {/* ✅ ADD ALL MISSING SCREENS HERE */}
            <Stack.Screen name="SubCategory" component={SubCategoryScreen} />
            <Stack.Screen name="TournamentList" component={TournamentListScreen} />
            <Stack.Screen name="ClashSquad" component={ClashSquadScreen} />
            <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="light" />
    </AuthProvider>
  );
}