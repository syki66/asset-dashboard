import { AccountProps, MergeAccountDataInput } from '@/types';
import { create } from 'zustand';
import { rateTable, worstRateTable } from '@/constants/keywords';

// 계좌 데이터 상태 관리
interface AccountState {
  totalAccountData: MergeAccountDataInput[];
  setTotalAccountData: (data: MergeAccountDataInput[]) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  totalAccountData: [],
  setTotalAccountData: (data) => set({ totalAccountData: data }),
}));

// 금리 테이블 상태 관리
interface InterestRateState {
  interestRates: { date: string; interestRate: number }[];
  worstInterestRates: { date: string; interestRate: number }[];
  setInterestRates: (rates: { date: string; interestRate: number }[]) => void;
  setWorstInterestRates: (rates: { date: string; interestRate: number }[]) => void;
}

export const useInterestRateStore = create<InterestRateState>((set) => ({
  interestRates: rateTable,
  worstInterestRates: worstRateTable,
  setInterestRates: (rates) => set({ interestRates: rates }),
  setWorstInterestRates: (rates) => set({ worstInterestRates: rates }),
}));
