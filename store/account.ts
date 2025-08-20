import { AccountProps, DashboardProps } from '@/types';
import { create } from 'zustand';
import { rateTable } from '@/constants/keywords';

// 계좌 데이터 상태 관리
interface AccountState {
  totalAccountData: { name: string; accountData: AccountProps[] }[];
  setTotalAccountData: (
    data: { name: string; accountData: AccountProps[] }[]
  ) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  totalAccountData: [],
  setTotalAccountData: (data) => set({ totalAccountData: data }),
}));

// 대시보드 데이터
interface DashboardState {
  dashboardData: DashboardProps;
  setDashboardData: (data: DashboardProps) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: {} as DashboardProps,
  setDashboardData: (data) => set({ dashboardData: data }),
}));

// 환율 상태 관리
interface CurrencyState {
  currency: string;
  setCurrency: (currency: string) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: 'krw',
  setCurrency: (currency) => set({ currency }),
}));

// 상세정보 토글 상태 관리
interface DetailToggleState {
  showDetail: boolean;
  toggleDetail: () => void;
  setShowDetail: (show: boolean) => void;
}

export const useDetailToggleStore = create<DetailToggleState>((set) => ({
  showDetail: false,
  toggleDetail: () => set((state) => ({ showDetail: !state.showDetail })),
  setShowDetail: (show) => set({ showDetail: show }),
}));

// 금리 테이블 상태 관리
interface InterestRateState {
  interestRates: { date: string; interestRate: number }[];
  setInterestRates: (rates: { date: string; interestRate: number }[]) => void;
}

export const useInterestRateStore = create<InterestRateState>((set) => ({
  interestRates: rateTable,
  setInterestRates: (rates) => set({ interestRates: rates }),
}));
