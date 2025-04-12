'use client';

import { useState } from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Currency } from '@/types';
import { useCurrencyStore } from '@/store/account';

interface Stock {
  id: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  purchaseAmount: number;
  currentValue: number;
  profit: number;
  returnRate: number;
}

export function StockHoldings() {
  const currency = useCurrencyStore((state) => state.currency);

  // 실제 구현에서는 API나 상태 관리 라이브러리에서 데이터를 가져올 수 있습니다
  const stockData: Stock[] = [
    {
      id: '1',
      name: '삼성전자',
      quantity: 100,
      avgPrice: 70000,
      currentPrice: 75000,
      purchaseAmount: 7000000,
      currentValue: 7500000,
      profit: 500000,
      returnRate: 7.14,
    },
    {
      id: '2',
      name: '현대차',
      quantity: 20,
      avgPrice: 180000,
      currentPrice: 210000,
      purchaseAmount: 3600000,
      currentValue: 4200000,
      profit: 600000,
      returnRate: 16.67,
    },
    {
      id: '3',
      name: 'NAVER',
      quantity: 10,
      avgPrice: 350000,
      currentPrice: 320000,
      purchaseAmount: 3500000,
      currentValue: 3200000,
      profit: -300000,
      returnRate: -8.57,
    },
    {
      id: '4',
      name: '카카오',
      quantity: 50,
      avgPrice: 80000,
      currentPrice: 85000,
      purchaseAmount: 4000000,
      currentValue: 4250000,
      profit: 250000,
      returnRate: 6.25,
    },
    {
      id: '5',
      name: 'LG화학',
      quantity: 5,
      avgPrice: 700000,
      currentPrice: 750000,
      purchaseAmount: 3500000,
      currentValue: 3750000,
      profit: 250000,
      returnRate: 7.14,
    },
  ];

  const [sortColumn, setSortColumn] = useState<keyof Stock | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof Stock) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedStocks = [...stockData].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  const totalPurchase = stockData.reduce(
    (sum, stock) => sum + stock.purchaseAmount,
    0
  );
  const totalValue = stockData.reduce(
    (sum, stock) => sum + stock.currentValue,
    0
  );
  const totalProfit = stockData.reduce((sum, stock) => sum + stock.profit, 0);
  const totalReturnRate =
    totalPurchase > 0 ? (totalProfit / totalPurchase) * 100 : 0;

  // formatCurrency 함수 수정
  function formatCurrency(amount: number): string {
    if (currency === 'usd') {
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
        <CardTitle>주식 보유 현황 상세</CardTitle>
        <CardDescription>
          총 매수금액: {formatCurrency(totalPurchase)} | 총 평가금액:{' '}
          {formatCurrency(totalValue)} | 총 수익금:{' '}
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
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                보기 옵션 <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem checked>
                수익률 표시
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                매수금액 표시
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                평가금액 표시
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => handleSort('name')}
                  className="cursor-pointer"
                >
                  종목 <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('quantity')}
                  className="cursor-pointer text-right"
                >
                  수량 <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('avgPrice')}
                  className="cursor-pointer text-right"
                >
                  평균단가 <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('currentPrice')}
                  className="cursor-pointer text-right"
                >
                  현재가 <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('purchaseAmount')}
                  className="cursor-pointer text-right"
                >
                  매수금액 <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('currentValue')}
                  className="cursor-pointer text-right"
                >
                  평가금액 <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('profit')}
                  className="cursor-pointer text-right"
                >
                  수익금 <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('returnRate')}
                  className="cursor-pointer text-right"
                >
                  수익률 <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">{stock.name}</TableCell>
                  <TableCell className="text-right">
                    {stock.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(stock.avgPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(stock.currentPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(stock.purchaseAmount)}
                  </TableCell>
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
