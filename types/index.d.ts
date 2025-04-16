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
  lastUpdated: string;
  fxRate: number;
  krw: AccountDetails;
  usd: AccountDetails;
};

type AccountDetails = {
  principalAmount: number;
  dividends: DividendProps[];
  cash: number;
  stocksProfit: number;
  stocks: StockProps[];
};

export type DividendProps = {
  date: string;
  price: number;
  fxRate: number;
};

export type StockProps = {
  shortName: string;
  longName: string;
  symbol: string;
  code: string;
  balance: {
    date: string;
    price: number;
    fxRate: number;
  }[];
  price: number;
};

export type Currency = 'krw' | 'usd';

export type StockHistoryProps = {
  date: string;
  preSplitClose: number;
  close: number;
  adjClose: number;
  dividends?: number;
};

export type ChartProps = {
  date: string;
  value: number;
};

export type DashboardProps = {
  date: string;
  lastUpdated: string;
  fxRate: number;
  currentValue: number;
  principal: number;
  profit: number;
  returnRate: number;
  totalTaxFee: number;
  dividends: number;
  dividendYield: number;
  yieldOnCost: number;
  krwCash: number;
  usdCash: number;
  cash: number;
  maxDrawdown: number;
  maxDrawdownPeriod: string;
  maxDailyDrawdown: number;
  maxDailyDrawdownDate: string;
  principalChartData: ChartProps[];
  currentValueChartData: ChartProps[];
};
