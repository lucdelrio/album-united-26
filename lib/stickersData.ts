import type { Sticker, TeamSection } from './types';

const TEAM_STICKERS_PER_TEAM = 19;

function pad(value: number, size = 3): string {
  return String(value).padStart(size, '0');
}

type TeamEntry = { name: string; code: string; iso2: string; section: TeamSection };

// 48 qualified teams for FIFA World Cup 2026
const WC_2026_TEAMS: TeamEntry[] = [
  // CONCACAF (6)
  { name: 'United States',  code: 'USA', iso2: 'US', section: 'concacaf' },
  { name: 'Canada',         code: 'CAN', iso2: 'CA', section: 'concacaf' },
  { name: 'Mexico',         code: 'MEX', iso2: 'MX', section: 'concacaf' },
  { name: 'Panama',         code: 'PAN', iso2: 'PA', section: 'concacaf' },
  { name: 'Costa Rica',     code: 'CRC', iso2: 'CR', section: 'concacaf' },
  { name: 'Jamaica',        code: 'JAM', iso2: 'JM', section: 'concacaf' },
  // CONMEBOL (6)
  { name: 'Argentina',      code: 'ARG', iso2: 'AR', section: 'conmebol' },
  { name: 'Brazil',         code: 'BRA', iso2: 'BR', section: 'conmebol' },
  { name: 'Uruguay',        code: 'URU', iso2: 'UY', section: 'conmebol' },
  { name: 'Colombia',       code: 'COL', iso2: 'CO', section: 'conmebol' },
  { name: 'Ecuador',        code: 'ECU', iso2: 'EC', section: 'conmebol' },
  { name: 'Venezuela',      code: 'VEN', iso2: 'VE', section: 'conmebol' },
  // UEFA (16)
  { name: 'Germany',        code: 'GER', iso2: 'DE', section: 'uefa' },
  { name: 'France',         code: 'FRA', iso2: 'FR', section: 'uefa' },
  { name: 'Spain',          code: 'ESP', iso2: 'ES', section: 'uefa' },
  { name: 'England',        code: 'ENG', iso2: 'gb-eng', section: 'uefa' },
  { name: 'Portugal',       code: 'POR', iso2: 'PT', section: 'uefa' },
  { name: 'Netherlands',    code: 'NED', iso2: 'NL', section: 'uefa' },
  { name: 'Italy',          code: 'ITA', iso2: 'IT', section: 'uefa' },
  { name: 'Belgium',        code: 'BEL', iso2: 'BE', section: 'uefa' },
  { name: 'Croatia',        code: 'CRO', iso2: 'HR', section: 'uefa' },
  { name: 'Serbia',         code: 'SRB', iso2: 'RS', section: 'uefa' },
  { name: 'Switzerland',    code: 'SUI', iso2: 'CH', section: 'uefa' },
  { name: 'Austria',        code: 'AUT', iso2: 'AT', section: 'uefa' },
  { name: 'Scotland',       code: 'SCO', iso2: 'gb-sct', section: 'uefa' },
  { name: 'Turkey',         code: 'TUR', iso2: 'TR', section: 'uefa' },
  { name: 'Hungary',        code: 'HUN', iso2: 'HU', section: 'uefa' },
  { name: 'Ukraine',        code: 'UKR', iso2: 'UA', section: 'uefa' },
  // CAF (9)
  { name: 'Morocco',        code: 'MAR', iso2: 'MA', section: 'caf' },
  { name: 'Senegal',        code: 'SEN', iso2: 'SN', section: 'caf' },
  { name: 'Egypt',          code: 'EGY', iso2: 'EG', section: 'caf' },
  { name: 'South Africa',   code: 'RSA', iso2: 'ZA', section: 'caf' },
  { name: 'Nigeria',        code: 'NGA', iso2: 'NG', section: 'caf' },
  { name: 'Algeria',        code: 'ALG', iso2: 'DZ', section: 'caf' },
  { name: 'Cameroon',       code: 'CMR', iso2: 'CM', section: 'caf' },
  { name: 'Tunisia',        code: 'TUN', iso2: 'TN', section: 'caf' },
  { name: 'DR Congo',       code: 'COD', iso2: 'CD', section: 'caf' },
  // AFC (8)
  { name: 'Japan',          code: 'JPN', iso2: 'JP', section: 'afc' },
  { name: 'South Korea',    code: 'KOR', iso2: 'KR', section: 'afc' },
  { name: 'Iran',           code: 'IRN', iso2: 'IR', section: 'afc' },
  { name: 'Saudi Arabia',   code: 'KSA', iso2: 'SA', section: 'afc' },
  { name: 'Australia',      code: 'AUS', iso2: 'AU', section: 'afc' },
  { name: 'Qatar',          code: 'QAT', iso2: 'QA', section: 'afc' },
  { name: 'Iraq',           code: 'IRQ', iso2: 'IQ', section: 'afc' },
  { name: 'Jordan',         code: 'JOR', iso2: 'JO', section: 'afc' },
  // OFC (1)
  { name: 'New Zealand',    code: 'NZL', iso2: 'NZ', section: 'ofc' },
  // Intercontinental playoffs (2)
  { name: 'Romania',        code: 'ROU', iso2: 'RO', section: 'playoff' },
  { name: 'Slovenia',       code: 'SVN', iso2: 'SI', section: 'playoff' },
];

function buildSpecialCollection(): Sticker[] {
  return Array.from({ length: 20 }, (_, index) => {
    const order = index + 1;
    return {
      id: `special-${order}`,
      code: `SP-${pad(order)}`,
      title: `Official Emblem ${order}`,
      category: 'special',
    };
  });
}

function buildStadiumCollection(): Sticker[] {
  return Array.from({ length: 16 }, (_, index) => {
    const order = index + 1;
    return {
      id: `stadium-${order}`,
      code: `ST-${pad(order)}`,
      title: `Host Stadium ${order}`,
      category: 'stadiums',
    };
  });
}

function buildLegendsCollection(): Sticker[] {
  return Array.from({ length: 32 }, (_, index) => {
    const order = index + 1;
    return {
      id: `legend-${order}`,
      code: `LG-${pad(order)}`,
      title: `World Cup Legend ${order}`,
      category: 'legends',
    };
  });
}

function buildTeamCollection(): Sticker[] {
  const stickers: Sticker[] = [];

  for (let teamIndex = 0; teamIndex < WC_2026_TEAMS.length; teamIndex += 1) {
    const team = WC_2026_TEAMS[teamIndex];

    for (let stickerIndex = 1; stickerIndex <= TEAM_STICKERS_PER_TEAM; stickerIndex += 1) {
      stickers.push({
        id: `team-${team.code}-${stickerIndex}`,
        code: `${team.code}-${pad(stickerIndex, 2)}`,
        title: `Player ${stickerIndex}`,
        category: 'teams',
        team: team.name,
        iso2: team.iso2,
        teamSection: team.section,
      });
    }
  }

  return stickers;
}

export const STICKERS: Sticker[] = [
  ...buildSpecialCollection(),
  ...buildStadiumCollection(),
  ...buildLegendsCollection(),
  ...buildTeamCollection(),
];
