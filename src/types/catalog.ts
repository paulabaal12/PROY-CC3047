export type CountryCode = 'GT' | 'SV' | 'HN' | 'NI' | 'CR' | 'PA';
export type GameStatus = 'released' | 'early-access' | 'in-development' | 'demo';

export interface Country {
  code: CountryCode;
  name: string;
}

export interface Studio {
  id: string;
  name: string;
  country: CountryCode;
  city: string;
  founded: number;
  models: string[];
  tech: string[];
  services: string[];
}

export interface GameStudioRole {
  id: string;
  role: string;
}

export interface Game {
  slug: string;
  name: string;
  status: GameStatus;
  platforms: string[];
  studios: GameStudioRole[];
}

export interface CatalogReference {
  countries: Country[];
  studios: Studio[];
  games: Game[];
}
