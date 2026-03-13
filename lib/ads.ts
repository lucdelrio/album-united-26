import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

function getEnv(name: string): string | undefined {
  return typeof process !== 'undefined' ? process.env?.[name] : undefined;
}

type MobileAdsModule = {
  default?: () => { initialize: () => Promise<unknown> };
  BannerAd?: unknown;
  BannerAdSize?: Record<string, string>;
};

function hasGoogleMobileAdsNativeModule(): boolean {
  const modules = NativeModules as Record<string, unknown>;
  return Boolean(
    modules.RNGoogleMobileAdsModule ||
      modules.RNGoogleMobileAdsNativeModule ||
      modules.RNAppModule
  );
}

export function getGoogleMobileAdsModule(): MobileAdsModule | null {
  // Expo Go does not include react-native-google-mobile-ads native binaries.
  if (Constants.executionEnvironment === 'storeClient') {
    return null;
  }

  if (!hasGoogleMobileAdsNativeModule()) {
    return null;
  }

  try {
    return require('react-native-google-mobile-ads') as MobileAdsModule;
  } catch {
    return null;
  }
}

export function isGoogleMobileAdsAvailable(): boolean {
  return getGoogleMobileAdsModule() !== null;
}

export function getBannerAdUnitId(): string {
  const iosUnitId = getEnv('EXPO_PUBLIC_ADMOB_BANNER_ID_IOS');
  const androidUnitId = getEnv('EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID');

  if (Platform.OS === 'ios' && iosUnitId) return iosUnitId;
  if (Platform.OS === 'android' && androidUnitId) return androidUnitId;

  return TEST_BANNER_ID;
}
