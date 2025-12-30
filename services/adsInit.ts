import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';

export async function initAds() {
  const disableAds = !!(Constants?.expoConfig?.extra as any)?.disableAds;
  if (disableAds) {
    return;
  }

  try {
    // Optional: Configure global ad request settings
    await mobileAds().setRequestConfiguration({
      // Set according to your app's audience and policy compliance
      maxAdContentRating: MaxAdContentRating.T,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      testDeviceIdentifiers: [],
    });
  } catch (e) {
    // Swallow configuration errors to avoid crashing the app
    console.warn('Ads request configuration failed:', (e as Error)?.message);
  }

  try {
    // Initialize the SDK
    await mobileAds().initialize();
  } catch (e) {
    console.warn('Ads SDK initialize failed:', (e as Error)?.message);
  }
}
