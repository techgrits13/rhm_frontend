import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { initAds } from './services/adsInit';
import { showAppOpenAdIfEligible } from './services/appOpenManager';
import { pushNotificationService } from './services/pushNotificationService';
import { ThemeProvider } from './context/ThemeContext';
import Constants from 'expo-constants';
import ErrorBoundary from './components/ErrorBoundary';

// Import screens
import HomeScreen from './screens/HomeScreen';
import RadioScreen from './screens/RadioScreen';
import BibleScreen from './screens/BibleScreen';
import NotepadScreen from './screens/NotepadScreen';
import AboutScreen from './screens/AboutScreen';
import RecordingsScreen from './screens/RecordingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Radio Stack Navigator (includes Radio and Recordings)
function RadioStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RadioMain"
        component={RadioScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Recordings"
        component={RecordingsScreen}
        options={{
          title: 'My Recordings',
          headerStyle: { backgroundColor: '#6200ee' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const disableAds = !!(Constants?.expoConfig?.extra as any)?.disableAds;
  const navigationRef = useRef<any>(null);

  // Initialize app services and push notifications
  useEffect(() => {
    (async () => {
      try {
        // Initialize ads
        if (!disableAds) {
          await initAds();
          await showAppOpenAdIfEligible();
        }

        // Initialize push notifications
        await pushNotificationService.initialize();
        console.log('✅ Push notifications initialized');
      } catch (error) {
        console.error('Initialization error:', error);
      }
    })();

    // Add notification listeners
    const notificationListener = pushNotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification);
      }
    );

    const responseListener = pushNotificationService.addNotificationResponseListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        const data = response.notification.request.content.data;

        // Handle deep linking based on notification data
        if (data?.screen === 'Home' && navigationRef.current) {
          navigationRef.current.navigate('Home');
        }
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Handle app state changes for ads
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active' && !disableAds) {
        showAppOpenAdIfEligible();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="auto" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap;

                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Radio') {
                  iconName = focused ? 'radio' : 'radio-outline';
                } else if (route.name === 'Bible') {
                  iconName = focused ? 'book' : 'book-outline';
                } else if (route.name === 'Notepad') {
                  iconName = focused ? 'create' : 'create-outline';
                } else if (route.name === 'About') {
                  iconName = focused ? 'information-circle' : 'information-circle-outline';
                } else {
                  iconName = 'help-circle-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#6200ee',
              tabBarInactiveTintColor: 'gray',
              headerStyle: {
                backgroundColor: '#6200ee',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            })}
          >
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Home' }}
            />
            <Tab.Screen
              name="Radio"
              component={RadioStack}
              options={{ title: 'Radio', headerShown: false }}
            />
            <Tab.Screen
              name="Bible"
              component={BibleScreen}
              options={{ title: 'Bible' }}
            />
            <Tab.Screen
              name="Notepad"
              component={NotepadScreen}
              options={{ title: 'Notepad' }}
            />
            <Tab.Screen
              name="About"
              component={AboutScreen}
              options={{ title: 'About' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
