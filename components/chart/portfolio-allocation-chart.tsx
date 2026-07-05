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
import { InfoTooltip } from '@/components/dashboard/info-tooltip';
import { StockProps } from '@/types';
import { useCurrencyStore } from '@/store/options';
import { PieChart as PieChartIcon } from 'lucide-react';

interface PortfolioAllocationChartProps {
  stocks: StockProps[];
  cash: number;
  themeColor?: string;
  title?: string;
  description?: string;
  isCompact?: boolean;
  allocationMode?: 'holdings' | 'sectors';
  selectedDate?: string;
}

type HoldingWeight = {
  ticker: string;
  name: string;
  weight: number;
};

type SectorWeight = {
  name: string;
  weight: number;
};

const holdingsCache = new Map<string, Promise<HoldingWeight[]>>();
const sectorsCache = new Map<string, Promise<SectorWeight[]>>();

const fetchCachedJson = <T,>(cache: Map<string, Promise<T>>, url: string) => {
  const cached = cache.get(url);
  if (cached) return cached;

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
      }

      return response.json() as Promise<T>;
    })
    .catch((error) => {
      cache.delete(url);
      throw error;
    });

  cache.set(url, request);
  return request;
};

const fetchHoldings = (symbol: string) =>
  fetchCachedJson<HoldingWeight[]>(
    holdingsCache,
    `/api/holdings/${symbol.toUpperCase()}`,
  );

const fetchSectors = (symbol: string) =>
  fetchCachedJson<SectorWeight[]>(
    sectorsCache,
    `/api/sectors/${symbol.toUpperCase()}`,
  );

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

const SECTOR_NAME_KO: Record<string, string> = {
  'basic materials': '원자재',
  'consumer discretionary': '임의소비재',
  'consumer staples': '필수소비재',
  energy: '에너지',
  financials: '금융',
  'health care': '헬스케어',
  industrials: '산업재',
  'real estate': '부동산',
  technology: '기술',
  telecommunications: '통신',
  utilities: '유틸리티',
};

const translateSectorName = (name: string) =>
  SECTOR_NAME_KO[name.trim().toLowerCase()] ?? name;

const getCurrentRebalanceStartDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const rebalanceMonth = month >= 10 ? 10 : month >= 7 ? 7 : month >= 4 ? 4 : 1;

  return `${year}-${String(rebalanceMonth).padStart(2, '0')}-01`;
};

type AllocationChartData = {
  name: string;
  value: number;
  fullName?: string;
  color?: string;
};

type AllocationTooltipPayloadItem = {
  payload: AllocationChartData;
};

type AllocationTooltipProps = {
  active?: boolean;
  payload?: AllocationTooltipPayloadItem[];
};

