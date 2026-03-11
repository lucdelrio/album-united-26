import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { getGoogleMobileAdsModule, isGoogleMobileAdsAvailable } from '../lib/ads';
import { AlbumProvider, useAlbum } from '../lib/albumContext';

function AppTabs() {
  const { getLabel } = useAlbum();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#c1121f',
        tabBarInactiveTintColor: '#6f7f9d',
        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: '#f5f8ff',
          borderTopColor: '#d4deef',
          borderTopWidth: 1,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: 'speedometer-outline',
            album: 'albums-outline',
            repeated: 'git-compare-outline',
          };
          const iconName = iconMap[route.name] ?? 'ellipse-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: getLabel('dashboardTab') }} />
      <Tabs.Screen name="album" options={{ title: getLabel('albumTab') }} />
      <Tabs.Screen name="repeated" options={{ title: getLabel('repeatedTab') }} />
    </Tabs>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initAds = async () => {
      if (!isGoogleMobileAdsAvailable()) {
        return;
      }

      if (Platform.OS === 'ios') {
        const permission = await getTrackingPermissionsAsync();
        if (permission.status === 'undetermined') {
          await requestTrackingPermissionsAsync();
        }
      }

      const adsModule = getGoogleMobileAdsModule();
      const mobileAdsFactory = adsModule?.default;
      if (!mobileAdsFactory) {
        return;
      }
      await mobileAdsFactory().initialize();
    };

    void initAds();
  }, []);

  return (
    <AlbumProvider>
      <AppTabs />
    </AlbumProvider>
  );
}
