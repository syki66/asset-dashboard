import { DEFAULT_FX_RATE } from '@/constants/keywords';
import { DashboardProps } from '@/types';
import { create } from 'zustand';

const initialDashboardData: DashboardProps = {
  date: '1970-01-01',
  lastUpdated: '1970-01-01',
  fxRate: DEFAULT_FX_RATE,
  performance: {
    currentValue: 0,
    principal: 0,
    profit: 0,
    netProfit: 0,
    returnRate: 0,
    netReturnRate: 0,
  },
  dividends: {
    amount: 0,
    dividendYield: 0,
    yieldOnCost: 0,
  },
  cash: {
    total: 0,
    usdCash: 0,
    krwCash: 0,
  },
  costs: {
    totalCost: 0,
  },
  benchmark: {
    netValue: 0,
    netProfit: 0,
    netReturnRate: 0,
  },
  drawdown: {
    maxDrawdown: 0,
    maxDrawdownPeriod: '1970-01-01 ~ 1970-01-01',
    maxDailyDrawdown: 0,
    maxDailyDrawdownDate: '1970-01-01',
  },
  charts: {
    principal: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    currentValue: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    profit: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    netProfit: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    drawdown: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    dividendHistory: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    dividendYield: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    yieldOnCost: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmark: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkProfit: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
  },
};

// 대시보드 데이터 상태 관리
interface DashboardState {
  dashboardData: DashboardProps;
  setDashboardData: (data: DashboardProps) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: initialDashboardData,
  setDashboardData: (data) => set({ dashboardData: data }),
}));
