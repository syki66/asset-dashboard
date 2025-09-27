import { DEFAULT_FX_RATE } from '@/constants/keywords';
import { DashboardProps } from '@/types';
import { create } from 'zustand';

const initialDashboardData: DashboardProps = {
  date: '1970-01-01', // 계좌 데이터 기준 날짜
  lastUpdated: '1970-01-01', // CSV 파일 업데이트 날짜
  fxRate: DEFAULT_FX_RATE, // 환율
  currentValue: 0, // 평가자산
  principal: 0, // 원금
  profit: 0, // 수익금
  netProfit: 0, // 순수익금
  returnRate: 0, // 수익률
  netReturnRate: 0, // 순수익률
  totalTaxFee: 0, // 총 비용 (세금 + 수수료)
  dividends: 0, // 배당금 (최근 1년)
  yieldOnCost: 0, // 원가 대비 배당수익률 (최근 1년)
  dividendYield: 0, // 평가금 대비 배당수익률 (최근 1년)
  cash: 0, // 현금 (원화 + 달러)
  usdCash: 0, // 달러 현금
  krwCash: 0, // 원화 현금
  benchmarkValue: 0, // 벤치마크 평가금
  maxDrawdown: 0, // 역대 최대 낙폭
  maxDrawdownPeriod: '1970-01-01 ~ 1970-01-01', // 역대 최대 낙폭 기간
  maxDailyDrawdown: 0, // 최대 일간 낙폭
  maxDailyDrawdownDate: '1970-01-01', // 최대 일간 낙폭 날짜
  principalChartData: [ // 원금 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  currentValueChartData: [ // 평가자산 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  profitChartData: [ // 수익금 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  netProfitChartData: [ // 세후 수익금 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  drawdownChartData: [ // 낙폭 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  dividendHistoryChartData: [ // 배당금 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  dividendYieldChartData: [ // 평가금 대비 배당수익률 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  yieldOnCostChartData: [ // 원가 대비 배당수익률 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  benchmarkChartData: [ // 벤치마크 평가금 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  benchmarkProfitChartData: [ // 벤치마크 수익금 차트 데이터
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
};

// 대시보드 데이터 상태 관리
interface DashboardState {
  dashboardData: DashboardProps;
  setDashboardData: (data: DashboardProps) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: initialDashboardData,
  setDashboardData: (data) => set({ dashboardData: data }),
}));
