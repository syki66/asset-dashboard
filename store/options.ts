import { create } from 'zustand';

interface AccountDateState {
  accountDate: Date;
  setAccountDate: (date: Date) => void;
}

export const useAccountDateStore = create<AccountDateState>((set) => ({
  accountDate: new Date(),
  setAccountDate: (date) => set({ accountDate: date }),
}));
