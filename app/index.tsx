import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAlbum } from '../lib/albumContext';
import type { StickerCategory } from '../lib/types';

const categoryKeyMap: Record<StickerCategory, 'categorySpecial' | 'categoryStadiums' | 'categoryLegends' | 'categoryTeams'> = {
  special: 'categorySpecial',
  stadiums: 'categoryStadiums',
  legends: 'categoryLegends',
  teams: 'categoryTeams',
};

export default function HomePage() {
  const { totals, categories, getLabel } = useAlbum();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Image
          source={require('../assets/logo-album-united-26.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{getLabel('dashboardTitle')}</Text>
        <Text style={styles.subtitle}>{getLabel('dashboardSubtitle')}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{getLabel('totalStickers')}</Text>
          <Text style={styles.statValue}>{totals.total}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{getLabel('ownedStickers')}</Text>
          <Text style={styles.statValue}>{totals.owned}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{getLabel('missingStickers')}</Text>
          <Text style={styles.statValue}>{totals.missing}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{getLabel('repeatedStickers')}</Text>
          <Text style={styles.statValue}>{totals.repeated}</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>{getLabel('completedPercent')}</Text>
        <Text style={styles.progressValue}>{totals.completedPercentage}%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${totals.completedPercentage}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          {getLabel('completionHint', { percent: totals.completedPercentage })}
        </Text>
      </View>

      <View style={styles.categoryCard}>
        <Text style={styles.categoryTitle}>{getLabel('summaryByCategory')}</Text>
        {categories.map((item) => (
          <View key={item.category} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{getLabel(categoryKeyMap[item.category])}</Text>
            <Text style={styles.categoryCount}>{item.owned}/{item.total}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7ff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 180,
    height: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0b1d51',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#5c6885',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4deef',
    padding: 12,
  },
  statLabel: {
    fontSize: 13,
    color: '#44536b',
  },
  statValue: {
    marginTop: 4,
    color: '#0b1d51',
    fontSize: 26,
    fontWeight: '700',
  },
  progressCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4deef',
    padding: 12,
  },
  progressTitle: {
    color: '#44536b',
    fontSize: 13,
  },
  progressValue: {
    marginTop: 2,
    fontSize: 32,
    fontWeight: '700',
    color: '#0b1d51',
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#d7e1ef',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a',
  },
  progressHint: {
    marginTop: 10,
    color: '#44536b',
    fontSize: 15,
  },
  categoryCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4deef',
    padding: 12,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b1d51',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    color: '#44536b',
  },
  categoryCount: {
    color: '#0b1d51',
    fontWeight: '600',
  },
});
