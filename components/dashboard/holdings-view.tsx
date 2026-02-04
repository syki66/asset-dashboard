
'use client';

import { useMemo, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccountStore } from '@/store/account';
import { mergeAccountData } from '@/utils/converter';
import { SimpleHoldingsTable } from './simple-holdings-table';
import { DetailedHoldingsTable } from './detailed-holdings-table';
import { StockProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function HoldingsView({ themeColor }: { themeColor: string }) {
  const totalAccountData = useAccountStore((state) => state.totalAccountData);

  const stocks = useMemo(() => {
    if (!totalAccountData || totalAccountData.length === 0) {
      return [];
    }
    const merged = mergeAccountData(totalAccountData);
    if (!merged || merged.length === 0) {
      return [];
    }
    const lastEntry = merged[merged.length - 1];
    const allStocks: StockProps[] = [
      ...lastEntry.usd.stocks,
      ...lastEntry.krw.stocks,
    ];
    return allStocks;
  }, [totalAccountData]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>보유 주식</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="holdings-view-switch">자세히 보기</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
          <SimpleHoldingsTable stocks={stocks} themeColor={themeColor} />
      </CardContent>
    </Card>
  );
}
