import { format, subMonths, subDays, subHours } from 'date-fns';

export type TimePeriod = '1d' | '1w' | '1m' | '6m';
export type LockPeriod = '1' | '3' | '6' | '12';

interface PriceData {
  time: string;
  price: number;
}

// 基准 APY
const BASE_APY = 8.5;

// APY 调整系数
const APY_MULTIPLIERS: Record<LockPeriod, number> = {
  '1': 0.8,  // 1个月
  '3': 1.0,  // 3个月
  '6': 1.2,  // 6个月
  '12': 1.5, // 12个月
};

// 根据时间周期生成价格数据
export const generatePriceData = (period: TimePeriod): PriceData[] => {
  const now = new Date();
  const basePrice = 985;
  const priceRange = 125;

  switch (period) {
    case '1d': {
      return Array.from({ length: 24 }, (_, i) => {
        const time = subHours(now, 23 - i);
        return {
          time: format(time, 'HH:00'),
          price: basePrice + Math.random() * priceRange,
        };
      });
    }
    case '1w': {
      return Array.from({ length: 7 }, (_, i) => {
        const time = subDays(now, 6 - i);
        return {
          time: format(time, 'MM-dd'),
          price: basePrice + Math.random() * priceRange,
        };
      });
    }
    case '1m': {
      return Array.from({ length: 30 }, (_, i) => {
        const time = subDays(now, 29 - i);
        return {
          time: format(time, 'MM-dd'),
          price: basePrice + Math.random() * priceRange,
        };
      });
    }
    case '6m': {
      return Array.from({ length: 6 }, (_, i) => {
        const time = subMonths(now, 5 - i);
        return {
          time: format(time, 'yyyy-MM'),
          price: basePrice + Math.random() * priceRange,
        };
      });
    }
  }
};

// 计算年化收益率
export const calculateAPY = (lockPeriod: LockPeriod): number => {
  return BASE_APY * APY_MULTIPLIERS[lockPeriod];
};

// 计算预期收益
export const calculateExpectedReturn = (amount: number, lockPeriod: LockPeriod): number => {
  const apy = calculateAPY(lockPeriod);
  const periodInYears = parseInt(lockPeriod) / 12;
  return amount * (apy / 100) * periodInYears;
};

// 计算到期总值
export const calculateTotalAtMaturity = (amount: number, lockPeriod: LockPeriod): number => {
  const expectedReturn = calculateExpectedReturn(amount, lockPeriod);
  return amount + expectedReturn;
}; 