'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StockHoldingsSummaryProps {
  currency: 'KRW' | 'USD';
}

export function StockHoldingsSummary({ currency }: StockHoldingsSummaryProps) {
  // 실제 구현에서는 API나 상태 관리 라이브러리에서 데이터를 가져올 수 있습니다
  const stockData = [
    {
      id: '1',
      name: '삼성전자',
      currentValue: 7500000,
      profit: 500000,
      returnRate: 7.14,
    },
    {
      id: '2',
      name: '현대차',
      currentValue: 4200000,
      profit: 600000,
      returnRate: 16.67,
    },
    {
      id: '3',
      name: 'NAVER',
      currentValue: 3200000,
      profit: -300000,
      returnRate: -8.57,
    },
    {
      id: '4',
      name: '카카오',
      currentValue: 4250000,
      profit: 250000,
      returnRate: 6.25,
    },
    {
      id: '5',
      name: 'LG화학',
      currentValue: 3750000,
      profit: 250000,
      returnRate: 7.14,
    },
  ];

  const totalValue = stockData.reduce(
    (sum, stock) => sum + stock.currentValue,
    0
  );
  const totalProfit = stockData.reduce((sum, stock) => sum + stock.profit, 0);
  const totalReturnRate =
    totalValue > 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;

  // formatCurrency 함수 수정
  function formatCurrency(amount: number): string {
    if (currency === 'USD') {
      // KRW에서 USD로 변환 (1350 KRW = 1 USD 가정)
      const usdValue = amount / 1350;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(usdValue);
    } else {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(amount);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>주식 보유 현황 요약</CardTitle>
        <CardDescription>
          총 평가금액: {formatCurrency(totalValue)} | 총 수익금:{' '}
          <span className={totalProfit >= 0 ? 'text-red-600' : 'text-blue-600'}>
            {formatCurrency(totalProfit)}
          </span>{' '}
          | 총 수익률:{' '}
          <span
            className={totalReturnRate >= 0 ? 'text-red-600' : 'text-blue-600'}
          >
            {totalReturnRate.toFixed(2)}%
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종목</TableHead>
                <TableHead className="text-right">평가금액</TableHead>
                <TableHead className="text-right">수익금</TableHead>
                <TableHead className="text-right">수익률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockData.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">{stock.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(stock.currentValue)}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      stock.profit >= 0 ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    {formatCurrency(stock.profit)}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      stock.returnRate >= 0 ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    {stock.returnRate.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
