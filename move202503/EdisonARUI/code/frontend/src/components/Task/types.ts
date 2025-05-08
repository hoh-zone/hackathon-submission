export interface TaskConfig {
  id: string;
  chain_pairs: string[];
  threshold: number;
  cooldown: number;
  last_alert?: number;
}

export interface FormValues {
  chain1: string;
  chain2: string;
  token1: string;
  token2: string;
  threshold: number;
  cooldown: number;
}

export type TimePeriod = '5m' | '15m' | '1h' | '4h' | '1d';

export interface PriceData {
  id: string;
  chain: string;
  exchange: string;
  symbol: string;
  price: number;
  timestamp: number;
  spread?: number;
}

export interface RegionTaskProps {
  region: any;
  onClose: () => void;
  onSubmit: (task: Omit<TaskConfig, 'id' | 'last_alert'>) => void;
} 