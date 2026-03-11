/**
 * Single match in the 2026 World Cup fixture (unified format from any source).
 */
export type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time?: string;
  venue?: string;
  city?: string;
  stage?: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  status?: 'scheduled' | 'live' | 'finished' | 'postponed';
};

export type FixtureSource = 'api-football' | 'custom-url';

export type StickerCategory = 'special' | 'stadiums' | 'legends' | 'teams';
export type TeamSection =
  | 'concacaf'
  | 'conmebol'
  | 'uefa'
  | 'caf'
  | 'afc'
  | 'ofc'
  | 'playoff';

export type Sticker = {
  id: string;
  code: string;
  title: string;
  category: StickerCategory;
  team?: string;
  iso2?: string;
  teamSection?: TeamSection;
};

export type StickerStatus = {
  owned: boolean;
  repeatedCount: number;
};
