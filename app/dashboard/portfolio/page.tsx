'use client';

import { PortfolioAllocationChart } from '@/components/chart';
import { HoldingsView } from '@/components/dashboard/holdings-view';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';

export default function Page() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  return (
    <>
      <div>
        <PortfolioAllocationChart
          stocks={dashboardData.stocks}
          // cash={dashboardData.cash.total}
          themeColor='var(--portfolio-theme)'
        />
      </div>
      <div className='mt-8'>
        <HoldingsView
          stocks={dashboardData.stocks}
          themeColor='var(--portfolio-theme)'
        />
      </div>
    </>
  );
}
