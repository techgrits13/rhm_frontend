import { Platform } from 'react-native';

export type AdUnitSet = {
  banner: string;
  interstitial: string;
  rewarded: string;
  appOpen: string;
};

// TEST AD UNIT IDs (Use these for development to avoid policy violations)
const TEST_AD_UNITS: Record<'ios' | 'android', AdUnitSet> = {
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    appOpen: 'ca-app-pub-3940256099942544/5662855259',
  },
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    appOpen: 'ca-app-pub-3940256099942544/3419835294',
  },
};

// Real Android Ad Unit IDs (Keep these safe, switch ONLY for production build)
const ANDROID_REAL: Partial<AdUnitSet> = {
  banner: 'ca-app-pub-3848557016813463/5670087742',
  appOpen: 'ca-app-pub-3848557016813463/3103618245',
};

// SAFE: Default to TEST IDs to prevent accidental policy violations during dev
export const AD_UNITS: AdUnitSet = Platform.select<AdUnitSet>({
  ios: TEST_AD_UNITS.ios,
  android: {
    banner: TEST_AD_UNITS.android.banner, // Use TEST ID
    interstitial: TEST_AD_UNITS.android.interstitial,
    rewarded: TEST_AD_UNITS.android.rewarded,
    appOpen: TEST_AD_UNITS.android.appOpen, // Use TEST ID
  },
}) as AdUnitSet;

export const APP_OPEN_AD_UNIT_ID = AD_UNITS.appOpen;
