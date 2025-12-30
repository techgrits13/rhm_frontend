/**
 * Notification Service Stub
 * 
 * ⚠️ Firebase packages NOT installed - notifications DISABLED for production
 * This prevents app crashes when Firebase modules are not available
 * 
 * To enable notifications later:
 * 1. Install: npm install @react-native-firebase/app @react-native-firebase/messaging
 * 2. Update app.json plugins to include "@react-native-firebase/app"
 * 3. Replace this file with services/notificationService.ts.DISABLED
 * 4. Rebuild: eas build --platform android --profile production
 */

// Stub functions that do nothing but won't crash

export const requestNotificationPermission = async (): Promise<boolean> => {
  console.log('⏸️ Notifications disabled - Firebase not installed');
  return false;
};

export const getFCMToken = async (): Promise<string | null> => {
  console.log('⏸️ Notifications disabled - Firebase not installed');
  return null;
};

export const getStoredFCMToken = async (): Promise<string | null> => {
  console.log('⏸️ Notifications disabled - Firebase not installed');
  return null;
};

export const setupNotificationListeners = () => {
  console.log('⏸️ Notifications disabled - Firebase not installed');
};

export const subscribeToTopic = async (topic: string): Promise<void> => {
  console.log(`⏸️ Notifications disabled - Cannot subscribe to ${topic}`);
};

export const unsubscribeFromTopic = async (topic: string): Promise<void> => {
  console.log(`⏸️ Notifications disabled - Cannot unsubscribe from ${topic}`);
};

export const initializeNotifications = async (): Promise<void> => {
  console.log('⏸️ Notifications disabled - Firebase not installed');
  console.log('ℹ️ To enable notifications, install Firebase packages and rebuild');
};

export const backgroundMessageHandler = null;
