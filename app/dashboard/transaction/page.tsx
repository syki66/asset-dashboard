'use client';

import { StockPurchaseChart } from '@/components/chart';

export default function Page() {
  return (
    <>
      <StockPurchaseChart
        data={[
          { date: '2024-01-15', AAPL: 10, GOOGL: 5, MSFT: 8, TSLA: 3 },
          { date: '2024-01-16', AAPL: 15, GOOGL: 7, MSFT: 12, NVDA: 6 },
          { date: '2024-01-17', AAPL: 8, GOOGL: 10, TSLA: 15, NVDA: 4 },
          { date: '2024-01-18', MSFT: 20, TSLA: 8, NVDA: 12, AMZN: 5 },
          { date: '2024-01-19', AAPL: 12, GOOGL: 8, MSFT: 6, AMZN: 10 },
          { date: '2024-01-22', AAPL: 18, TSLA: 12, NVDA: 8, AMZN: 7 },
          { date: '2024-01-23', GOOGL: 15, MSFT: 10, TSLA: 6, NVDA: 14 },
          { date: '2024-01-24', AAPL: 22, GOOGL: 12, AMZN: 15, NVDA: 9 },
          { date: '2024-01-25', MSFT: 16, TSLA: 20, AMZN: 8, NVDA: 11 },
          { date: '2024-01-26', AAPL: 14, GOOGL: 18, MSFT: 13, TSLA: 7 },
        ]}
      />
    </>
  );
}
