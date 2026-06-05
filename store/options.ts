import { create } from 'zustand';

// 대시보드 표시 날짜 상태 관리
interface DashboardDateState {
  dashboardDate: Date;
  setDashboardDate: (date: Date) => void;
}

export const useDashboardDateStore = create<DashboardDateState>((set) => ({
  dashboardDate: new Date(),
  setDashboardDate: (date) => set({ dashboardDate: date }),
}));

// 환율 상태 관리
interface CurrencyState {
  currency: 'usd' | 'krw';
  setCurrency: (currency: 'usd' | 'krw') => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: 'krw',
  setCurrency: (currency) => set({ currency }),
}));

// 세전/세후 상태 관리
interface TaxState {
  tax: 'pre' | 'post';
  setTax: (tax: 'pre' | 'post') => void;
}

export const useTaxStore = create<TaxState>((set) => ({
  tax: 'pre',
  setTax: (tax) => set({ tax }),
}));

// 그래프 보기 모드 상태 관리
interface ChartLayoutState {
  chartLayout: 'expanded' | 'compact';
  setChartLayout: (layout: 'expanded' | 'compact') => void;
}

export const useChartLayoutStore = create<ChartLayoutState>((set) => ({
  chartLayout: 'expanded',
  setChartLayout: (chartLayout) => set({ chartLayout }),
}));
