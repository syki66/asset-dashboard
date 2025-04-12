import { AccountProps, DashboardProps } from '@/types';
import { create } from 'zustand';

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
  dashboardData: {};
  setDashboardData: (data: DashboardProps) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: {},
  setDashboardData: (data) => set({ dashboardData: data }),
}));
