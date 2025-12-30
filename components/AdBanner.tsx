import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AD_UNITS } from '../services/ads';
import Constants from 'expo-constants';

export default function AdBanner() {
  const disableAds = !!(Constants?.expoConfig?.extra as any)?.disableAds;
  if (disableAds || !AD_UNITS.banner) {
    return null;
  }

  let BannerAd: any;
  let BannerAdSize: any;
  try {
    // Dynamically require to avoid crashing in Expo Go
    const mod = require('react-native-google-mobile-ads');
    BannerAd = mod.BannerAd;
    BannerAdSize = mod.BannerAdSize;
  } catch (e) {
    // If the native module isn't available (e.g., Expo Go), skip rendering
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={(e: any) => {
          console.warn('Banner ad failed to load:', e?.message ?? String(e));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
