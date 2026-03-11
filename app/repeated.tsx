import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

import { useAlbum } from '../lib/albumContext';

export default function RepeatedScreen() {
  const { repeatedStickers, stickerState, getLabel } = useAlbum();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getLabel('repeatedTitle')}</Text>
      <Text style={styles.subtitle}>{getLabel('repeatedSubtitle')}</Text>

      <FlatList
        data={repeatedStickers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const repeatedCount = stickerState[item.id]?.repeatedCount ?? 0;
          return (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardInfo}>
                  <Text style={styles.code}>{item.code}</Text>
                  <View style={styles.nameRow}>
                    {item.iso2 && (
                      <Image
                        source={{ uri: `https://flagcdn.com/32x24/${item.iso2.toLowerCase()}.png` }}
                        style={styles.flagImage}
                      />
                    )}
                    <Text style={styles.name}>
                      {item.team ? `${item.team} · ${item.title}` : item.title}
                    </Text>
                  </View>
                  <Text style={styles.category}>{item.category.toUpperCase()}</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeValue}>+{repeatedCount}</Text>
                  <Text style={styles.countBadgeLabel}>{getLabel('repeatedLabel')}</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>{getLabel('noRepeated')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#f4f7ff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0b1d51',
  },
  subtitle: {
    marginTop: 6,
    color: '#5c6885',
    marginBottom: 10,
  },
  listContent: {
    gap: 10,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4deef',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: '#ffeef0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#f1b1b8',
    minWidth: 52,
  },
  countBadgeValue: {
    color: '#c1121f',
    fontSize: 20,
    fontWeight: '700',
  },
  countBadgeLabel: {
    color: '#8f1320',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  code: {
    fontSize: 12,
    color: '#c1121f',
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  flagImage: {
    width: 24,
    height: 16,
    borderRadius: 2,
  },
  name: {
    fontSize: 15,
    color: '#0b1d51',
    fontWeight: '600',
    flex: 1,
  },
  category: {
    marginTop: 4,
    fontSize: 12,
    color: '#5c6885',
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#44536b',
  },
});
