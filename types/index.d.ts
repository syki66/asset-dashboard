export type TransactionProps = {
  date: string;
  type: string;
  currency: string;
  ISIN: string;
  quantity: number;
  price: number;
  krwCash: number;
  usdCash: number;
  dividendSource?: 'domestic' | 'foreign';
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
  stockTradeHistory: StockTradeHistoryProps[];
  benchmarkValue: number;
  benchmarkNetValue: number;
  benchmarkWorstValue: number;
  benchmarkWorstNetValue: number;
};

export type DividendProps = {
  date: string;
  price: number;
  fxRate: number;
  dividendSource?: 'domestic' | 'foreign';
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

export type StockTradeHistoryProps = {
  date: string;
  type: 'buy' | 'sell';
  fxRate: number;
  pricesBySymbol: Record<string, number[]>; // 종목별 거래 가격 배열
};

export type StockTradeHistoryChartProps = {
  date: string;
  type: 'buy' | 'sell'; // 종목 매매 타입 추가
  quantityBySymbol: Record<string, number>; // 종목별 거래 수량 합계
  priceBySymbol: Record<string, number>; // 종목별 거래 가격 합계
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
    averageAnnualReturn: number; // 단순 연평균 수익률
    netAverageAnnualReturn: number; // 순 단순 연평균 수익률
    mwr: number; // 금액가중수익률
    netMwr: number; // 순 금액가중수익률
    twr: number; // 시간가중수익률
    netTwr: number; // 순 시간가중수익률
  };
  dividends: {
    annualDividends: number; // 배당금 (최근 1년)
    netAnnualDividends: number; // 순배당금 (최근 1년)
    totalDividends: number; // 배당금 (누적)
    netTotalDividends: number; // 순배당금 (누적)
    dividendYield: number; // 평가금 대비 배당수익률 (최근 1년)
    netDividendYield: number; // 순배당률 (최근 1년)
    yieldOnCost: number; // 원가 대비 배당수익률 (최근 1년)
    netYieldOnCost: number; // 순원가 대비 배당수익률 (최근 1년)
  };
  cash: {
    total: number; // 현금 (원화 + 달러)
    usdCash: number; // 달러 현금
    krwCash: number; // 원화 현금
  };
  costs: {
    totalCost: number; // 총 비용 (세금 + 수수료)
    krBrokerFee: number; // 한국주식 증권사 거래수수료
    krRegulatoryFee: number; // 한국주식 유관기관수수료
    krTransferTax: number; // 한국주식 증권거래세
    usBrokerFee: number; // 미국주식 증권사 거래수수료
    usSecFee: number; // 미국 SEC 수수료
    usFxFee: number; // 환전 수수료
    usTax: number; // 미국주식 양도소득세
  };
  stocks: StockProps[]; // 보유 주식 목록 (환전 처리된 값)
  benchmark: {
    value: number; // 벤치마크 평가금
    netValue: number; // 벤치마크 평가금 (세후)
    profit: number; // 벤치마크 수익금
    netProfit: number; // 벤치마크 수익금 (세후)
    returnRate: number; // 벤치마크 수익률
    netReturnRate: number; // 벤치마크 수익률 (세후)
    cagr: number; // 벤치마크 연평균 성장률
    netCagr: number; // 벤치마크 연평균 성장률 (세후)
    averageAnnualReturn: number; // 벤치마크 단순 연평균 수익률
    netAverageAnnualReturn: number; // 벤치마크 단순 연평균 수익률 (세후)
    mwr: number; // 벤치마크 금액가중수익률
    netMwr: number; // 벤치마크 금액가중수익률 (세후)
    twr: number; // 벤치마크 시간가중수익률
    netTwr: number; // 벤치마크 시간가중수익률 (세후)
    excessReturn: number; // 벤치마크 초과수익률
    netExcessReturn: number; // 벤치마크 초과수익률 (세후)
  };
  benchmarkWorst: {
    value: number; // 최악의 벤치마크 평가금
    netValue: number; // 최악의 벤치마크 평가금 (세후)
    profit: number; // 최악의 벤치마크 수익금
    netProfit: number; // 최악의 벤치마크 수익금 (세후)
    returnRate: number; // 최악의 벤치마크 수익률
    netReturnRate: number; // 최악의 벤치마크 수익률 (세후)
    cagr: number; // 최악의 벤치마크 연평균 성장률
    netCagr: number; // 최악의 벤치마크 연평균 성장률 (세후)
    averageAnnualReturn: number; // 최악의 벤치마크 단순 연평균 수익률
    netAverageAnnualReturn: number; // 최악의 벤치마크 단순 연평균 수익률 (세후)
    mwr: number; // 최악의 벤치마크 금액가중수익률
    netMwr: number; // 최악의 벤치마크 금액가중수익률 (세후)
    twr: number; // 최악의 벤치마크 시간가중수익률
    netTwr: number; // 최악의 벤치마크 시간가중수익률 (세후)
    excessReturn: number; // 최악의 벤치마크 초과수익률
    netExcessReturn: number; // 최악의 벤치마크 초과수익률 (세후)
  };
  drawdown: {
    maxDrawdown: number; // 역대 최대 낙폭
    maxDrawdownStartDate: string; // 역대 최대 낙폭 시작일
    maxDrawdownEndDate: string; // 역대 최대 낙폭 종료일
    recoveryDuration: number; // 회복 기간 (일)
    maxDailyDrawdown: number; // 최대 일간 낙폭
    maxDailyDrawdownDate: string; // 최대 일간 낙폭 날짜
  };
  charts: {
    principal: ChartProps[]; // 원금 차트
    currentValue: ChartProps[]; // 평가자산 차트
    netCurrentValue: ChartProps[]; // 세후 평가자산 차트
    profit: ChartProps[]; // 수익금 차트
    netProfit: ChartProps[]; // 세후 수익금 차트
    returnRate: ChartProps[]; // 누적수익률 차트
    netReturnRate: ChartProps[]; // 세후 누적수익률 차트
    benchmarkReturnRate: ChartProps[]; // 벤치마크 누적수익률 차트
    benchmarkNetReturnRate: ChartProps[]; // 세후 벤치마크 누적수익률 차트
    benchmarkWorstReturnRate: ChartProps[]; // 최악의 벤치마크 누적수익률 차트
    benchmarkWorstNetReturnRate: ChartProps[]; // 세후 최악의 벤치마크 누적수익률 차트
    mwr: ChartProps[]; // 금액가중수익률 차트
    netMwr: ChartProps[]; // 세후 금액가중수익률 차트
    twr: ChartProps[]; // 시간가중수익률 차트
    netTwr: ChartProps[]; // 세후 시간가중수익률 차트
    cagr: ChartProps[]; // 복리연평균수익률 차트
    netCagr: ChartProps[]; // 세후 복리연평균수익률 차트
    averageAnnualReturn: ChartProps[]; // 단순연평균수익률 차트
    netAverageAnnualReturn: ChartProps[]; // 세후 단순연평균수익률 차트
    drawdown: ChartProps[]; // 낙폭 차트
    dividendHistory: ChartProps[]; // 배당금 차트
    dividendHistoryNet: ChartProps[]; // 세후 배당금 차트
    dividendYield: ChartProps[]; // 평가금 대비 배당수익률 차트
    dividendYieldNet: ChartProps[]; // 세후 평가금 대비 배당수익률 차트
    yieldOnCost: ChartProps[]; // 원가 대비 배당수익률 차트
    yieldOnCostNet: ChartProps[]; // 세후 원가 대비 배당수익률 차트
    benchmark: ChartProps[]; // 벤치마크 평가금 차트
    benchmarkNet: ChartProps[]; // 세후 벤치마크 평가금 차트
    benchmarkProfit: ChartProps[]; // 벤치마크 수익금 차트
    benchmarkNetProfit: ChartProps[]; // 세후 벤치마크 수익금 차트
    benchmarkWorst: ChartProps[]; // 최악의 벤치마크 평가금 차트
    benchmarkWorstNet: ChartProps[]; // 세후 최악의 벤치마크 평가금 차트
    benchmarkWorstProfit: ChartProps[]; // 최악의 벤치마크 수익금 차트
    benchmarkWorstNetProfit: ChartProps[]; // 세후 최악의 벤치마크 수익금 차트
    stockTradeHistory: StockTradeHistoryChartProps[]; // 매수 및 매도 주식 통합 히스토리
  };
};

export type TermsProps = {
  startDate: string;
  maturityDate: string;
  principal: number;
  interest: number;
  interestRate: number;
};

export type MergeAccountDataInput = {
  name: string;
  accountData: AccountProps[];
  benchmarkData?: {
    date: string;
    benchmarkValueKrw: number;
    benchmarkValueUsd: number;
    benchmarkNetValueKrw: number;
    benchmarkNetValueUsd: number;
  }[];
  benchmarkWorstData?: {
    date: string;
    benchmarkValueKrw: number;
    benchmarkValueUsd: number;
    benchmarkNetValueKrw: number;
    benchmarkNetValueUsd: number;
  }[];
};