export function PortfolioAllocationChart({
  stocks,
  cash,
  themeColor = 'var(--portfolio-theme)',
  title = '포트폴리오 비중',
  description = '보유 종목 및 현금 자산 배분 현황입니다.',
  isCompact = false,
  allocationMode = 'holdings',
  selectedDate,
}: PortfolioAllocationChartProps) {
  const [chartData, setChartData] = useState<AllocationChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoricalRebalancePeriod, setIsHistoricalRebalancePeriod] =
    useState(false);
  const [currentRebalanceStartDate, setCurrentRebalanceStartDate] = useState<
    string | null
  >(null);
  const currency = useCurrencyStore((state) => state.currency);
  const currencyUnit = currency === 'usd' ? 'USD' : '원';
  const formatAmount = (value: number) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });

  useEffect(() => {
    let isCancelled = false;

    const fetchAndProcessData = async () => {
      setIsLoading(true);
      setIsHistoricalRebalancePeriod(false);
      const stockMap = new Map<string, { value: number; fullName: string }>();
      const rebalanceStartDate = getCurrentRebalanceStartDate();
      setCurrentRebalanceStartDate(rebalanceStartDate);
      const shouldUseFallback =
        selectedDate !== undefined && selectedDate < rebalanceStartDate;
      setIsHistoricalRebalancePeriod(shouldUseFallback);

      const addStockMapItem = (
        name: string,
        value: number,
        fullName: string,
      ) => {
        const existing = stockMap.get(name);
        stockMap.set(name, {
          value: (existing?.value ?? 0) + value,
          fullName: existing?.fullName ?? fullName,
        });
      };

      for (const stock of stocks) {
        const isVanguard =
          stock.longName?.includes('Vanguard') ||
          stock.shortName?.includes('Vanguard');
        const isInvesco =
          stock.longName?.includes('Invesco') ||
          stock.shortName?.includes('Invesco');
        const isKoreanStock = stock.code?.startsWith('A');
        const stockDisplayName =
          isKoreanStock && stock.shortName ? stock.shortName : stock.symbol;

        const stockValue = stock.balance.length * stock.price;

        if (allocationMode === 'sectors') {
          const symbol = stock.symbol.toUpperCase();

          if (symbol === 'VTI' || symbol === 'QQQM') {
            try {
              const sectors = await fetchSectors(symbol);

              if (!shouldUseFallback && sectors.length > 0) {
                sectors.forEach((sector) => {
                  const translatedSectorName = translateSectorName(
                    sector.name,
                  );
                  const sectorValue = stockValue * (sector.weight / 100);
                  const existing = stockMap.get(translatedSectorName);
                  stockMap.set(translatedSectorName, {
                    value: (existing?.value ?? 0) + sectorValue,
                    fullName: existing?.fullName ?? sector.name,
                  });
                });
                continue;
              }
            } catch (error) {
              console.error(
                `Failed to fetch sectors for ${stock.symbol}`,
                error,
              );
            }
          }

          addStockMapItem('주식', stockValue, '섹터 구성 미적용 주식 자산');
          continue;
        }

        if (isVanguard || isInvesco) {
          try {
            const symbol = stock.symbol.toUpperCase();
            if (shouldUseFallback && (symbol === 'VTI' || symbol === 'QQQM')) {
              addStockMapItem(symbol, stockValue, stock.shortName);
              continue;
            }

            const holdings = await fetchHoldings(stock.symbol);

            holdings.forEach((holding) => {
              const holdingValue = stockValue * (holding.weight / 100);
              addStockMapItem(holding.ticker, holdingValue, holding.name);
            });
            continue; // Skip adding the ETF itself
          } catch (error) {
            console.error(
              `Failed to fetch holdings for ${stock.symbol}`,
              error,
            );
          }
        }

        // Regular stock or failed fetch
        addStockMapItem(
          stockDisplayName,
          stockValue,
          isKoreanStock
            ? stock.longName || stock.symbol
            : stock.shortName || stock.longName || stock.symbol,
        );
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

      if (!isCancelled) {
        setChartData(combinedData.sort((a, b) => b.value - a.value));
      }
    };

    fetchAndProcessData()
      .catch((error) => {
        console.error('Portfolio allocation fetch failed', error);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [stocks, cash, allocationMode, selectedDate]);

  const totalValue = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  const pieChartData = useMemo(() => {
    if (totalValue === 0) return [];

    if (allocationMode === 'sectors') {
      return chartData;
    }

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
  }, [allocationMode, chartData, totalValue]);

  const legendItems = useMemo(() => {
    if (pieChartData.length === 0) return [];

    const visibleItems =
      allocationMode === 'sectors' ? pieChartData : pieChartData.slice(0, 7);
    const items = [...visibleItems];

    if (allocationMode !== 'sectors' && pieChartData.length > 7) {
      const remainingItems = pieChartData.slice(7);
      const othersValue = remainingItems.reduce(
        (acc, curr) => acc + curr.value,
        0,
      );

      items.push({
        name: '기타',
        value: othersValue,
        fullName: '기타 및 하위 종목',
      });
    }

    return items;
  }, [allocationMode, pieChartData]);

  const legendPayload = useMemo(
    () =>
      legendItems.map((entry, index) => ({
        value: entry.name,
        type: 'square' as const,
        id: entry.name,
        color: entry.name === '기타' ? '#94a3b8' : COLORS[index % COLORS.length],
      })),
    [legendItems],
  );

  const sectorFallbackInfo = useMemo(() => {
    if (!isHistoricalRebalancePeriod || !currentRebalanceStartDate) return null;

    return (
      <div className='max-w-64 space-y-1 text-xs'>
        <p>
          선택한 날짜가 현재 리밸런싱 구간 이전이라 최신 세부 구성을 적용하지
          않았습니다.
        </p>
        <p className='text-muted-foreground'>
          {currentRebalanceStartDate}부터 세부 비중으로 표시합니다.
        </p>
      </div>
    );
  }, [currentRebalanceStartDate, isHistoricalRebalancePeriod]);

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

  const CustomTooltip = ({ active, payload }: AllocationTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalValue) * 100).toFixed(2);

      const index = pieChartData.findIndex((item) => item.name === data.name);
      const isOthers = data.name === '기타';
      const color = isOthers ? '#94a3b8' : COLORS[index % COLORS.length];

      return (
        <div className='glassmorphism-tooltip'>
          <p className='font-bold text-base mb-1' style={{ color }}>
            {data.name}
          </p>
          <p className='text-xs text-muted-foreground mb-2'>{data.fullName}</p>
          <hr className='border-border my-1' />
          <div className='mt-2 space-y-1'>
            <div className='flex justify-between gap-4 text-sm'>
              <span>평가금액</span>
              <span className='font-semibold' style={{ color }}>
                {formatAmount(data.value)}
                <span
                  className={`text-xs font-normal text-muted-foreground ${
                    currency === 'usd' ? 'ml-1' : ''
                  }`}
                >
                  {currencyUnit}
                </span>
              </span>
            </div>
            <div className='flex justify-between gap-4 text-sm'>
              <span>비중</span>
              <span className='font-semibold' style={{ color }}>
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      className='glass-card'
      style={
        {
          '--theme-hover': `color-mix(in srgb, ${themeColor} 15%, transparent)`,
        } as React.CSSProperties
      }
    >
      <CardHeader>
        <CardTitle className='text-lg flex items-center gap-2'>
          <PieChartIcon style={{ color: themeColor }} className='h-5 w-5' />
          {title}
          {sectorFallbackInfo && (
            <InfoTooltip info={sectorFallbackInfo} side='right' />
          )}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div
          className={`flex flex-col md:flex-row gap-8 ${
            isCompact ? 'h-[420px]' : 'h-[500px]'
          }`}
        >
          <div
            className={
              isCompact ? 'flex-1 min-h-[360px]' : 'flex-1 min-h-[300px]'
            }
          >
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
                  height={allocationMode === 'sectors' ? 64 : 44}
                  payload={legendPayload}
                  wrapperStyle={{
                    paddingTop: isCompact ? '8px' : '0',
                    lineHeight: '1.5',
                  }}
                  formatter={(value) => {
                    const payload = legendItems.find(
                      (item) => item.name === String(value),
                    );

                    if (!payload) return null;

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
                  const percentage = ((item.value / totalValue) * 100).toFixed(
                    2,
                  );

                  const threshold = totalValue * 0.005;
                  const isLarge = item.value >= threshold;
                  const color =
                    allocationMode === 'sectors' || isLarge
                      ? COLORS[index % COLORS.length]
                      : '#94a3b8';

                  return (
                    <div
                      key={item.name}
                      className='flex items-center justify-between text-sm group hover:bg-[var(--theme-hover)] p-2 rounded-lg transition-colors cursor-pointer'
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
                          {formatAmount(item.value)}
                          <span
                            className={`text-xs font-normal text-muted-foreground ${
                              currency === 'usd' ? 'ml-1' : ''
                            }`}
                          >
                            {currencyUnit}
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
