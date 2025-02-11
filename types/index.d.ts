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
  withdrawKRW: number;
  depositKRW: number;
  withdrawUSD: number;
  depositUSD: number;
  stocks: { [isin: string]: number[] };
};
