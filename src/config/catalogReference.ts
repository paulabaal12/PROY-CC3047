import raw from '../../reference/catalog-reference.json';
import type { CatalogReference, Country, Game, GameStatus, Studio } from '@/types';

// Real data from the centralamerica.games repo (no contact data), used for selects and the seed.
export const catalog: CatalogReference = raw as CatalogReference;

export const COUNTRIES: Country[] = catalog.countries;
export const STUDIOS: Studio[] = [...catalog.studios].sort((a, b) => a.name.localeCompare(b.name));
export const GAMES: Game[] = [...catalog.games].sort((a, b) => a.name.localeCompare(b.name));

export const PLATFORMS: string[] = Array.from(
  new Set(catalog.games.flatMap((g) => g.platforms)),
).sort((a, b) => a.localeCompare(b));

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  released: 'Publicado (released)',
  'early-access': 'Acceso anticipado (early-access)',
  'in-development': 'En desarrollo (in-development)',
  demo: 'Demo',
};

const studioById = new Map(catalog.studios.map((s) => [s.id, s]));
const gameBySlug = new Map(catalog.games.map((g) => [g.slug, g]));

export const findStudio = (id?: string): Studio | undefined =>
  id ? studioById.get(id) : undefined;
export const findGame = (slug?: string): Game | undefined =>
  slug ? gameBySlug.get(slug) : undefined;
export const countryName = (code?: string): string =>
  COUNTRIES.find((c) => c.code === code)?.name ?? code ?? '';

export const gamesOfStudio = (studioId: string): Game[] =>
  GAMES.filter((g) => g.studios.some((s) => s.id === studioId));

export const studioOfGame = (slug: string): Studio | undefined => {
  const game = gameBySlug.get(slug);
  return game ? studioById.get(game.studios[0]?.id ?? '') : undefined;
};
