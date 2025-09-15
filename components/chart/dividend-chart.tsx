'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCurrencyStore } from '@/store/account';

interface DividendData {
  date: string;
  value: number;
}

interface DividendChartProps {
  data: DividendData[];
}

type TimeRange = 'YTD' | '1Y' | '3Y' | '5Y' | '10Y' | 'MAX';

export function DividendChart({ data }: DividendChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('YTD');

  const currency = useCurrencyStore((state) => state.currency);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 날짜순으로 정렬
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const now = new Date();
    let startDate: Date;

    switch (selectedRange) {
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1); // 올해 1월 1일부터
        break;
      case '1Y':
        startDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        break;
      case '3Y':
        startDate = new Date(
          now.getFullYear() - 3,
          now.getMonth(),
          now.getDate()
        );
        break;
      case '5Y':
        startDate = new Date(
          now.getFullYear() - 5,
          now.getMonth(),
          now.getDate()
        );
        break;
      case '10Y':
        startDate = new Date(
          now.getFullYear() - 10,
          now.getMonth(),
          now.getDate()
        );
        break;
      case 'MAX':
        startDate = new Date(0); // 모든 데이터
        break;
    }

    const filteredData = sortedData.filter(
      (item) => new Date(item.date) >= startDate
    );

    // 데이터 집계
    const aggregatedData = new Map<string, number>();

    filteredData.forEach((item) => {
      const date = new Date(item.date);
      let key: string;

      switch (selectedRange) {
        case 'YTD':
        case '1Y':
          // 월별 집계
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            '0'
          )}`;
          break;
        case '3Y':
          // 분기별 집계
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case '5Y':
        case '10Y':
        case 'MAX':
          // 연도별 집계
          key = `${date.getFullYear()}`;
          break;
      }

      aggregatedData.set(key, (aggregatedData.get(key) || 0) + item.value);
    });

    if (selectedRange === 'YTD') {
      // 올해 1월부터 현재 월까지의 월 키를 생성
      const ytdMonths = [];
      for (let i = 0; i <= now.getMonth(); i++) {
        const monthDate = new Date(now.getFullYear(), i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(
          monthDate.getMonth() + 1
        ).padStart(2, '0')}`;
        ytdMonths.push({
          period: monthKey,
          total: aggregatedData.get(monthKey) || 0,
          formatted: (aggregatedData.get(monthKey) || 0).toLocaleString(
            'ko-KR'
          ),
        });
      }
      return ytdMonths;
    }

    if (selectedRange === '1Y') {
      // 최근 12개월의 월 키를 생성
      const last12Months = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(
          monthDate.getMonth() + 1
        ).padStart(2, '0')}`;
        last12Months.push({
          period: monthKey,
          total: aggregatedData.get(monthKey) || 0,
          formatted: (aggregatedData.get(monthKey) || 0).toLocaleString(
            'ko-KR'
          ),
        });
      }
      return last12Months;
    }

    // 차트 데이터 형식으로 변환
    const finalData = Array.from(aggregatedData.entries())
      .map(([period, total]) => ({
        period,
        total,
        formatted: total.toLocaleString('ko-KR'),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
    return finalData;
  }, [data, selectedRange]);

  const formatTooltipValue = (value: number) => {
    return `${currency === 'usd' ? '$' : '₩'}${value.toLocaleString('ko-KR')}`;
  };

  // 기간 문자열을 한국어 형식으로 변환 (예: 2024-03 -> 2024년 3월, 2024 -> 2024년, 2024-Q1 -> 2024년 Q1분기)
  const formatPeriodLabel = (period: string | number) => {
    if (typeof period !== 'string') return String(period);
    // YYYY-MM
    const ymMatch = period.match(/^(\d{4})-(\d{2})$/);
    if (ymMatch) {
      const year = ymMatch[1];
      const month = String(Number(ymMatch[2]));
      return `${year}년 ${month}월`;
    }
    // YYYY-Qn
    const qMatch = period.match(/^(\d{4})-Q(\d)$/);
    if (qMatch) {
      const year = qMatch[1];
      const q = qMatch[2];
      return `${year}년 ${q}분기`;
    }
    // YYYY
    const yMatch = period.match(/^(\d{4})$/);
    if (yMatch) {
      return `${period}년`;
    }
    return period;
  };

  const getChartTitle = () => {
    switch (selectedRange) {
      case 'YTD':
        return '월별 배당 수익 (올해)';
      case '1Y':
        return '월별 배당 수익 (최근 12개월)';
      case '3Y':
        return '분기별 배당 수익';
      case '5Y':
      case '10Y':
      case 'MAX':
        return '연도별 배당 수익';
    }
  };

  const getDescription = () => {
    const totalDividend = processedData.reduce(
      (sum, item) => sum + item.total,
      0
    );
    return `총 배당 수익: ${
      currency === 'usd' ? '$' : '₩'
    }${totalDividend.toLocaleString('ko-KR')}`;
  };

  return (
    <Card className="w-full bg-linear-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-amber-900 dark:text-amber-100">
              {getChartTitle()}
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300 font-medium">
              {getDescription()}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['YTD', '1Y', '3Y', '5Y', '10Y', 'MAX'] as TimeRange[]).map(
              (range) => (
                <Button
                  key={range}
                  variant={selectedRange === range ? 'default' : 'outline-solid'}
                  size="sm"
                  onClick={() => setSelectedRange(range)}
                  className={`text-sm transition-all duration-200 ${
                    selectedRange === range
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg'
                      : 'border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/50'
                  }`}
                >
                  {range}
                </Button>
              )
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-amber-200 dark:stroke-amber-800"
              />
              <XAxis
                dataKey="period"
                className="text-sm fill-amber-600 dark:fill-amber-400"
                tick={{ fontSize: 12 }}
                tickFormatter={formatPeriodLabel}
              />
              <YAxis
                className="text-sm fill-amber-600 dark:fill-amber-400"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  `${currency === 'usd' ? '$' : '₩'}${value.toLocaleString()}`
                }
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const displayLabel = formatPeriodLabel(label as string);
                    return (
                      <div className="rounded-lg border bg-white dark:bg-gray-800 p-3 shadow-xl border-amber-200 dark:border-amber-700">
                        <div className="flex flex-col gap-2">
                          <div className="text-center border-b border-amber-100 dark:border-amber-700 pb-2">
                            <span className="text-xs uppercase text-amber-500 dark:text-amber-400 font-semibold">
                              기간
                            </span>
                            <div className="font-bold text-amber-900 dark:text-amber-100 text-sm">
                              {displayLabel}
                            </div>
                          </div>
                          <div className="text-center">
                            <span className="text-xs uppercase text-amber-500 dark:text-amber-400 font-semibold">
                              배당금
                            </span>
                            <div className="font-bold text-yellow-600 dark:text-yellow-400 text-lg">
                              {formatTooltipValue(payload[0].value as number)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="total"
                fill="url(#colorGradient)"
                radius={[6, 6, 0, 0]}
                className="drop-shadow-xs"
                style={{
                  filter: 'brightness(1)',
                }}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {processedData.length === 0 && (
          <div className="flex items-center justify-center h-[400px] text-amber-500 dark:text-amber-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div>선택한 기간에 배당 데이터가 없습니다.</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
