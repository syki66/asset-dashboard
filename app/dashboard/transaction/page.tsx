'use client';

import {
  StockTradeChart,
  type StockTradeChartSummary,
} from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { useDashboardStore } from '@/store/dashboard';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Layers,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';

export default function Page() {
  const themeColor = 'var(--transaction-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  const { stockTradeHistory } = dashboardData.charts;
  const [tradeSummary, setTradeSummary] = useState<StockTradeChartSummary>({
    buyQuantity: 0,
    buyAmount: 0,
    sellQuantity: 0,
    sellAmount: 0,
    netQuantity: 0,
    netAmount: 0,
    buyStockCount: 0,
    sellStockCount: 0,
  });

  // 차트가 같은 요약값을 다시 전달해도 상단 카드의 불필요한 재렌더링은 막습니다.
  const handleSummaryChange = useCallback((summary: StockTradeChartSummary) => {
    setTradeSummary((current) =>
      current.buyQuantity === summary.buyQuantity &&
      current.buyAmount === summary.buyAmount &&
      current.sellQuantity === summary.sellQuantity &&
      current.sellAmount === summary.sellAmount &&
      current.netQuantity === summary.netQuantity &&
      current.netAmount === summary.netAmount &&
      current.buyStockCount === summary.buyStockCount &&
      current.sellStockCount === summary.sellStockCount
        ? current
        : summary,
    );
  }, []);
  const formatQuantity = (value: number) =>
    `${Math.round(value).toLocaleString()}주`;

  return (
    <>
      <div className='mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <DashboardOverviewCard
          title='총 매수'
          icon={ArrowUpRight}
          themeColor={themeColor}
          contentItems={[
            {
              label: '매수 수량',
              value: formatQuantity(tradeSummary.buyQuantity),
              valueClassName: 'text-rose-500',
            },
            {
              label: '매수 금액',
              value: formatCurrency(tradeSummary.buyAmount, currency),
              valueClassName: 'text-rose-500',
            },
          ]}
        />
        <DashboardOverviewCard
          title='총 매도'
          icon={ArrowDownRight}
          themeColor={themeColor}
          contentItems={[
            {
              label: '매도 수량',
              value: formatQuantity(tradeSummary.sellQuantity),
              valueClassName: 'text-blue-600',
            },
            {
              label: '매도 금액',
              value: formatCurrency(tradeSummary.sellAmount, currency),
              valueClassName: 'text-blue-600',
            },
          ]}
        />
        <DashboardOverviewCard
          title='매매 합계'
          icon={ArrowLeftRight}
          themeColor={themeColor}
          contentItems={[
            {
              label: '순매매 수량',
              value: `${tradeSummary.netQuantity > 0 ? '+' : ''}${formatQuantity(tradeSummary.netQuantity)}`,
            },
            {
              label: '순매매 금액',
              value: `${tradeSummary.netAmount > 0 ? '+' : ''}${formatCurrency(tradeSummary.netAmount, currency)}`,
            },
          ]}
        />
        <DashboardOverviewCard
          title='거래 종목'
          icon={Layers}
          themeColor={themeColor}
          contentItems={[
            {
              label: '매수 종목',
              value: `${tradeSummary.buyStockCount}개`,
              valueClassName: 'text-rose-500',
            },
            {
              label: '매도 종목',
              value: `${tradeSummary.sellStockCount}개`,
              valueClassName: 'text-blue-600',
            },
          ]}
        />
      </div>
      <div className='mt-8'>
        <h2 className='text-xl font-bold'>주식 매매 내역</h2>
      </div>
      <div className='mt-4'>
        <StockTradeChart
          title='주식 매수/매도 수량'
          description='각 날짜별로 매수(+)한 주식과 매도(-)한 주식을 확인합니다.'
          data={stockTradeHistory}
          themeColor={themeColor}
          onSummaryChange={handleSummaryChange}
        />
      </div>
    </>
  );
}
