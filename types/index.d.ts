export type transactionProps = {
  date: string;
  type: string;
  currency: string;
  ISIN: string;
  quantity: number;
  price: number;
  krwCash: number;
  usdCash: number;
};

export type AccountProps = {
  date: string;
  fxRate: number;
  krw: AccountDetails;
  usd: AccountDetails;
};

type AccountDetails = {
  principalAmount: number;
  dividends: DividendProps[];
  cash: number;
  stocks: StockProps[];
};

export type StockProps = {
  shortName: string;
  longName: string;
  symbol: string;
  code: string;
  balance: number[];
  price: number;
};

export type DividendProps = {
  date: string;
  price: number;
  fxRate: number;
};

export type Currency = 'krw' | 'usd';

export type StockHistoryProps = {
  date: string;
  close: number;
  adjClose: number;
  dividends?: number;
};

export type DashboardProps = {
  date: string;
  lastUpdated: string;
  fxRate: number;
  currentValue: number;
  principal: number;
  profit: number;
  returnRate: number;
  dividends: number;
  dividendYield: number;
  yieldOnCost: number;
  krwCash: number;
  usdCash: number;
  cash: number;
  maxDrawdown: number;
  maxDailyDrawdown: number;
  maxDrawdownDate: string;
  maxDailyDrawdownDate: string;
};
