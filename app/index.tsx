import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAlbum } from '../lib/albumContext';
import type { StickerCategory } from '../lib/types';

const categoryKeyMap: Record<StickerCategory, 'categorySpecial' | 'categoryStadiums' | 'categoryLegends' | 'categoryTeams'> = {
  special: 'categorySpecial',
  stadiums: 'categoryStadiums',
  legends: 'categoryLegends',
  teams: 'categoryTeams',
};

export default function HomePage() {
  const { language, setLanguage, totals, categories, getLabel } = useAlbum();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{getLabel('dashboardTitle')}</Text>
        <Text style={styles.subtitle}>{getLabel('dashboardSubtitle')}</Text>
      </View>

      <View style={styles.languageRow}>
        <Text style={styles.languageLabel}>{getLabel('languageLabel')}</Text>
        <View style={styles.languageButtons}>
          <Pressable
            onPress={() => setLanguage('en')}
            style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
          >
            <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>
              {getLabel('english')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage('es')}
            style={[styles.languageButton, language === 'es' && styles.languageButtonActive]}
          >
            <Text style={[styles.languageButtonText, language === 'es' && styles.languageButtonTextActive]}>
              {getLabel('spanish')}
            </Text>
          </Pressable>
        </View>
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
    marginBottom: 12,
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
  languageRow: {
    marginBottom: 12,
  },
  languageLabel: {
    color: '#44536b',
    marginBottom: 8,
    fontWeight: '600',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e1ef',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  languageButtonActive: {
    backgroundColor: '#c1121f',
    borderColor: '#c1121f',
  },
  languageButtonText: {
    color: '#214065',
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#ffffff',
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
    backgroundColor: '#c1121f',
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
