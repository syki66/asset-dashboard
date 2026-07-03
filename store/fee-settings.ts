import {
  EXCHANGE_FEE_RATE,
  EXCHANGE_SPREAD_RATE,
  KR_BROKER_FEE_RATE,
  KR_DIVIDEND_TAX_RATE,
  KR_REGULATORY_FEE_RATE,
  KR_TRANSFER_TAX_RATE,
  US_BROKER_FEE_RATE,
  US_CAPITAL_GAINS_TAX_RATE,
  US_DIVIDEND_TAX_RATE,
  US_SEC_FEE_RATE,
} from '@/constants/keywords';
import { create } from 'zustand';

export type FeeSettings = {
  exchangeSpreadRate: number;
  exchangeFeeRate: number;
  krBrokerFeeRate: number;
  krRegulatoryFeeRate: number;
  krTransferTaxRate: number;
  usBrokerFeeRate: number;
  usCapitalGainsTaxRate: number;
  usSecFeeRate: number;
  usDividendTaxRate: number;
  krDividendTaxRate: number;
};

export const defaultFeeSettings: FeeSettings = {
  exchangeSpreadRate: EXCHANGE_SPREAD_RATE,
  exchangeFeeRate: EXCHANGE_FEE_RATE,
  krBrokerFeeRate: KR_BROKER_FEE_RATE,
  krRegulatoryFeeRate: KR_REGULATORY_FEE_RATE,
  krTransferTaxRate: KR_TRANSFER_TAX_RATE,
  usBrokerFeeRate: US_BROKER_FEE_RATE,
  usCapitalGainsTaxRate: US_CAPITAL_GAINS_TAX_RATE,
  usSecFeeRate: US_SEC_FEE_RATE,
  usDividendTaxRate: US_DIVIDEND_TAX_RATE,
  krDividendTaxRate: KR_DIVIDEND_TAX_RATE,
};

type FeeSettingsState = {
  feeSettings: FeeSettings;
  setFeeSetting: (key: keyof FeeSettings, value: number) => void;
  resetFeeSettings: () => void;
};

export const useFeeSettingsStore = create<FeeSettingsState>((set) => ({
  feeSettings: defaultFeeSettings,
  setFeeSetting: (key, value) =>
    set((state) => ({
      feeSettings: {
        ...state.feeSettings,
        [key]: value,
      },
    })),
  resetFeeSettings: () => set({ feeSettings: defaultFeeSettings }),
}));
