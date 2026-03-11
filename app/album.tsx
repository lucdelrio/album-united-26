import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAlbum } from '../lib/albumContext';
import type { Sticker, StickerCategory } from '../lib/types';

type FilterType = 'all' | 'owned' | 'missing' | 'repeated';

type StickerSection = {
  title: string;
  data: Sticker[];
  category?: StickerCategory;
  teamIso2?: string;
};

type GridRow = Sticker[];

type GridSection = {
  key: string;
  title: string;
  data: GridRow[];
  count: number;
  teamIso2?: string;
  isTeamSection: boolean;
};

const GRID_COLUMNS = 3;

function chunkStickers(stickers: Sticker[], size: number): GridRow[] {
  const rows: GridRow[] = [];
  for (let index = 0; index < stickers.length; index += size) {
    rows.push(stickers.slice(index, index + size));
  }
  return rows;
}

function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const categoryOrder: StickerCategory[] = ['special', 'stadiums', 'legends', 'teams'];

const categoryKeyMap: Record<
  StickerCategory,
  'categorySpecial' | 'categoryStadiums' | 'categoryLegends' | 'categoryTeams'
> = {
  special: 'categorySpecial',
  stadiums: 'categoryStadiums',
  legends: 'categoryLegends',
  teams: 'categoryTeams',
};

