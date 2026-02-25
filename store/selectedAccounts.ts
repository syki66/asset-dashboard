import { create } from 'zustand';

interface SelectedAccountsState {
  selectedAccounts: string[];
  setSelectedAccounts: (accounts: string[]) => void;
}

export const useSelectedAccountsStore = create<SelectedAccountsState>(
  (set) => ({
    selectedAccounts: [],
    setSelectedAccounts: (accounts) => set({ selectedAccounts: accounts }),
  }),
);
