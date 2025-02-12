export type transactionTypeProps = {
  date: string;
  type: string;
  currency: string;
  ISIN: string;
  quantity: number;
  price: number;
  krwDeposit: number;
  usdDeposit: number;
};

export type AccountTypeProps = {
  date: string;
  krw: {
    deposit: number;
    withdrawal: number;
    dividend: {
      year: number;
      price: number;
    }[];
    cash: number;
  };
  usd: {
    deposit: number;
    withdrawal: number;
    dividend: {
      year: number;
      price: number;
    }[];
    cash: number;
  };
  stocks: { [isin: string]: number[] };
};
