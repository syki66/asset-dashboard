import { DEFAULT_FX_RATE } from '@/constants/keywords';
import { DashboardProps } from '@/types';
import { create } from 'zustand';

const initialDashboardData: DashboardProps = {
  date: '1970-01-01',
  lastUpdated: '1970-01-01',
  fxRate: DEFAULT_FX_RATE,
  currentValue: 0,
  principal: 0,
  profit: 0,
  returnRate: 0,
  totalTaxFee: 0,
  dividends: 0,
  yieldOnCost: 0,
  dividendYield: 0,
  cash: 0,
  usdCash: 0,
  krwCash: 0,
  benchmarkValue: 0,
  maxDrawdown: 0,
  maxDrawdownPeriod: '1970-01-01 ~ 1970-01-01',
  maxDailyDrawdown: 0,
  maxDailyDrawdownDate: '1970-01-01',
  principalChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  currentValueChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  profitChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  drawdownChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  dividendHistoryChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  dividendYieldChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  yieldOnCostChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  benchmarkChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  benchmarkProfitChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  profitAfterTaxChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
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
