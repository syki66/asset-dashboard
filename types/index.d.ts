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
  dividend: DividendProps[];
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
};

export type Currency = 'krw' | 'usd';

export type StockHistoryProps = {
  date: string;
  close: number;
  adjClose: number;
  dividend?: number;
};
