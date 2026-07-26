
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SimpleHoldingsTable } from './simple-holdings-table';
import { DetailedHoldingsTable } from './detailed-holdings-table';
import { StockProps } from '@/types';
import { Boxes } from 'lucide-react';
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
    <Card className='chart-card glass-card'>
      <CardHeader className='p-3.5 sm:p-4 lg:p-6'>
        <div className='min-w-0 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-4'>
          <div className='flex min-h-9 items-center justify-between gap-2 sm:min-h-8 lg:contents'>
            <CardTitle className='flex min-w-0 items-center gap-2 text-lg leading-snug'>
              <Boxes className='h-5 w-5' style={{ color: themeColor }} />
              보유 주식
            </CardTitle>
            <Button
              type='button'
              variant='outline'
              size='sm'
              aria-pressed={isDetailed}
              onClick={() => setIsDetailed((current) => !current)}
              className='interactive-lift h-9 shrink-0 cursor-pointer gap-1.5 rounded-md border-white/15 bg-white/[0.04] px-3 text-xs font-semibold shadow-sm hover:bg-white/[0.1] hover:text-foreground sm:h-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center lg:text-sm'
              style={
                isDetailed
                  ? {
                      backgroundColor: themeColor,
                      borderColor: themeColor,
                      color: '#fff',
                    }
                  : undefined
              }
            >
              <span className='whitespace-nowrap'>자세히 보기</span>
              <span
                className={
                  isDetailed
                    ? 'text-[10px] text-white/80 lg:text-xs'
                    : 'text-[10px] lg:text-xs'
                }
                style={isDetailed ? undefined : { color: themeColor }}
              >
                {isDetailed ? 'ON' : 'OFF'}
              </span>
            </Button>
          </div>
          <CardDescription className='mt-1 lg:col-start-1 lg:row-start-2'>
            평가금액은 선택 날짜의 환율, 매수금액과 평균단가는 매수 당시
            환율을 기준으로 표시합니다.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='px-2 pb-4 sm:px-4'>
        {isDetailed ? (
          <DetailedHoldingsTable stocks={stocks} themeColor={themeColor} />
        ) : (
          <SimpleHoldingsTable stocks={stocks} themeColor={themeColor} />
        )}
      </CardContent>
    </Card>
  );
}
