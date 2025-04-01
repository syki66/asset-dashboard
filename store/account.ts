import { AccountProps } from '@/types';
import { create } from 'zustand';

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
