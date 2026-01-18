'use client';

import { StockPurchaseChart } from '@/components/chart';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';

export default function Page() {
  const themeColor = 'var(--transaction-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  const { stockBuyHistory } = dashboardData.charts;

  return (
    <>
      <StockPurchaseChart data={stockBuyHistory} />
    </>
  );
}
