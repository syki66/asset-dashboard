'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface StockData {
  date: string;
  [key: string]: string | number;
}

interface StockPurchaseChartProps {
  data: StockData[];
}

const generateStockColor = (index: number): string => {
  const colors = [
    '#3B82F6', // 밝은 파란색
    '#EC4899', // 핑크색
    '#EF4444', // 밝은 빨간색
    '#06B6D4', // 시안색
    '#10B981', // 에메랄드 그린
    '#84CC16', // 라임색
    '#8B5CF6', // 보라색
    '#F59E0B', // 주황색
    '#F97316', // 오렌지
    '#14B8A6', // 틸
    '#8B5A2B', // 브라운
    '#DC2626', // 레드
    '#7C3AED', // 바이올렛
    '#059669', // 그린
    '#DB2777', // 핑크-600
    '#2563EB', // 블루-600
  ];
  return colors[index % colors.length];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) =>
      a.dataKey.localeCompare(b.dataKey)
    );
    const totalShares = sortedPayload.reduce(
      (sum: number, entry: any) => sum + entry.value,
      0
    );

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[220px] backdrop-blur-xs">
        <div className="font-bold text-gray-900 mb-3 text-center border-b pb-2 text-lg">
          📅 {label}
        </div>
        <div className="space-y-2.5">
          {sortedPayload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shadow-xs"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-semibold text-gray-800 text-sm">
                  {entry.dataKey}
                </span>
              </div>
              <span className="font-bold text-gray-900 text-sm bg-gray-50 px-2 py-1 rounded">
                {entry.value.toLocaleString()}주
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200 bg-blue-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-700 flex items-center gap-2">
              📊 총 매수량
            </span>
            <span className="font-bold text-blue-800 text-lg">
              {totalShares.toLocaleString()}주
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function StockPurchaseChart({ data }: StockPurchaseChartProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(2024, 0, 1),
    to: new Date(2024, 11, 31),
  });

  const allStocks = Array.from(
    new Set(
      data.flatMap((item) => Object.keys(item).filter((key) => key !== 'date'))
    )
  ).sort((a, b) => a.localeCompare(b));

  const [selectedStocks, setSelectedStocks] = useState<string[]>(allStocks);

  const stockColors = allStocks.reduce((acc, stock, index) => {
    acc[stock] = generateStockColor(index);
    return acc;
  }, {} as { [key: string]: string });

  const filteredData = data.filter((item) => {
    const itemDate = new Date(item.date);
    if (!dateRange.from || !dateRange.to) return true;
    return itemDate >= dateRange.from && itemDate <= dateRange.to;
  });

  const chartData = filteredData.map((item) => {
    const filteredItem: StockData = { date: item.date };
    selectedStocks.forEach((stock) => {
      if (item[stock]) {
        filteredItem[stock] = item[stock];
      }
    });
    return filteredItem;
  });

  const totalPurchases = chartData.reduce((total, item) => {
    return (
      total +
      Object.entries(item)
        .filter(([key]) => key !== 'date')
        .reduce((sum, [, value]) => sum + (value as number), 0)
    );
  }, 0);

  const selectAllPeriod = () => {
    if (data.length > 0) {
      const dates = data
        .map((item) => new Date(item.date))
        .sort((a, b) => a.getTime() - b.getTime());
      setDateRange({
        from: dates[0],
        to: dates[dates.length - 1],
      });
    }
  };

  const getXAxisInterval = () => {
    const dataLength = chartData.length;
    if (dataLength > 100) return Math.floor(dataLength / 20);
    if (dataLength > 50) return Math.floor(dataLength / 15);
    if (dataLength > 30) return Math.floor(dataLength / 10);
    return 0;
  };

  const toggleStock = (stock: string) => {
    setSelectedStocks((prev) =>
      prev.includes(stock)
        ? prev.filter((s) => s !== stock)
        : [...prev, stock].sort((a, b) => a.localeCompare(b))
    );
  };

  const toggleAllStocks = () => {
    setSelectedStocks((prev) =>
      prev.length === allStocks.length ? [] : [...allStocks]
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Card className="bg-linear-to-br from-red-50 to-rose-50 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-linear-to-r from-red-500 to-rose-600 text-white rounded-t-lg py-5 px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl font-bold">
                📊 일별 주식 매수 수량
              </CardTitle>
              <CardDescription className="text-red-100 mt-1">
                각 날짜별로 매수한 주식 종목과 수량을 확인할 수 있습니다
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={selectAllPeriod}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
              >
                전체 기간
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      'w-[280px] justify-start text-left font-normal bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50',
                      !dateRange.from && 'text-white/70'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'yyyy.MM.dd', {
                            locale: ko,
                          })}{' '}
                          - {format(dateRange.to, 'yyyy.MM.dd', { locale: ko })}
                        </>
                      ) : (
                        format(dateRange.from, 'yyyy.MM.dd', { locale: ko })
                      )
                    ) : (
                      '날짜 범위 선택'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) =>
                      setDateRange(range || { from: undefined, to: undefined })
                    }
                    numberOfMonths={2}
                    classNames={{
                      day_selected:
                        'bg-red-500 text-white hover:bg-red-600 focus:bg-red-600',
                      day_range_middle: 'bg-red-100 text-red-900',
                      day_range_start: 'bg-red-500 text-white hover:bg-red-600',
                      day_range_end: 'bg-red-500 text-white hover:bg-red-600',
                      day_today: 'bg-red-50 text-red-600 font-semibold',
                      day: 'hover:bg-red-50 hover:text-red-600',
                      nav_button: 'hover:bg-red-50 hover:text-red-600',
                      nav_button_previous: 'hover:bg-red-50 hover:text-red-600',
                      nav_button_next: 'hover:bg-red-50 hover:text-red-600',
                      head_cell: 'text-red-600 font-medium',
                      caption: 'text-red-700 font-semibold',
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-red-100 font-medium">
                선택 기간 총 매수량
              </span>
              <span className="text-2xl font-bold text-white">
                {totalPurchases.toLocaleString()}주
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* 종목 선택 섹션 */}
          <div className="mb-6 bg-white/70 backdrop-blur-xs rounded-xl p-4 border border-white/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  📋 종목 선택
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  차트에 표시할 종목을 선택하세요
                </p>
              </div>
              <Button
                onClick={toggleAllStocks}
                variant="outline"
                size="sm"
                className="text-sm bg-white/50 hover:bg-white/70"
              >
                {selectedStocks.length === allStocks.length
                  ? '전체 해제'
                  : '전체 선택'}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {allStocks.map((stock) => (
                <div
                  key={stock}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <Checkbox
                    id={stock}
                    checked={selectedStocks.includes(stock)}
                    onCheckedChange={() => toggleStock(stock)}
                    className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-xs"
                      style={{ backgroundColor: stockColors[stock] }}
                    />
                    <label
                      htmlFor={stock}
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      {stock}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 차트 섹션 */}
          <div className="bg-white/50 backdrop-blur-xs rounded-xl p-6 border border-white/20">
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#374151' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={getXAxisInterval()}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#374151' }}
                    label={{
                      value: '매수 수량 (주)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#374151' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                    formatter={(value) => (
                      <span style={{ color: '#374151', fontWeight: 500 }}>
                        {value}
                      </span>
                    )}
                  />

                  {selectedStocks.map((stock) => (
                    <Bar
                      key={stock}
                      dataKey={stock}
                      stackId="stock"
                      fill={stockColors[stock]}
                      radius={[2, 2, 0, 0]}
                      name={stock}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
