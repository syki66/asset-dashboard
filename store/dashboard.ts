import { DEFAULT_FX_RATE } from '@/constants/keywords';
import { DashboardProps } from '@/types';
import { create } from 'zustand';

export const initialDashboardData: DashboardProps = {
  date: '1970-01-01',
  lastUpdated: '1970-01-01',
  fxRate: DEFAULT_FX_RATE,
  performance: {
    currentValue: 0,
    netCurrentValue: 0,
    principal: 0,
    profit: 0,
    netProfit: 0,
    returnRate: 0,
    netReturnRate: 0,
    cagr: 0,
    netCagr: 0,
    averageAnnualReturn: 0,
    netAverageAnnualReturn: 0,
    mwr: 0,
    netMwr: 0,
    twr: 0,
    netTwr: 0,
  },
  dividends: {
    annualDividends: 0,
    netAnnualDividends: 0,
    totalDividends: 0,
    netTotalDividends: 0,
    dividendYield: 0,
    netDividendYield: 0,
    yieldOnCost: 0,
    netYieldOnCost: 0,
  },
  cash: {
    total: 0,
    usdCash: 0,
    krwCash: 0,
  },
  costs: {
    totalCost: 0,
    krBrokerFee: 0,
    krRegulatoryFee: 0,
    krTransferTax: 0,
    usBrokerFee: 0,
    usSecFee: 0,
    usFxFee: 0,
    usTax: 0,
  },
  stocks: [],
  benchmarkBest: {
    value: 0,
    netValue: 0,
    profit: 0,
    netProfit: 0,
    returnRate: 0,
    netReturnRate: 0,
    cagr: 0,
    netCagr: 0,
    averageAnnualReturn: 0,
    netAverageAnnualReturn: 0,
    mwr: 0,
    netMwr: 0,
    twr: 0,
    netTwr: 0,
    excessReturn: 0,
    netExcessReturn: 0,
  },
  benchmarkWorst: {
    value: 0,
    netValue: 0,
    profit: 0,
    netProfit: 0,
    returnRate: 0,
    netReturnRate: 0,
    cagr: 0,
    netCagr: 0,
    averageAnnualReturn: 0,
    netAverageAnnualReturn: 0,
    mwr: 0,
    netMwr: 0,
    twr: 0,
    netTwr: 0,
    excessReturn: 0,
    netExcessReturn: 0,
  },
  drawdown: {
    maxDrawdown: 0,
    maxDrawdownStartDate: '1970-01-01',
    maxDrawdownEndDate: '1970-01-01',
    recoveryDuration: 0,
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
    netCurrentValue: [
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
    returnRate: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    netReturnRate: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkBestReturnRate: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkBestNetReturnRate: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkWorstReturnRate: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkWorstNetReturnRate: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    mwr: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    netMwr: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    twr: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    netTwr: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    cagr: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    netCagr: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    averageAnnualReturn: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    netAverageAnnualReturn: [
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
    dividendHistoryNet: [
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
    dividendYieldNet: [
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
    yieldOnCostNet: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkBest: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkBestNet: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkBestProfit: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkBestNetProfit: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkWorst: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkWorstNet: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkWorstProfit: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    benchmarkWorstNetProfit: [
      {
        date: '1970-01-01',
        value: 0,
      },
    ],
    stockTradeHistory: [],
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
