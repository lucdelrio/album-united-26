import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { t, type Language } from './i18n';
import { STICKERS } from './stickersData';
import type { Sticker, StickerCategory, StickerStatus } from './types';

type AlbumState = Record<string, StickerStatus>;

type AlbumTotals = {
  total: number;
  owned: number;
  repeated: number;
  missing: number;
  completedPercentage: number;
};

type CategorySummary = {
  category: StickerCategory;
  total: number;
  owned: number;
};

type AlbumContextValue = {
  language: Language;
  stickers: Sticker[];
  repeatedStickers: Sticker[];
  stickerState: AlbumState;
  totals: AlbumTotals;
  categories: CategorySummary[];
  getLabel: (key: Parameters<typeof t>[1], values?: Record<string, string | number>) => string;
  toggleOwned: (stickerId: string) => void;
  incrementRepeated: (stickerId: string) => void;
  decrementRepeated: (stickerId: string) => void;
};

const AlbumContext = createContext<AlbumContextValue | undefined>(undefined);
const MAX_REPEATED_PER_STICKER = 30;
const ALBUM_STATE_STORAGE_KEY = 'album_united_26_state_v1';

function resolveDeviceLanguage(): Language {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase() ?? 'en';
  return locale.startsWith('es') ? 'es' : 'en';
}

function defaultStatus(): StickerStatus {
  return { owned: false, repeatedCount: 0 };
}

export function AlbumProvider({ children }: PropsWithChildren) {
  const [language] = useState<Language>(resolveDeviceLanguage);
  const [stickerState, setStickerState] = useState<AlbumState>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateState = async () => {
      try {
        const serialized = await AsyncStorage.getItem(ALBUM_STATE_STORAGE_KEY);
        if (!serialized || !isMounted) {
          return;
        }

        const parsed = JSON.parse(serialized) as AlbumState;
        if (!parsed || typeof parsed !== 'object') {
          return;
        }

        const sanitizedEntries = Object.entries(parsed)
          .filter(([stickerId, status]) => {
            if (typeof stickerId !== 'string' || !status || typeof status !== 'object') {
              return false;
            }

            const owned = (status as StickerStatus).owned;
            const repeatedCount = (status as StickerStatus).repeatedCount;
            return typeof owned === 'boolean' && typeof repeatedCount === 'number';
          })
          .map(([stickerId, status]) => {
            const owned = (status as StickerStatus).owned;
            const repeatedCount = Math.max(
              0,
              Math.min(MAX_REPEATED_PER_STICKER, Math.floor((status as StickerStatus).repeatedCount))
            );

            return [
              stickerId,
              {
                owned,
                repeatedCount: owned ? repeatedCount : 0,
              } satisfies StickerStatus,
            ] as const;
          });

        setStickerState(Object.fromEntries(sanitizedEntries));
      } catch {
        setStickerState({});
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    void hydrateState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistState = async () => {
      try {
        await AsyncStorage.setItem(ALBUM_STATE_STORAGE_KEY, JSON.stringify(stickerState));
      } catch {
        // no-op: local persistence failure should not break app usage
      }
    };

    void persistState();
  }, [isHydrated, stickerState]);

  const totals = useMemo<AlbumTotals>(() => {
    const total = STICKERS.length;
    const owned = STICKERS.reduce(
      (count, sticker) => count + (stickerState[sticker.id]?.owned ? 1 : 0),
      0
    );
    const repeated = STICKERS.reduce(
      (count, sticker) => count + ((stickerState[sticker.id]?.repeatedCount ?? 0) > 0 ? 1 : 0),
      0
    );
    const missing = total - owned;
    const completedPercentage = total ? Math.round((owned / total) * 100) : 0;

    return { total, owned, repeated, missing, completedPercentage };
  }, [stickerState]);

  const categories = useMemo<CategorySummary[]>(() => {
    const totalsByCategory = new Map<StickerCategory, CategorySummary>();

    for (const sticker of STICKERS) {
      const current = totalsByCategory.get(sticker.category) ?? {
        category: sticker.category,
        total: 0,
        owned: 0,
      };

      current.total += 1;
      if (stickerState[sticker.id]?.owned) {
        current.owned += 1;
      }

      totalsByCategory.set(sticker.category, current);
    }

    return [...totalsByCategory.values()];
  }, [stickerState]);

  const repeatedStickers = useMemo(
    () => STICKERS.filter((sticker) => (stickerState[sticker.id]?.repeatedCount ?? 0) > 0),
    [stickerState]
  );

  const toggleOwned = (stickerId: string) => {
    setStickerState((prev) => {
      const current = prev[stickerId] ?? defaultStatus();
      const nextOwned = !current.owned;
      return {
        ...prev,
        [stickerId]: {
          owned: nextOwned,
          repeatedCount: nextOwned ? current.repeatedCount : 0,
        },
      };
    });
  };

  const incrementRepeated = (stickerId: string) => {
    setStickerState((prev) => {
      const current = prev[stickerId] ?? defaultStatus();
      if (!current.owned || current.repeatedCount >= MAX_REPEATED_PER_STICKER) return prev;
      return { ...prev, [stickerId]: { ...current, repeatedCount: current.repeatedCount + 1 } };
    });
  };

  const decrementRepeated = (stickerId: string) => {
    setStickerState((prev) => {
      const current = prev[stickerId] ?? defaultStatus();
      if (!current.owned || current.repeatedCount === 0) return prev;
      return { ...prev, [stickerId]: { ...current, repeatedCount: current.repeatedCount - 1 } };
    });
  };

  const getLabel: AlbumContextValue['getLabel'] = (key, values) => t(language, key, values);

  return (
    <AlbumContext.Provider
      value={{
        language,
        stickers: STICKERS,
        repeatedStickers,
        stickerState,
        totals,
        categories,
        getLabel,
        toggleOwned,
        incrementRepeated,
        decrementRepeated,
      }}
    >
      {children}
    </AlbumContext.Provider>
  );
}

export function useAlbum() {
  const context = useContext(AlbumContext);
  if (!context) {
    throw new Error('useAlbum must be used inside AlbumProvider');
  }
  return context;
}
