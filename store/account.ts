import { AccountProps } from '@/types';
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

// 금리 테이블 상태 관리
interface InterestRateState {
  interestRates: { date: string; interestRate: number }[];
  setInterestRates: (rates: { date: string; interestRate: number }[]) => void;
}

export const useInterestRateStore = create<InterestRateState>((set) => ({
  interestRates: rateTable,
  setInterestRates: (rates) => set({ interestRates: rates }),
}));
