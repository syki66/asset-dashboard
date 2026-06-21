
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SimpleHoldingsTable } from './simple-holdings-table';
import { DetailedHoldingsTable } from './detailed-holdings-table';
import { StockProps } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

export function HoldingsView({ stocks, themeColor }: { stocks: StockProps[]; themeColor: string }) {
  const [isDetailed, setIsDetailed] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>보유 주식</CardTitle>
            <CardDescription className='mt-1'>
              평가금액은 선택 날짜의 환율, 매수금액과 평균단가는 매수 당시
              환율을 기준으로 표시합니다.
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="holdings-view-switch"
              checked={isDetailed}
              onCheckedChange={setIsDetailed}
              style={{ '--switch-bg': themeColor } as React.CSSProperties}
            />
            <Label htmlFor="holdings-view-switch">자세히 보기</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isDetailed ? (
          <DetailedHoldingsTable stocks={stocks} themeColor={themeColor} />
        ) : (
          <SimpleHoldingsTable stocks={stocks} themeColor={themeColor} />
        )}
      </CardContent>
    </Card>
  );
}
