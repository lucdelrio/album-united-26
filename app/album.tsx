import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Keyboard,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAlbum } from '../lib/albumContext';
import type { Sticker, StickerCategory, TeamSection } from '../lib/types';

const stadiumSilhouetteImage = require('../assets/icons/stadium-silhouette.png');
const playerSilhouetteImage = require('../assets/icons/player-action-silhouette.png');

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

const categoryCardTheme: Record<
  StickerCategory,
  {
    accent: string;
    border: string;
    surface: string;
    strip: string;
    chipBackground: string;
    chipBorder: string;
    badgeBackground: string;
    badgeBorder: string;
  }
> = {
  special: {
    accent: '#c1121f',
    border: '#f7b7bf',
    surface: '#fff1f3',
    strip: '#ffd7dd',
    chipBackground: '#ffe7ea',
    chipBorder: '#f6bac2',
    badgeBackground: '#ffece0',
    badgeBorder: '#f7c7a0',
  },
  stadiums: {
    accent: '#0d6efd',
    border: '#cfe0ff',
    surface: '#edf3ff',
    strip: '#d8e6ff',
    chipBackground: '#e6efff',
    chipBorder: '#c7dcff',
    badgeBackground: '#e7f0ff',
    badgeBorder: '#c8dcff',
  },
  legends: {
    accent: '#d17416',
    border: '#f9d1aa',
    surface: '#fff4e8',
    strip: '#ffe2c2',
    chipBackground: '#fff0dd',
    chipBorder: '#f8d2ad',
    badgeBackground: '#fff2e4',
    badgeBorder: '#f9c797',
  },
  teams: {
    accent: '#009b3a',
    border: '#bde8cf',
    surface: '#ebf8f0',
    strip: '#caefd9',
    chipBackground: '#ddf5e8',
    chipBorder: '#b9e5cb',
    badgeBackground: '#e6f7ec',
    badgeBorder: '#bde8cf',
  },
};

const teamSectionAccent: Record<TeamSection, string> = {
  concacaf: '#009b3a',
  conmebol: '#f4b400',
  uefa: '#0d6efd',
  caf: '#fb8500',
  afc: '#d00000',
  ofc: '#4361ee',
  playoff: '#7b2cbf',
};

const flagPaletteByIso2: Record<string, { primary: string; secondary: string }> = {
  us: { primary: '#b22234', secondary: '#3c3b6e' },
  ca: { primary: '#d80621', secondary: '#ffffff' },
  mx: { primary: '#006847', secondary: '#ce1126' },
  pa: { primary: '#005293', secondary: '#d21034' },
  cr: { primary: '#002b7f', secondary: '#ce1126' },
  jm: { primary: '#009b3a', secondary: '#fcd116' },
  ar: { primary: '#74acdf', secondary: '#ffffff' },
  br: { primary: '#009b3a', secondary: '#ffdf00' },
  uy: { primary: '#0038a8', secondary: '#ffffff' },
  co: { primary: '#fcd116', secondary: '#003893' },
  ecu: { primary: '#fcd116', secondary: '#034ea2' },
  ve: { primary: '#f4c300', secondary: '#cf142b' },
  de: { primary: '#000000', secondary: '#dd0000' },
  fr: { primary: '#0055a4', secondary: '#ef4135' },
  es: { primary: '#aa151b', secondary: '#f1bf00' },
  'gb-eng': { primary: '#c8102e', secondary: '#ffffff' },
  pt: { primary: '#046a38', secondary: '#da291c' },
  nl: { primary: '#21468b', secondary: '#ae1c28' },
  it: { primary: '#009246', secondary: '#ce2b37' },
  be: { primary: '#000000', secondary: '#ef3340' },
  hr: { primary: '#171796', secondary: '#f00000' },
  rs: { primary: '#c6363c', secondary: '#0c4076' },
  ch: { primary: '#d52b1e', secondary: '#ffffff' },
  at: { primary: '#ed2939', secondary: '#ffffff' },
  'gb-sct': { primary: '#005eb8', secondary: '#ffffff' },
  tr: { primary: '#e30a17', secondary: '#ffffff' },
  hu: { primary: '#ce2939', secondary: '#477050' },
  ua: { primary: '#0057b7', secondary: '#ffd700' },
  ma: { primary: '#c1272d', secondary: '#006233' },
  sn: { primary: '#00853f', secondary: '#fdef42' },
  eg: { primary: '#ce1126', secondary: '#000000' },
  za: { primary: '#007749', secondary: '#ffb612' },
  ng: { primary: '#008751', secondary: '#ffffff' },
  dz: { primary: '#006233', secondary: '#d21034' },
  cm: { primary: '#007a5e', secondary: '#ce1126' },
  tn: { primary: '#e70013', secondary: '#ffffff' },
  cd: { primary: '#00a1de', secondary: '#ef3340' },
  jp: { primary: '#bc002d', secondary: '#ffffff' },
  kr: { primary: '#003478', secondary: '#c60c30' },
  ir: { primary: '#239f40', secondary: '#da0000' },
  sa: { primary: '#006c35', secondary: '#ffffff' },
  au: { primary: '#012169', secondary: '#e4002b' },
  qa: { primary: '#8d1b3d', secondary: '#ffffff' },
  iq: { primary: '#ce1126', secondary: '#000000' },
  jo: { primary: '#007a3d', secondary: '#ce1126' },
  nz: { primary: '#012169', secondary: '#c8102e' },
  ro: { primary: '#002b7f', secondary: '#fcd116' },
  si: { primary: '#0056a4', secondary: '#ed1c24' },
};

