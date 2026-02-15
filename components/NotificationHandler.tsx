import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { setupNotificationListeners } from '../services/notificationService';
import * as Notifications from 'expo-notifications';

/**
 * Component to handle notification listeners
 * Must be inside NotificationProvider
 */
export default function NotificationHandler() {
    const { showNotification, refreshNotifications } = useNotifications();

    useEffect(() => {
        // Setup notification listeners
        const cleanup = setupNotificationListeners(
            // When notification is received while app is open
            (notification: Notifications.Notification) => {
                try {
                    const content = notification.request?.content;
                    if (!content) {
                        console.warn('Notification has no content');
                        return;
                    }

                    const { title, body, data } = content;

                    // Validate title
                    if (!title || typeof title !== 'string') {
                        console.warn('Invalid notification title');
                        return;
                    }

                    // Validate and sanitize body
                    const sanitizedBody = (body && typeof body === 'string') ? body : '';

                    // Validate data
                    const sanitizedData = (data && typeof data === 'object') ? data : {};

                    showNotification({
                        id: Date.now(), // Temporary ID for display
                        title: title.slice(0, 100), // Limit title length
                        body: sanitizedBody.slice(0, 500), // Limit body length
                        data: sanitizedData,
                        read: false,
                        created_at: new Date().toISOString(),
                    });

                    // Refresh to get the actual notification from backend
                    setTimeout(() => {
                        refreshNotifications();
                    }, 1000);
                } catch (error) {
                    console.error('Error handling notification:', error);
                    // Continue app execution, don't crash
                }
            },
            // When user taps on notification
            (response: Notifications.NotificationResponse) => {
                const { data } = response.notification.request.content;
                console.log('Notification tapped with data:', data);
                // Handle navigation based on data.screen if needed
            }
        );

        return cleanup;
    }, [showNotification, refreshNotifications]);

    return null;
}
