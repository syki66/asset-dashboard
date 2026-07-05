'use client';

import { StockTradeChart } from '@/components/chart';
import { useDashboardStore } from '@/store/dashboard';

export default function Page() {
  const themeColor = 'var(--transaction-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);

  const { stockTradeHistory } = dashboardData.charts;

  return (
    <>
      <StockTradeChart
        title='주식 매수/매도 수량'
        description='각 날짜별로 매수(+)한 주식과 매도(-)한 주식을 확인합니다.'
        data={stockTradeHistory}
        themeColor={themeColor}
      />
    </>
  );
}
