import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AD_UNITS } from '../services/ads';
import Constants from 'expo-constants';

interface AdBannerProps {
  style?: any;
}

export default function AdBanner({ style }: AdBannerProps) {
  const [adFailed, setAdFailed] = useState(false);
  const disableAds = !!(Constants?.expoConfig?.extra as any)?.disableAds;

  if (disableAds || !AD_UNITS.banner || adFailed) {
    // Return a placeholder view to maintain layout stability
    return <View style={[styles.container, style, { backgroundColor: 'transparent' }]} />;
  }

  let BannerAd: any;
  let BannerAdSize: any;
  try {
    // Dynamically require to avoid crashing in Expo Go or if module is missing
    const mod = require('react-native-google-mobile-ads');
    BannerAd = mod.BannerAd;
    BannerAdSize = mod.BannerAdSize;
  } catch (e) {
    return <View style={[styles.container, style, { backgroundColor: 'transparent' }]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdFailedToLoad={(e: any) => {
          console.warn('Banner ad failed to load:', e?.message);
          setAdFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    height: 80, // Fixed height to prevent layout shifts
    minHeight: 80, // Ensure minimum space for ad banner
  },
});