export default function AlbumScreen() {
  const { stickers, stickerState, toggleOwned, incrementRepeated, decrementRepeated, getLabel } = useAlbum();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<StickerCategory | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string | 'all'>('all');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const teamOptions = useMemo(
    () =>
      Array.from(
        new Set(
          stickers
            .filter((sticker) => sticker.category === 'teams' && Boolean(sticker.team))
            .map((sticker) => sticker.team as string)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [stickers]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const categorySearchTokens: Record<StickerCategory, string> = useMemo(
    () => ({
      special: normalizeForSearch(`${getLabel('categorySpecial')} special`),
      stadiums: normalizeForSearch(`${getLabel('categoryStadiums')} stadiums`),
      legends: normalizeForSearch(`${getLabel('categoryLegends')} legends`),
      teams: normalizeForSearch(`${getLabel('categoryTeams')} teams`),
    }),
    [getLabel]
  );

  const filteredStickers = useMemo(() => {
    const normalized = normalizeForSearch(debouncedSearchTerm);

    return stickers.filter((sticker) => {
      if (categoryFilter !== 'all' && sticker.category !== categoryFilter) return false;
      if (teamFilter !== 'all') {
        if (sticker.category !== 'teams') return false;
        if (sticker.team !== teamFilter) return false;
      }

      const status = stickerState[sticker.id] ?? { owned: false, repeatedCount: 0 };
      const matchesFilter =
        filter === 'all' ||
        (filter === 'owned' && status.owned) ||
        (filter === 'missing' && !status.owned) ||
        (filter === 'repeated' && status.repeatedCount > 0);

      if (!matchesFilter) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      const compactCode = sticker.code.replace(/[^a-zA-Z0-9]/g, '');
      const searchable = normalizeForSearch(
        `${sticker.code} ${compactCode} ${sticker.title} ${sticker.team ?? ''} ${sticker.category} ${categorySearchTokens[sticker.category]}`
      );
      return searchable.includes(normalized);
    });
  }, [
    categoryFilter,
    categorySearchTokens,
    debouncedSearchTerm,
    filter,
    stickerState,
    stickers,
    teamFilter,
  ]);

  const groupedSections = useMemo<StickerSection[]>(() => {
    const grouped = new Map<StickerCategory, Sticker[]>();

    for (const category of categoryOrder) {
      grouped.set(category, []);
    }

    for (const sticker of filteredStickers) {
      grouped.get(sticker.category)?.push(sticker);
    }

    return categoryOrder
      .map((category) => {
        const data = grouped.get(category) ?? [];
        return {
          title: getLabel(categoryKeyMap[category]),
          data,
          category,
        };
      })
      .filter((section) => section.data.length > 0);
  }, [filteredStickers, getLabel]);

  const teamGroupedSections = useMemo<StickerSection[]>(() => {
    const grouped = new Map<string, Sticker[]>();
    const teamIso2ByName = new Map<string, string>();

    for (const sticker of filteredStickers) {
      if (sticker.category !== 'teams' || !sticker.team) continue;
      if (!grouped.has(sticker.team)) grouped.set(sticker.team, []);
      grouped.get(sticker.team)?.push(sticker);
      if (sticker.iso2 && !teamIso2ByName.has(sticker.team)) {
        teamIso2ByName.set(sticker.team, sticker.iso2);
      }
    }

    return Array.from(grouped.entries())
      .sort(([teamA], [teamB]) => teamA.localeCompare(teamB))
      .map(([team, data]) => ({
        title: team,
        data,
        teamIso2: teamIso2ByName.get(team),
      }));
  }, [filteredStickers]);

  const isSingleTeamView = teamFilter !== 'all';
  const selectedTeamIso2 = useMemo(() => {
    if (!isSingleTeamView) return undefined;
    const first = filteredStickers.find((sticker) => sticker.category === 'teams' && sticker.team === teamFilter);
    return first?.iso2;
  }, [filteredStickers, isSingleTeamView, teamFilter]);

  const teamGridSections = useMemo<GridSection[]>(
    () =>
      teamGroupedSections.map((section) => ({
        key: `team-${section.title}`,
        title: section.title,
        data: chunkStickers(section.data, GRID_COLUMNS),
        count: section.data.length,
        teamIso2: section.teamIso2,
        isTeamSection: true,
      })),
    [teamGroupedSections]
  );

  const mixedGridSections = useMemo<GridSection[]>(() => {
    const sections: GridSection[] = [];

    for (const section of groupedSections) {
      if (section.category === 'teams') {
        for (const teamSection of teamGroupedSections) {
          sections.push({
            key: `team-${teamSection.title}`,
            title: teamSection.title,
            data: chunkStickers(teamSection.data, GRID_COLUMNS),
            count: teamSection.data.length,
            teamIso2: teamSection.teamIso2,
            isTeamSection: true,
          });
        }
      } else {
        sections.push({
          key: `category-${section.title}`,
          title: section.title,
          data: chunkStickers(section.data, GRID_COLUMNS),
          count: section.data.length,
          isTeamSection: false,
        });
      }
    }

    return sections;
  }, [groupedSections, teamGroupedSections]);

  function renderStickerCard(item: Sticker, compact = false, showTeamMeta = true, grid = false) {
    const status = stickerState[item.id] ?? { owned: false, repeatedCount: 0 };

    return (
      <View style={[styles.card, compact && styles.cardCompact, grid && styles.cardGrid, status.owned && styles.cardOwned]}>
        <View style={[styles.stickerFace, status.owned && styles.stickerFaceOwned]}>
          <View style={styles.cardTopRow}>
            <View style={[styles.codePill, status.owned && styles.codePillOwned]}>
              <Text style={[styles.code, status.owned && styles.codeOwned]}>{item.code}</Text>
            </View>

            <View style={styles.topRightActions}>
              {status.repeatedCount > 0 && (
                <View style={[styles.repeatBadge, status.owned && styles.repeatBadgeOwned]}>
                  <Text style={[styles.repeatBadgeText, status.owned && styles.repeatBadgeTextOwned]}>x{status.repeatedCount}</Text>
                </View>
              )}

              <Pressable
                style={[styles.ownedToggle, status.owned && styles.ownedToggleActive]}
                onPress={() => toggleOwned(item.id)}
              >
                <Ionicons name={status.owned ? 'checkmark' : 'add'} size={14} color={status.owned ? '#ffffff' : '#0d6efd'} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.albumStrip, status.owned && styles.albumStripOwned]} />

          <View style={[styles.nameRow, compact && styles.nameRowCompact]}>
            {showTeamMeta && item.iso2 && (
              <Image
                source={{ uri: `https://flagcdn.com/32x24/${item.iso2.toLowerCase()}.png` }}
                style={styles.flagImage}
              />
            )}
            <View style={styles.nameTextWrap}>
              {showTeamMeta && (
                <Text style={[styles.teamName, status.owned && styles.teamNameOwned]} numberOfLines={1}>
                  {item.team ?? ' '}
                </Text>
              )}
              <Text style={[styles.name, status.owned && styles.nameOwned]} numberOfLines={compact ? 1 : 2}>
                {item.title}
              </Text>
            </View>
          </View>

          <View style={[styles.bottomControlsRow, !status.owned && styles.bottomControlsRowHidden]}>
            <View style={[styles.counterControls, status.owned && styles.counterControlsOwned]}>
              <Pressable
                style={[
                  styles.counterBtn,
                  status.owned && styles.counterBtnOwned,
                  (status.repeatedCount === 0 || !status.owned) && styles.counterBtnDisabled,
                ]}
                onPress={() => decrementRepeated(item.id)}
                disabled={status.repeatedCount === 0 || !status.owned}
              >
                <Text style={[styles.counterBtnText, status.owned && styles.counterBtnTextOwned]}>−</Text>
              </Pressable>
              <Text style={[styles.counterValue, status.owned && styles.counterValueOwned]}>{status.repeatedCount}</Text>
              <Pressable
                style={[styles.counterBtn, status.owned && styles.counterBtnOwned, !status.owned && styles.counterBtnDisabled]}
                onPress={() => incrementRepeated(item.id)}
                disabled={!status.owned}
              >
                <Text style={[styles.counterBtnText, status.owned && styles.counterBtnTextOwned]}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getLabel('albumTitle')}</Text>
      <Text style={styles.subtitle}>{getLabel('albumSubtitle')}</Text>

      <View style={styles.searchRow}>
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder={getLabel('searchPlaceholder')}
          placeholderTextColor="#647995"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        <Pressable
          style={[
            styles.filterIconButton,
            (categoryFilter !== 'all' || teamFilter !== 'all') && styles.filterIconButtonActive,
          ]}
          onPress={() => setDrawerVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={categoryFilter !== 'all' || teamFilter !== 'all' ? '#ffffff' : '#44536b'}
          />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'owned', 'missing', 'repeated'] as const).map((item) => (
          <Pressable
            key={item}
            style={[styles.filterButton, filter === item && styles.filterButtonActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {getLabel(
                item === 'all'
                  ? 'filterAll'
                  : item === 'owned'
                    ? 'filterOwned'
                    : item === 'missing'
                      ? 'filterMissing'
                      : 'filterRepeated'
              )}
            </Text>
          </Pressable>
        ))}
      </View>

      {(categoryFilter !== 'all' || teamFilter !== 'all') && (
        <View style={styles.activeCategoryRow}>
          {categoryFilter !== 'all' && (
            <View style={styles.activeCategoryChip}>
              <Text style={styles.activeCategoryText}>
                {getLabel(categoryKeyMap[categoryFilter])}
              </Text>
              <Pressable onPress={() => setCategoryFilter('all')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#0d6efd" />
              </Pressable>
            </View>
          )}
          {teamFilter !== 'all' && (
            <View style={styles.activeCategoryChip}>
              <Text style={styles.activeCategoryText}>
                {teamFilter}
              </Text>
              <Pressable onPress={() => setTeamFilter('all')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#0d6efd" />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {isSingleTeamView ? (
        <View style={styles.teamGroupedContainer}>
          <View style={styles.teamSectionHeader}>
            {selectedTeamIso2 && (
              <Image
                source={{ uri: `https://flagcdn.com/32x24/${selectedTeamIso2.toLowerCase()}.png` }}
                style={styles.teamSectionFlag}
              />
            )}
            <Text style={styles.teamSectionTitle}>{teamFilter}</Text>
            <Text style={styles.teamSectionCount}>{filteredStickers.length}</Text>
          </View>

          <FlatList
            data={filteredStickers}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={styles.compactRow}
            contentContainerStyle={styles.teamGridContent}
            initialNumToRender={48}
            maxToRenderPerBatch={48}
            windowSize={7}
            removeClippedSubviews
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                {renderStickerCard(item, true, false, true)}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{getLabel('noSearchResults')}</Text>}
          />
        </View>
      ) : categoryFilter === 'teams' ? (
        <SectionList
          sections={teamGridSections}
          keyExtractor={(_, index) => `team-row-${index}`}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          initialNumToRender={36}
          maxToRenderPerBatch={36}
          windowSize={7}
          removeClippedSubviews
          renderSectionHeader={({ section }) => (
            <View style={styles.teamSectionHeader}>
              {section.teamIso2 && (
                <Image
                  source={{ uri: `https://flagcdn.com/32x24/${section.teamIso2.toLowerCase()}.png` }}
                  style={styles.teamSectionFlag}
                />
              )}
              <Text style={styles.teamSectionTitle}>{section.title}</Text>
              <Text style={styles.teamSectionCount}>{section.count}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.compactRow}> 
              {item.map((sticker) => (
                <View key={sticker.id} style={styles.gridItem}>
                  {renderStickerCard(sticker, true, false, true)}
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>{getLabel('noSearchResults')}</Text>}
        />
      ) : (
        <SectionList
          sections={mixedGridSections}
          keyExtractor={(_, index) => `mixed-row-${index}`}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          initialNumToRender={36}
          maxToRenderPerBatch={36}
          windowSize={7}
          removeClippedSubviews
          renderSectionHeader={({ section }) =>
            section.isTeamSection ? (
              <View style={styles.teamSectionHeader}>
                {section.teamIso2 && (
                  <Image
                    source={{ uri: `https://flagcdn.com/32x24/${section.teamIso2.toLowerCase()}.png` }}
                    style={styles.teamSectionFlag}
                  />
                )}
                <Text style={styles.teamSectionTitle}>{section.title}</Text>
                <Text style={styles.teamSectionCount}>{section.count}</Text>
              </View>
            ) : (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>{getLabel('itemsCount', { count: section.count })}</Text>
              </View>
            )
          }
          renderItem={({ item, section }) => (
            <View style={styles.compactRow}>
              {item.map((sticker) => (
                <View key={sticker.id} style={styles.gridItem}>
                  {renderStickerCard(sticker, true, !section.isTeamSection, true)}
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>{getLabel('noSearchResults')}</Text>}
        />
      )}
      <Modal
        visible={drawerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setDrawerVisible(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{getLabel('categoryFilterTitle')}</Text>
              <Pressable onPress={() => setDrawerVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color="#10213a" />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.drawerScrollContent}>
            {(['all', ...categoryOrder] as const).map((cat) => {
              const isSelected = categoryFilter === cat;
              const label =
                cat === 'all'
                  ? getLabel('allCategories')
                  : getLabel(categoryKeyMap[cat]);
              return (
                <Pressable
                  key={cat}
                  style={[styles.drawerOption, isSelected && styles.drawerOptionActive]}
                  onPress={() => {
                    setCategoryFilter(cat);
                    if (cat !== 'all' && cat !== 'teams') {
                      setTeamFilter('all');
                    }
                    setDrawerVisible(false);
                  }}
                >
                  <Text style={[styles.drawerOptionText, isSelected && styles.drawerOptionTextActive]}>
                    {label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#0d6efd" />}
                </Pressable>
              );
            })}

            <Text style={styles.drawerSubtitle}>{getLabel('teamFilterTitle')}</Text>
            {(['all', ...teamOptions] as const).map((team) => {
              const isSelected = teamFilter === team;
              const label = team === 'all' ? getLabel('allTeams') : team;
              const teamDisabled = categoryFilter !== 'all' && categoryFilter !== 'teams';

              return (
                <Pressable
                  key={team}
                  style={[
                    styles.drawerOption,
                    isSelected && styles.drawerOptionActive,
                    teamDisabled && styles.drawerOptionDisabled,
                  ]}
                  disabled={teamDisabled}
                  onPress={() => {
                    setTeamFilter(team);
                    if (team !== 'all') {
                      setCategoryFilter('teams');
                    }
                    setDrawerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.drawerOptionText,
                      isSelected && styles.drawerOptionTextActive,
                      teamDisabled && styles.drawerOptionTextDisabled,
                    ]}
                  >
                    {label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#0d6efd" />}
                </Pressable>
              );
            })}
            </ScrollView>

          </View>
        </View>
      </Modal>
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
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c9d7ea',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    color: '#10213a',
  },
  filterRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#c9d7ea',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonActive: {
    borderColor: '#c1121f',
    backgroundColor: '#c1121f',
  },
  filterText: {
    color: '#214065',
    fontWeight: '600',
    fontSize: 13,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b1d51',
  },
  sectionCount: {
    color: '#5c6885',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dfec',
    backgroundColor: '#ebf0f8',
    padding: 3,
    shadowColor: '#10213a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardOwned: {
    borderColor: '#000000',
    backgroundColor: '#111111',
    shadowColor: '#000000',
    shadowOpacity: 0.65,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  cardCompact: {
    width: '100%',
  },
  cardGrid: {
    height: 128,
    minHeight: 128,
    maxHeight: 128,
  },
  stickerFace: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d9e4f1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 5,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  stickerFaceOwned: {
    borderColor: '#2f2f2f',
    backgroundColor: '#1b1b1b',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codePill: {
    backgroundColor: '#edf3ff',
    borderWidth: 1,
    borderColor: '#d2e1ff',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  codePillOwned: {
    backgroundColor: '#2b2b2b',
    borderColor: '#6a6a6a',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  code: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c1121f',
  },
  codeOwned: {
    color: '#ffffff',
  },
  teamName: {
    color: '#4a5f7e',
    fontSize: 9,
    fontWeight: '700',
    minHeight: 11,
  },
  teamNameOwned: {
    color: '#ececec',
  },
  name: {
    color: '#0b1d51',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  nameOwned: {
    color: '#ffffff',
  },
  nameTextWrap: {
    flex: 1,
    minHeight: 30,
  },
  repeatBadge: {
    backgroundColor: '#fff2e4',
    borderWidth: 1,
    borderColor: '#f9c797',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  repeatBadgeText: {
    color: '#d17416',
    fontSize: 10,
    fontWeight: '700',
  },
  repeatBadgeOwned: {
    backgroundColor: '#2a2a2a',
    borderColor: '#737373',
  },
  repeatBadgeTextOwned: {
    color: '#ffffff',
  },
  albumStrip: {
    marginTop: 5,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#edf2fa',
  },
  albumStripOwned: {
    backgroundColor: '#4e4e4e',
  },
  ownedToggle: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#009b3a',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedToggleActive: {
    backgroundColor: '#009b3a',
    borderColor: '#009b3a',
  },
  bottomControlsRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 22,
  },
  bottomControlsRowHidden: {
    opacity: 0,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d7e1ef',
    overflow: 'hidden',
    backgroundColor: '#f7fafe',
  },
  counterControlsOwned: {
    borderColor: '#686868',
    backgroundColor: '#1f1f1f',
  },
  counterBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf3ff',
  },
  counterBtnOwned: {
    backgroundColor: '#353535',
  },
  counterBtnDisabled: {
    opacity: 0.35,
  },
  counterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#214065',
    lineHeight: 16,
  },
  counterBtnTextOwned: {
    color: '#ffffff',
  },
  counterValue: {
    width: 18,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#10213a',
  },
  counterValueOwned: {
    color: '#ffffff',
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#44536b',
    fontSize: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIconButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c9d7ea',
  },
  filterIconButtonActive: {
    backgroundColor: '#c1121f',
    borderColor: '#c1121f',
  },
  activeCategoryRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8eeff',
    borderWidth: 1,
    borderColor: '#c1121f',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeCategoryText: {
    color: '#c1121f',
    fontWeight: '600',
    fontSize: 13,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  nameRowCompact: {
    marginTop: 4,
  },
  flagImage: {
    width: 14,
    height: 10,
    borderRadius: 2,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gridItem: {
    width: '32%',
  },
  teamGroupedContainer: {
    marginBottom: 8,
  },
  teamGridContent: {
    paddingBottom: 2,
  },
  teamSectionHeader: {
    marginTop: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e7ecf8',
    borderWidth: 1,
    borderColor: '#d4deef',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  teamSectionFlag: {
    width: 16,
    height: 11,
    borderRadius: 2,
  },
  teamSectionTitle: {
    color: '#0b1d51',
    fontWeight: '700',
    fontSize: 12,
  },
  teamSectionCount: {
    marginLeft: 2,
    color: '#5c6885',
    fontWeight: '700',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  drawer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    maxHeight: '78%',
  },
  drawerScrollContent: {
    paddingBottom: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10213a',
  },
  drawerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4fa',
  },
  drawerOptionActive: {},
  drawerOptionDisabled: {
    opacity: 0.45,
  },
  drawerOptionText: {
    fontSize: 16,
    color: '#44536b',
    fontWeight: '500',
  },
  drawerOptionTextActive: {
    color: '#c1121f',
    fontWeight: '700',
  },
  drawerOptionTextDisabled: {
    color: '#93a2b8',
  },
  drawerSubtitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#10213a',
  },
});
