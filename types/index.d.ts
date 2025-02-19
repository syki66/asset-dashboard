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

type AccountDetails = {
  principalAmount: number;
  dividend: {
    date: string;
    price: number;
  }[];
  cash: number;
  stocks: {
    name: string;
    code: string;
    balance: number[];
    price: number;
  }[];
};

export type AccountProps = {
  date: string;
  fxRate: number;
  krw: AccountDetails;
  usd: AccountDetails;
};

export type Currency = 'krw' | 'usd';

export type StockProps = {
  date: string;
  close: number;
  adjClose: number;
  dividend?: number;
};
