import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AD_UNITS } from '../services/ads';
import Constants from 'expo-constants';

export default function MusicAdBanner() {
    const [adFailed, setAdFailed] = useState(false);
    const disableAds = !!(Constants?.expoConfig?.extra as any)?.disableAds;

    if (disableAds || !AD_UNITS.banner || adFailed) {
        return null;
    }

    let BannerAd: any;
    let BannerAdSize: any;
    try {
        const mod = require('react-native-google-mobile-ads');
        BannerAd = mod.BannerAd;
        BannerAdSize = mod.BannerAdSize;
    } catch (e) {
        return null;
    }

    return (
        <View style={styles.container}>
            <BannerAd
                unitId={AD_UNITS.banner}
                size={BannerAdSize.INLINE_ADAPTIVE_BANNER} // Use INLINE for music lists/player
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                }}
                onAdFailedToLoad={(e: any) => {
                    console.warn('Music Banner ad failed to load:', e?.message);
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
        marginVertical: 16,
        backgroundColor: 'rgba(0,0,0,0.05)', // Subtle background to mark ad space
        borderRadius: 8,
        overflow: 'hidden',
    },
});
