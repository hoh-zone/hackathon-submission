export type TimePeriod = '1d' | '1w' | '1m' | 'all';

export interface Region {
  id: string;
  name: string;
  code: string;
  country: string;
  totalOI: number;
  totalOIPercentage: number;
  spread: number;
  fundingRate: number;
  volume: number;
  priceChange24h: number;
  priceHistory: number[];
}

export interface ExploreState {
  selectedTimePeriod: TimePeriod;
  searchQuery: string;
  regions: Region[];
  loading: boolean;
  error: string | null;
  sortBy: keyof Region;
  sortDirection: 'asc' | 'desc';
} 