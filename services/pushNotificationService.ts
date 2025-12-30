import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const PUSH_TOKEN_KEY = '@push_token';
// REPLACE WITH YOUR EAS PROJECT ID
const EAS_PROJECT_ID = '099536d0-ecd3-43dd-bb67-61be5f1976c1';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class PushNotificationService {
    private pushToken: string | null = null;

    // ... initialize method ...

    /**
     * Initialize push notifications
     * Request permissions and register device token
     */
    async initialize(): Promise<string | null> {
        try {
            // Check if running on physical device
            if (!Device.isDevice) {
                console.log('Push notifications only work on physical devices');
                return null;
            }

            // Request permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Push notification permission not granted');
                return null;
            }

            // Get push token
            // NOTE: Ensure your app is configured in EAS for this to work
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: EAS_PROJECT_ID,
            });

            this.pushToken = tokenData.data;
            console.log('Push token:', this.pushToken);

            // Save token locally
            await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.pushToken);

            // Register token with backend
            if (this.pushToken) {
                await this.registerToken(this.pushToken);
            }

            // Configure notification channel for Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#6200ee',
                });
            }

            return this.pushToken;
        } catch (error) {
            console.error('Failed to initialize push notifications:', error);
            return null;
        }
    }

    /**
     * Register push token with backend
     */
    async registerToken(token: string): Promise<void> {
        try {
            await api.post('/notifications/register', {
                expo_push_token: token,
                device_type: Platform.OS,
            });
            console.log('Push token registered with backend');
        } catch (error) {
            console.error('Failed to register push token:', error);
        }
    }

    /**
     * Unregister push token from backend
     */
    async unregisterToken(): Promise<void> {
        try {
            if (!this.pushToken) {
                const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
                this.pushToken = savedToken;
            }

            if (this.pushToken) {
                await api.post('/notifications/unregister', {
                    expo_push_token: this.pushToken,
                });
                await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
                this.pushToken = null;
                console.log('Push token unregistered');
            }
        } catch (error) {
            console.error('Failed to unregister push token:', error);
        }
    }

    /**
     * Get current push token
     */
    async getToken(): Promise<string | null> {
        if (this.pushToken) {
            return this.pushToken;
        }

        const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
        this.pushToken = savedToken;
        return savedToken;
    }

    /**
     * Add listener for notifications received while app is in foreground
     */
    addNotificationReceivedListener(
        callback: (notification: Notifications.Notification) => void
    ): Notifications.Subscription {
        return Notifications.addNotificationReceivedListener(callback);
    }

    /**
     * Add listener for when user taps a notification
     */
    addNotificationResponseListener(
        callback: (response: Notifications.NotificationResponse) => void
    ): Notifications.Subscription {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    /**
     * Schedule a local notification (for testing)
     */
    async scheduleLocalNotification(title: string, body: string, data?: any): Promise<string> {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: null, // Show immediately
        });
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    /**
     * Get notification settings status
     */
    async getPermissionStatus(): Promise<Notifications.NotificationPermissionsStatus> {
        return await Notifications.getPermissionsAsync();
    }

    /**
     * Open device notification settings
     */
    async openSettings(): Promise<void> {
        // This will open the app settings where user can manage notifications
        if (Platform.OS === 'ios') {
            // iOS doesn't have a direct API, user needs to go to Settings app manually
            console.log('Please go to Settings > Notifications > RHM to manage notifications');
        } else {
            // Android can open app settings
            await Notifications.getPermissionsAsync();
        }
    }
}

export const pushNotificationService = new PushNotificationService();
