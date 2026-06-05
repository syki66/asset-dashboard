'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StockProps } from '@/types';
import { PieChart as PieChartIcon } from 'lucide-react';

interface PortfolioAllocationChartProps {
  stocks: StockProps[];
  cash: number;
  themeColor?: string;
  title?: string;
  description?: string;
  isCompact?: boolean;
}

const COLORS = [
  '#6366f1', // 인디고
  '#f59e0b', // 앰버
  '#10b981', // 에메랄드
  '#ef4444', // 레드
  '#8b5cf6', // 바이올렛
  '#3b82f6', // 블루
  '#ec4899', // 핑크
  '#14b8a6', // 틸
  '#f97316', // 오렌지
  '#84cc16', // 라임
  '#06b6d4', // 사이안
  '#d946ef', // 퓨시아
  '#94a3b8', // 슬레이트 (현금용)
];

export function PortfolioAllocationChart({
  stocks,
  cash,
  themeColor = 'var(--portfolio-theme)',
  title = '포트폴리오 비중',
  description = '보유 종목 및 현금 자산 배분 현황입니다.',
  isCompact = false,
}: PortfolioAllocationChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setIsLoading(true);
      const stockMap = new Map<string, { value: number; fullName: string }>();

      for (const stock of stocks) {
        const isVanguard =
          stock.longName?.includes('Vanguard') ||
          stock.shortName?.includes('Vanguard');
        const isInvesco =
          stock.longName?.includes('Invesco') ||
          stock.shortName?.includes('Invesco');

        const stockValue = stock.balance.length * stock.price;

        if (isVanguard || isInvesco) {
          try {
            const response = await fetch(`/api/holdings/${stock.symbol}`);
            if (response.ok) {
              const holdings = await response.json();
              // holdings: { ticker, name, weight }[]

              holdings.forEach((holding: any) => {
                const holdingValue = stockValue * (holding.weight / 100);
                const existing = stockMap.get(holding.ticker);
                if (existing) {
                  stockMap.set(holding.ticker, {
                    value: existing.value + holdingValue,
                    fullName: holding.name || existing.fullName,
                  });
                } else {
                  stockMap.set(holding.ticker, {
                    value: holdingValue,
                    fullName: holding.name,
                  });
                }
              });
              continue; // Skip adding the ETF itself
            }
          } catch (error) {
            console.error(
              `Failed to fetch holdings for ${stock.symbol}`,
              error,
            );
          }
        }

        // Regular stock or failed fetch
        const existing = stockMap.get(stock.symbol);
        if (existing) {
          stockMap.set(stock.symbol, {
            value: existing.value + stockValue,
            fullName: stock.shortName,
          });
        } else {
          stockMap.set(stock.symbol, {
            value: stockValue,
            fullName: stock.shortName,
          });
        }
      }

      const stockItems = Array.from(stockMap.entries()).map(
        ([ticker, data]) => ({
          name: ticker,
          value: data.value,
          fullName: data.fullName,
        }),
      );

      const cashItem = {
        name: '현금',
        value: cash,
        fullName: '보유 현금 (KRW + USD)',
      };

      const combinedData = [...stockItems];
      if (cash > 0) {
        combinedData.push(cashItem);
      }

      setChartData(combinedData.sort((a, b) => b.value - a.value));
    };

    fetchAndProcessData()
      .catch((error) => {
        console.error('Portfolio allocation fetch failed', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [stocks, cash]);

  const totalValue = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  const pieChartData = useMemo(() => {
    if (totalValue === 0) return [];

    const threshold = totalValue * 0.004;
    const largeItems = chartData.filter((item) => item.value >= threshold);
    const smallItems = chartData.filter((item) => item.value < threshold);

    if (smallItems.length > 0) {
      const othersValue = smallItems.reduce((acc, curr) => acc + curr.value, 0);
      return [
        ...largeItems,
        { name: '기타', value: othersValue, fullName: '기타 종목 (0.4% 미만)' },
      ];
    }

    return largeItems;
  }, [chartData, totalValue]);

  const legendPayload = useMemo(() => {
    if (pieChartData.length === 0) return [];

    const topItems = pieChartData.slice(0, 7).map((entry, index) => ({
      value: entry.name,
      type: 'square',
      id: entry.name,
      color: COLORS[index % COLORS.length],
      payload: entry, // Pass the full entry for the formatter
    }));

    if (pieChartData.length > 7) {
      const remainingItems = pieChartData.slice(7);
      const othersValue = remainingItems.reduce(
        (acc, curr) => acc + curr.value,
        0,
      );
      const othersEntry = {
        name: '기타',
        value: othersValue,
        fullName: '기타 및 하위 종목',
      };

      topItems.push({
        value: '기타',
        type: 'square',
        id: '기타',
        color: '#94a3b8',
        payload: othersEntry,
      });
    }

    return topItems;
  }, [pieChartData]);

  if (isLoading) {
    return (
      <Card className='glass-card'>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            <PieChartIcon style={{ color: themeColor }} className='h-5 w-5' />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className='h-80 flex flex-col items-center justify-center gap-3'>
          <div
            className='h-10 w-10 rounded-full border-4 border-t-transparent animate-spin'
            style={{ borderColor: themeColor, borderTopColor: 'transparent' }}
          />
          <p className='text-sm' style={{ color: themeColor }}>
            데이터를 불러오는 중입니다...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className='glass-card'>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            <PieChartIcon style={{ color: themeColor }} className='h-5 w-5' />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className='h-80 flex items-center justify-center'>
          <p className='text-muted-foreground'>보유 주식이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalValue) * 100).toFixed(2);

      return (
        <div className='glassmorphism-tooltip'>
          <p className='font-bold text-base mb-1'>{data.name}</p>
          <p className='text-xs text-muted-foreground mb-2'>{data.fullName}</p>
          <hr className='border-border my-1' />
          <div className='mt-2 space-y-1'>
            <div className='flex justify-between gap-4 text-sm'>
              <span>평가금액</span>
              <span className='font-semibold'>
                {Math.round(data.value).toLocaleString()}
              </span>
            </div>
            <div className='flex justify-between gap-4 text-sm'>
              <span>비중</span>
              <span className='font-semibold text-primary'>{percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className='glass-card'>
      <CardHeader>
        <CardTitle className='text-lg flex items-center gap-2'>
          <PieChartIcon style={{ color: themeColor }} className='h-5 w-5' />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`flex flex-col md:flex-row gap-8 ${isCompact ? 'h-[350px]' : 'h-[500px]'}`}>
          <div className='flex-1 min-h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx='50%'
                  cy='50%'
                  innerRadius={0}
                  outerRadius={150}
                  paddingAngle={0}
                  dataKey='value'
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pieChartData.map((entry, index) => {
                    const isOthers = entry.name === '기타';
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          isOthers ? '#94a3b8' : COLORS[index % COLORS.length]
                        }
                        stroke='rgba(255,255,255,0.1)'
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign='bottom'
                  height={36}
                  payload={legendPayload}
                  wrapperStyle={{ paddingTop: isCompact ? '40px' : '0' }}
                  formatter={(value, entry: any) => {
                    const payload = entry.payload; // This is the 'payload' property I set in 'topItems'
                    const percentage = (
                      (payload.value / totalValue) *
                      100
                    ).toFixed(1);
                    return (
                      <span className='text-xs font-medium mr-2'>
                        {value} ({percentage}%)
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {!isCompact && (
            <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar'>
              <div className='space-y-4'>
                {chartData.map((item, index) => {
                  const percentage = ((item.value / totalValue) * 100).toFixed(2);

                  // Determine color
                  const threshold = totalValue * 0.005;
                  const isLarge = item.value >= threshold;
                  let color = '#94a3b8'; // Default gray for 'Others'

                  if (isLarge) {
                    // Find index in pieChartData (excluding 'Others')
                    // Since pieChartData starts with largeItems sorted same as chartData,
                    // the index in chartData is the same as in pieChartData for large items.
                    color = COLORS[index % COLORS.length];
                  }

                  return (
                    <div
                      key={item.name}
                      className='flex items-center justify-between text-sm group hover:bg-muted/50 p-2 rounded-lg transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className='w-2 h-8 rounded-full shrink-0'
                          style={{ backgroundColor: color }}
                        />
                        <span className='font-mono text-muted-foreground w-6 text-right'>
                          {index + 1}
                        </span>
                        <div>
                          <p className='font-semibold'>{item.name}</p>
                          <p
                            className='text-xs text-muted-foreground truncate max-w-[120px]'
                            title={item.fullName}
                          >
                            {item.fullName}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold tabular-nums'>
                          {Math.round(item.value).toLocaleString()}
                          <span className='text-xs font-normal text-muted-foreground ml-1'>
                            KRW
                          </span>
                        </p>
                        <p className='text-xs text-muted-foreground tabular-nums'>
                          {percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
