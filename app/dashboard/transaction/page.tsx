'use client';

import { StockPurchaseChart } from '@/components/chart';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';

export default function Page() {
  const themeColor = 'var(--transaction-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  const { stockBuyHistory, stockSellHistory } = dashboardData.charts;

  return (
    <>
      <StockPurchaseChart data={stockBuyHistory} />
      <StockPurchaseChart
        title='일별 주식 매도 수량'
        data={stockSellHistory}
        themeColor={themeColor}
      />
    </>
  );
}