const categoryWatermarkIcon: Record<StickerCategory, keyof typeof Ionicons.glyphMap> = {
  special: 'trophy-outline',
  stadiums: 'football-outline',
  legends: 'person-outline',
  teams: 'shield-outline',
};

const categoryHeroIcon: Record<StickerCategory, keyof typeof Ionicons.glyphMap> = {
  special: 'trophy',
  stadiums: 'football',
  legends: 'person',
  teams: 'shield-checkmark',
};

const flagEmojiByIso2: Record<string, string> = {
  us: '🇺🇸',
  ca: '🇨🇦',
  mx: '🇲🇽',
  pa: '🇵🇦',
  cr: '🇨🇷',
  jm: '🇯🇲',
  ar: '🇦🇷',
  br: '🇧🇷',
  uy: '🇺🇾',
  co: '🇨🇴',
  ec: '🇪🇨',
  ve: '🇻🇪',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  'gb-eng': '🏴',
  pt: '🇵🇹',
  nl: '🇳🇱',
  it: '🇮🇹',
  be: '🇧🇪',
  hr: '🇭🇷',
  rs: '🇷🇸',
  ch: '🇨🇭',
  at: '🇦🇹',
  'gb-sct': '🏴',
  tr: '🇹🇷',
  hu: '🇭🇺',
  ua: '🇺🇦',
  ma: '🇲🇦',
  sn: '🇸🇳',
  eg: '🇪🇬',
  za: '🇿🇦',
  ng: '🇳🇬',
  dz: '🇩🇿',
  cm: '🇨🇲',
  tn: '🇹🇳',
  cd: '🇨🇩',
  jp: '🇯🇵',
  kr: '🇰🇷',
  ir: '🇮🇷',
  sa: '🇸🇦',
  au: '🇦🇺',
  qa: '🇶🇦',
  iq: '🇮🇶',
  jo: '🇯🇴',
  nz: '🇳🇿',
  ro: '🇷🇴',
  si: '🇸🇮',
};

function getFlagEmoji(iso2?: string): string {
  if (!iso2) {
    return '🏳️';
  }

  return flagEmojiByIso2[iso2.toLowerCase()] ?? '🏳️';
}

function normalizeColorSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hexColor: string): { red: number; green: number; blue: number } {
  const normalized = hexColor.replace('#', '');
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function blendColors(from: string, to: string, ratio: number): string {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const start = hexToRgb(from);
  const end = hexToRgb(to);

  const red = Math.round(start.red + (end.red - start.red) * clampedRatio);
  const green = Math.round(start.green + (end.green - start.green) * clampedRatio);
  const blue = Math.round(start.blue + (end.blue - start.blue) * clampedRatio);

  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function resolveCardTheme(sticker: Sticker) {
  if (sticker.category !== 'teams') {
    return categoryCardTheme[sticker.category];
  }

  const base = teamSectionAccent[sticker.teamSection ?? 'playoff'];
  const palette = flagPaletteByIso2[(sticker.iso2 ?? '').toLowerCase()];
  const primary = palette?.primary ?? base;
  const secondary = palette?.secondary ?? '#ffffff';
  const accent = blendColors(primary, secondary, 0.2);

  return {
    accent,
    border: blendColors(primary, '#ffffff', 0.62),
    surface: blendColors(secondary, '#ffffff', 0.76),
    strip: blendColors(primary, secondary, 0.42),
    chipBackground: blendColors(secondary, '#ffffff', 0.72),
    chipBorder: blendColors(primary, '#ffffff', 0.68),
    badgeBackground: blendColors(secondary, '#ffffff', 0.64),
    badgeBorder: blendColors(primary, '#ffffff', 0.66),
  };
}

export default function AlbumScreen() {
  const { stickers, stickerState, toggleOwned, incrementRepeated, decrementRepeated, getLabel } = useAlbum();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<StickerCategory | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string | 'all'>('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const [menuMeasuredHeight, setMenuMeasuredHeight] = useState(0);
  const menuVisibility = useRef(new Animated.Value(1)).current;
  const lastScrollYRef = useRef(0);
  const scrollDirectionRef = useRef<1 | -1 | 0>(0);
  const scrollTravelRef = useRef(0);
  const menuVisibleRef = useRef(true);

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

  useEffect(() => {
    menuVisibleRef.current = true;
    scrollDirectionRef.current = 0;
    scrollTravelRef.current = 0;
    Animated.timing(menuVisibility, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [categoryFilter, teamFilter, filter, debouncedSearchTerm, menuVisibility]);

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
  const getSectionDisplayCount = (sectionStickers: Sticker[]) => {
    if (filter === 'repeated') {
      return sectionStickers.reduce((count, sticker) => {
        const status = stickerState[sticker.id] ?? { owned: false, repeatedCount: 0 };
        return count + status.repeatedCount;
      }, 0);
    }

    if (filter !== 'all') {
      return sectionStickers.length;
    }

    return sectionStickers.reduce((count, sticker) => {
      const status = stickerState[sticker.id] ?? { owned: false, repeatedCount: 0 };
      return count + (status.owned ? 0 : 1);
    }, 0);
  };

  const getSectionCountLabel = (count: number) =>
    filter === 'repeated' ? `${getLabel('filterRepeated')}: ${count}` : `${count}`;

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
        count: getSectionDisplayCount(section.data),
        teamIso2: section.teamIso2,
        isTeamSection: true,
      })),
    [getSectionDisplayCount, teamGroupedSections]
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
            count: getSectionDisplayCount(teamSection.data),
            teamIso2: teamSection.teamIso2,
            isTeamSection: true,
          });
        }
      } else {
        sections.push({
          key: `category-${section.title}`,
          title: section.title,
          data: chunkStickers(section.data, GRID_COLUMNS),
          count: getSectionDisplayCount(section.data),
          isTeamSection: false,
        });
      }
    }

    return sections;
  }, [getSectionDisplayCount, groupedSections, teamGroupedSections]);

  function renderStickerCard(item: Sticker, compact = false, showTeamMeta = true, grid = false) {
    const status = stickerState[item.id] ?? { owned: false, repeatedCount: 0 };
    const categoryTheme = resolveCardTheme(item);
    const heroIcon = categoryHeroIcon[item.category];
    const teamNumber = item.category === 'teams' ? (item.code.match(/#\s*(\d+)/)?.[1] ?? '') : '';
    const teamAbbreviation = item.code.split(' ')[0];
    const teamCodeLabel = item.category === 'teams' ? `${teamAbbreviation} #${teamNumber}` : item.code;
    const cardTopLabel = item.category === 'teams' ? teamCodeLabel : item.code;
    const normalizedAccent = blendColors(categoryTheme.accent, '#5f6f8a', 0.42);
    const cardSolidColor = status.owned
      ? blendColors(normalizedAccent, '#0b1d51', 0.38)
      : blendColors(normalizedAccent, '#ffffff', 0.62);
    const cardTextColor = status.owned ? '#ffffff' : '#0b1d51';

    return (
      <Pressable
        style={[
          styles.card,
          compact && styles.cardCompact,
          grid && styles.cardGrid,
        ]}
        onPress={() => toggleOwned(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${teamCodeLabel} ${status.owned ? 'seleccionada' : 'no seleccionada'}`}
      >
        <View
          style={[
            styles.stickerFace,
            {
              borderColor: cardSolidColor,
              backgroundColor: cardSolidColor,
            },
            status.owned && { borderColor: cardSolidColor },
          ]}
        >
          <View
            style={[
              styles.heroPanel,
              styles.heroPanelTeam,
              {
                backgroundColor: cardSolidColor,
                borderColor: cardSolidColor,
              },
            ]}
          >
            <View style={styles.teamCardContent}>
              <Text
                style={[styles.teamHeroCode, { color: cardTextColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {cardTopLabel}
              </Text>
              {item.category === 'stadiums' ? (
                <Image
                  source={stadiumSilhouetteImage}
                  style={[
                    styles.heroPlayerCenter,
                    {
                      tintColor: cardTextColor,
                    },
                  ]}
                />
              ) : item.category === 'legends' ? (
                <Ionicons
                  name="medal"
                  size={30}
                  color={cardTextColor}
                />
              ) : item.category === 'teams' ? (
                <Image
                  source={playerSilhouetteImage}
                  style={[
                    styles.heroPlayerCenter,
                    {
                      tintColor: cardTextColor,
                    },
                  ]}
                />
              ) : (
                <Ionicons
                  name={heroIcon}
                  size={30}
                  color={cardTextColor}
                />
              )}
            </View>
          </View>

          <View
            style={[
              styles.bottomControlsRow,
              !status.owned && styles.bottomControlsRowHidden,
            ]}
          >
            <View
              style={[
                styles.counterControls,
                {
                  borderColor: cardSolidColor,
                  backgroundColor: cardSolidColor,
                },
                status.owned && { borderColor: cardSolidColor },
              ]}
            >
              <Pressable
                style={[
                  styles.counterBtn,
                  { backgroundColor: cardSolidColor },
                  (status.repeatedCount === 0 || !status.owned) && styles.counterBtnDisabled,
                ]}
                onPress={() => decrementRepeated(item.id)}
                disabled={status.repeatedCount === 0 || !status.owned}
                hitSlop={8}
              >
                <Text
                  style={[styles.counterBtnText, { color: cardTextColor }]}
                >
                  −
                </Text>
              </Pressable>
              {status.repeatedCount > 0 && (
                <View
                  style={[
                    styles.counterValueBadge,
                    {
                      backgroundColor: categoryTheme.badgeBackground,
                      borderColor: categoryTheme.badgeBorder,
                    },
                  ]}
                >
                  <Text style={[styles.counterValue, { color: categoryTheme.accent }]}>
                    {status.repeatedCount}
                  </Text>
                </View>
              )}
              <Pressable
                style={[
                  styles.counterBtn,
                  { backgroundColor: cardSolidColor },
                  !status.owned && styles.counterBtnDisabled,
                  status.repeatedCount >= 30 && styles.counterBtnDisabled,
                ]}
                onPress={() => incrementRepeated(item.id)}
                disabled={!status.owned || status.repeatedCount >= 30}
                hitSlop={8}
              >
                <Text
                  style={[styles.counterBtnText, { color: cardTextColor }]}
                >
                  +
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  function renderAlbumTitle() {
    return (
      <View style={styles.albumHeaderContainer}>
        <Text style={styles.title}>{getLabel('albumTitle')}</Text>
        <Text style={styles.subtitle}>{getLabel('albumSubtitle')}</Text>
      </View>
    );
  }

  function renderAlbumMenu() {
    return (
      <View
        style={styles.floatingMenuWrapper}
        onLayout={(event) => {
          const height = Math.round(event.nativeEvent.layout.height);
          if (height > 0 && height !== menuMeasuredHeight) {
            setMenuMeasuredHeight(height);
          }
        }}
      >

        <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <TextInput
                ref={searchInputRef}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder={getLabel('searchPlaceholder')}
                placeholderTextColor="#647995"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.searchInput, searchTerm.length > 0 && styles.searchInputWithClear]}
              />
              {searchTerm.length > 0 && (
                <Pressable
                  style={styles.clearSearchButton}
                  onPress={() => {
                    setSearchTerm('');
                    setDebouncedSearchTerm('');
                    searchInputRef.current?.blur();
                    Keyboard.dismiss();
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={18} color="#6f7f9d" />
                </Pressable>
              )}
            </View>
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
      </View>
    );
  }

  function handleListScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextY = event.nativeEvent.contentOffset.y;
    const previousY = lastScrollYRef.current;
    const delta = nextY - previousY;
    const hideDistance = 20;
    const showDistance = 12;

    if (nextY <= 8) {
      if (!menuVisibleRef.current) {
        menuVisibleRef.current = true;
        Animated.timing(menuVisibility, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }
      scrollDirectionRef.current = 0;
      scrollTravelRef.current = 0;
      lastScrollYRef.current = nextY;
      return;
    }

    if (Math.abs(delta) < 0.5) {
      return;
    }

    const direction: 1 | -1 = delta > 0 ? 1 : -1;
    if (scrollDirectionRef.current !== direction) {
      scrollDirectionRef.current = direction;
      scrollTravelRef.current = 0;
    }

    scrollTravelRef.current += Math.abs(delta);

    if (direction === 1 && menuVisibleRef.current && scrollTravelRef.current >= hideDistance) {
      menuVisibleRef.current = false;
      scrollTravelRef.current = 0;
      Animated.timing(menuVisibility, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else if (direction === -1 && !menuVisibleRef.current && scrollTravelRef.current >= showDistance) {
      menuVisibleRef.current = true;
      scrollTravelRef.current = 0;
      Animated.timing(menuVisibility, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }

    lastScrollYRef.current = nextY;
  }

  return (
    <View style={styles.container}>
      {renderAlbumTitle()}
      <Animated.View
        style={[
          styles.menuAnimatedContainer,
          {
            height: menuVisibility.interpolate({
              inputRange: [0, 1],
              outputRange: [0, menuMeasuredHeight || 1],
            }),
            opacity: menuVisibility,
            marginBottom: menuVisibility.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 8],
            }),
          },
        ]}
      >
        {renderAlbumMenu()}
      </Animated.View>

      {isSingleTeamView ? (
        <View style={styles.teamGroupedContainer}>
          <FlatList
            data={filteredStickers}
            onScroll={handleListScroll}
            scrollEventThrottle={16}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={styles.compactRow}
            contentContainerStyle={styles.teamGridContent}
            ListHeaderComponent={
              <View style={styles.teamSectionHeader}>
                  <Text style={styles.teamSectionFlagEmoji}>{getFlagEmoji(selectedTeamIso2)}</Text>
                <Text style={styles.teamSectionTitle}>{teamFilter}</Text>
                  <Text style={styles.teamSectionCount}>{getSectionCountLabel(getSectionDisplayCount(filteredStickers))}</Text>
              </View>
            }
            initialNumToRender={48}
            maxToRenderPerBatch={48}
            windowSize={7}
            removeClippedSubviews={false}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                {renderStickerCard(item, true, true, true)}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{getLabel('noSearchResults')}</Text>}
          />
        </View>
      ) : categoryFilter === 'teams' ? (
        <SectionList
          sections={teamGridSections}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          style={styles.resultsList}
          keyExtractor={(item: GridRow) => item.map((sticker: Sticker) => sticker.id).join('|')}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          initialNumToRender={36}
          maxToRenderPerBatch={36}
          windowSize={7}
          removeClippedSubviews={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.teamSectionHeader}>
              <Text style={styles.teamSectionFlagEmoji}>{getFlagEmoji(section.teamIso2)}</Text>
              <Text style={styles.teamSectionTitle}>{section.title}</Text>
              <Text style={styles.teamSectionCount}>{getSectionCountLabel(section.count)}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.compactRow}> 
              {item.map((sticker: Sticker) => (
                <View key={sticker.id} style={styles.gridItem}>
                  {renderStickerCard(sticker, true, true, true)}
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>{getLabel('noSearchResults')}</Text>}
        />
      ) : (
        <SectionList
          sections={mixedGridSections}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          style={styles.resultsList}
          keyExtractor={(item: GridRow) => item.map((sticker: Sticker) => sticker.id).join('|')}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          initialNumToRender={36}
          maxToRenderPerBatch={36}
          windowSize={7}
          removeClippedSubviews={false}
          renderSectionHeader={({ section }) =>
            section.isTeamSection ? (
              <View style={styles.teamSectionHeader}>
                <Text style={styles.teamSectionFlagEmoji}>{getFlagEmoji(section.teamIso2)}</Text>
                <Text style={styles.teamSectionTitle}>{section.title}</Text>
                <Text style={styles.teamSectionCount}>{getSectionCountLabel(section.count)}</Text>
              </View>
            ) : (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>
                  {filter === 'repeated'
                    ? `${getLabel('filterRepeated')}: ${section.count}`
                    : getLabel('itemsCount', { count: section.count })}
                </Text>
              </View>
            )
          }
          renderItem={({ item, section }) => (
            <View style={styles.compactRow}>
              {item.map((sticker: Sticker) => (
                <View key={sticker.id} style={styles.gridItem}>
                  {renderStickerCard(sticker, true, true, true)}
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
  albumHeaderContainer: {
    paddingBottom: 8,
  },
  menuAnimatedContainer: {
    overflow: 'hidden',
  },
  floatingMenuWrapper: {
    backgroundColor: '#f4f7ff',
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
  searchInputWrap: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchInputWithClear: {
    paddingRight: 34,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: 120,
    flexGrow: 1,
  },
  resultsList: {
    flex: 1,
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
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    padding: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  cardOwned: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  cardCompact: {
    width: '100%',
  },
  cardGrid: {
    width: '100%',
    alignSelf: 'center',
    height: 124,
    minHeight: 124,
    maxHeight: 124,
    transform: [{ scale: 0.9 }],
  },
  stickerFace: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9e4f1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 5,
    paddingVertical: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stickerFaceOwned: {
    borderColor: '#17315f',
    backgroundColor: '#122447',
  },
  cardCategoryRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  cardCategoryRibbonText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  heroPanel: {
    marginTop: 3,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 999,
    opacity: 0.55,
  },
  heroTeamCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '88%',
  },
  heroTeamCountry: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0b1d51',
    textTransform: 'uppercase',
  },
  heroTeamCountryOwned: {
    color: '#ffffff',
  },
  heroTeamNumber: {
    marginTop: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#0b1d51',
    lineHeight: 16,
  },
  heroTeamNumberOwned: {
    color: '#ffffff',
  },
  heroStadiumImage: {
    width: 31,
    height: 31,
    resizeMode: 'contain',
  },
  heroPlayerImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  heroPanelTeam: {
    height: 60,
    marginTop: 0,
  },
  teamCardContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    gap: 8,
  },
  heroPlayerCenter: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
    opacity: 0.65,
  },
  teamHeroCode: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0b1d51',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: -2,
  },
  teamHeroCodeOwned: {
    color: '#ffffff',
  },
  heroBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 13,
    height: 13,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottomPlate: {
    position: 'absolute',
    bottom: 2,
    left: 3,
    right: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 0,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  heroBottomPlateText: {
    color: '#ffffff',
    fontSize: 6,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardTopRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codePill: {
    backgroundColor: '#edf3ff',
    borderWidth: 1,
    borderColor: '#d2e1ff',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
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
    color: '#d8e6ff',
  },
  name: {
    color: '#0b1d51',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  nameOwned: {
    color: '#f5f8ff',
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
    backgroundColor: '#152a52',
    borderColor: '#2a4a85',
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
    backgroundColor: '#2b5fb3',
  },
  ownedToggle: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0d6efd',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedToggleActive: {
    backgroundColor: '#0d6efd',
    borderColor: '#0d6efd',
  },
  bottomControlsRow: {
    position: 'absolute',
    bottom: -2,
    left: 5,
    right: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 30,
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
    borderColor: '#2a4a85',
    backgroundColor: '#152a52',
  },
  counterBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf3ff',
  },
  counterBtnOwned: {
    backgroundColor: '#1d3d75',
  },
  counterBtnDisabled: {
    opacity: 0.35,
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#214065',
    lineHeight: 22,
  },
  counterBtnTextOwned: {
    color: '#ffffff',
  },
  counterValue: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#10213a',
  },
  counterValueBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
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
    flex: 1,
    marginBottom: 8,
  },
  teamGridContent: {
    paddingBottom: 120,
    flexGrow: 1,
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
  teamSectionFlagEmoji: {
    fontSize: 15,
    lineHeight: 18,
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
