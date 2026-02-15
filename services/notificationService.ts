import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const PUSH_TOKEN_KEY = '@rhm_push_token';

/**
 * Request notification permissions and get Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
    try {
        // Only works on physical devices
        if (!Device.isDevice) {
            console.log('Push notifications only work on physical devices');
            return null;
        }

        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permissions if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permissions not granted');
            return null;
        }

        // Get Expo push token (projectId auto-detected from app.json)
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        console.log('Expo Push Token:', token);

        // Save token locally
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

        // Register token with backend
        await registerTokenWithBackend(token);

        return token;
    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
}

/**
 * Register push token with backend
 */
async function registerTokenWithBackend(token: string): Promise<void> {
    try {
        const deviceType = Platform.OS;
        await api.post('/notifications/register', {
            expo_push_token: token,
            device_type: deviceType,
        });
        console.log('Push token registered with backend');
    } catch (error) {
        console.error('Error registering token with backend:', error);
    }
}

/**
 * Unregister push token (disable notifications)
 */
export async function unregisterPushToken(): Promise<void> {
    try {
        const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
        if (!token) return;

        await api.post('/notifications/unregister', {
            expo_push_token: token,
        });

        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
        console.log('Push token unregistered');
    } catch (error) {
        console.error('Error unregistering push token:', error);
    }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationTapped: (response: Notifications.NotificationResponse) => void
) {
    // Listen for notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
        (notification) => {
            console.log('Notification received:', notification);
            onNotificationReceived(notification);
        }
    );

    // Listen for user tapping on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            console.log('Notification tapped:', response);
            onNotificationTapped(response);
        }
    );

    // Return cleanup function
    return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
    };
}

/**
 * Fetch unread in-app notifications from backend
 */
export async function fetchInAppNotifications(): Promise<any[]> {
    try {
        const response = await api.get('/notifications/in-app');
        return response.data?.notifications || [];
    } catch (error) {
        console.error('Error fetching in-app notifications:', error);
        return [];
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<void> {
    try {
        await api.post('/notifications/in-app/mark-read', {
            notification_id: notificationId,
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
    try {
        await api.post('/notifications/in-app/mark-read', {
            mark_all: true,
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}
