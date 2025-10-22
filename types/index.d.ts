export type TransactionProps = {
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
  benchmarkNetValue: number;
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
  date: string; // 계좌 데이터 기준 날짜
  lastUpdated: string; // CSV 파일 업데이트 날짜
  fxRate: number; // 환율
  performance: {
    currentValue: number; // 평가자산
    netCurrentValue: number; // 순평가자산
    principal: number; // 원금
    profit: number; // 수익금
    netProfit: number; // 순수익금
    returnRate: number; // 수익률
    netReturnRate: number; // 순수익률
    cagr: number; // 연평균 성장률
    netCagr: number; // 순 연평균 성장률
  };
  dividends: {
    amount: number; // 배당금 (최근 1년)
    dividendYield: number; // 평가금 대비 배당수익률 (최근 1년)
    yieldOnCost: number; // 원가 대비 배당수익률 (최근 1년)
  };
  cash: {
    total: number; // 현금 (원화 + 달러)
    usdCash: number; // 달러 현금
    krwCash: number; // 원화 현금
  };
  costs: {
    totalCost: number; // 총 비용 (세금 + 수수료)
  };
  benchmark: {
    netValue: number; // 벤치마크 평가금 (세후)
    netProfit: number; // 벤치마크 수익금 (세후)
    netReturnRate: number; // 벤치마크 수익률 (세후)
    netCagr: number; // 벤치마크 연평균 성장률 (세후)
    netExcessReturn: number; // 벤치마크 초과수익률 (세후)
  };
  drawdown: {
    maxDrawdown: number; // 역대 최대 낙폭
    maxDrawdownPeriod: string; // 역대 최대 낙폭 기간
    maxDailyDrawdown: number; // 최대 일간 낙폭
    maxDailyDrawdownDate: string; // 최대 일간 낙폭 날짜
  };
  charts: {
    principal: ChartProps[]; // 원금 차트
    currentValue: ChartProps[]; // 평가자산 차트
    profit: ChartProps[]; // 수익금 차트
    netProfit: ChartProps[]; // 세후 수익금 차트
    drawdown: ChartProps[]; // 낙폭 차트
    dividendHistory: ChartProps[]; // 배당금 차트
    dividendYield: ChartProps[]; // 평가금 대비 배당수익률 차트
    yieldOnCost: ChartProps[]; // 원가 대비 배당수익률 차트
    benchmark: ChartProps[]; // 벤치마크 평가금 차트
    benchmarkProfit: ChartProps[]; // 벤치마크 수익금 차트
  };
};

export type TermsProps = {
  startDate: string;
  maturityDate: string;
  principal: number;
  interest: number;
  interestRate: number;
};
