'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from 'recharts';
import {
  format,
  parseISO,
  subDays,
  subMonths,
  subYears,
  startOfYear,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { inflationRates } from '@/constants/keywords';
import { Button } from '../ui/button';

// 차트 시리즈 타입 정의
interface AssetDataPoint {
  date: string;
  value: number;
}

interface AssetSeries {
  id: string;
  name: string;
  color?: string;
  data: AssetDataPoint[];
}

// 기본 색상 팔레트 - 더 많은 시리즈가 있을 경우 사용
const DEFAULT_COLORS = [
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
];

interface AssetHistoryChartProps {
  series: AssetSeries[];
  title?: string;
  description?: string;
  reverseYAxis?: boolean;
  chartType?: 'area' | 'line';
  themeColor?: string;
}

export function AssetChart({
  series = [],
  title = '자산 내역 차트',
  description = '',
  reverseYAxis = false,
  chartType = 'area',
  themeColor = 'var(--overview-theme)',
}: AssetHistoryChartProps) {
  const [useLogScale, setUseLogScale] = useState(false);
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [activeSeries, setActiveSeries] = useState<string[]>([]);


  // 시리즈에 색상 할당
  const seriesWithColors = series.map((s, index) => ({
    ...s,
    color: s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  // 컴포넌트 마운트 시 모든 시리즈 활성화
  useEffect(() => {
    setActiveSeries(seriesWithColors.map((s) => s.id));
  }, [series]);

  // 인플레이션 조정 함수
  const adjustValueForInflation = (value: number, dateStr: string) => {
    if (!adjustForInflation) return value;

    let adjustedValue = value;
    const year = Number.parseInt(dateStr.substring(0, 4));
    const currentYear = new Date().getFullYear();

    // 현재 연도부터 해당 연도까지 인플레이션 적용
    for (let y = year; y < currentYear; y++) {
      if (inflationRates[y]) {
        adjustedValue = adjustedValue * (1 + inflationRates[y] / 100);
      }
    }

    return adjustedValue;
  };

  // 데이터 처리 - 각 시리즈별로 처리
  const processedSeriesData = seriesWithColors.map((series) => {
    const processedData = series.data.map((item) => {
      const adjustedValue = adjustForInflation
        ? adjustValueForInflation(item.value, item.date)
        : item.value;

      return {
        date: item.date,
        parsedDate: parseISO(item.date),
        value: item.value,
        adjustedValue: adjustedValue,
        displayValue: adjustForInflation ? adjustedValue : item.value,
      };
    });

    return {
      ...series,
      processedData,
    };
  });

  // 시간 범위에 따른 데이터 필터링
  const getFilteredData = (data) => {
    if (timeRange === 'all') return data;
    if (data.length === 0) return [];

    // 가장 최근 날짜 찾기
    const latestDate = new Date(
      Math.max(...data.map((item) => item.parsedDate.getTime()))
    );

    let cutoffDate;
    switch (timeRange) {
      case '1w':
        cutoffDate = subDays(latestDate, 7);
        break;
      case '1m':
        cutoffDate = subMonths(latestDate, 1);
        break;
      case '3m':
        cutoffDate = subMonths(latestDate, 3);
        break;
      case '6m':
        cutoffDate = subMonths(latestDate, 6);
        break;
      case 'ytd':
        cutoffDate = startOfYear(latestDate);
        break;
      case '1y':
        cutoffDate = subYears(latestDate, 1);
        break;
      case '3y':
        cutoffDate = subYears(latestDate, 3);
        break;
      case '5y':
        cutoffDate = subYears(latestDate, 5);
        break;
      case '10y':
        cutoffDate = subYears(latestDate, 10);
        break;
      default:
        return data;
    }

    return data.filter((item) => item.parsedDate >= cutoffDate);
  };

  // 각 시리즈별로 필터링된 데이터
  const filteredSeriesData = processedSeriesData.map((series) => ({
    ...series,
    filteredData: getFilteredData(series.processedData),
  }));

  // 활성화된 시리즈만 필터링
  const activeSeriesData = filteredSeriesData.filter((series) =>
    activeSeries.includes(series.id)
  );





  // 차트 데이터 준비 - 모든 시리즈의 데이터를 날짜별로 병합
  const prepareChartData = () => {
    if (activeSeriesData.length === 0) return [];

    // 모든 날짜 추출
    const allDates = new Set<string>();



    activeSeriesData.forEach((series) => {
      series.filteredData.forEach((item) => {
        allDates.add(item.date);
      });
    });

    // 날짜순으로 정렬
    const sortedDates = Array.from(allDates).sort();

    // 각 날짜별로 모든 시리즈의 값을 포함하는 객체 생성
    return sortedDates.map((date) => {
      const dataPoint: any = { date };

      // 각 시리즈의 값 추가
      activeSeriesData.forEach((series) => {
        const seriesDataPoint = series.filteredData.find(
          (item) => item.date === date
        );
        if (seriesDataPoint) {
          dataPoint[series.id] = seriesDataPoint.displayValue;
        }
      });



      return dataPoint;
    });
  };

  const chartData = prepareChartData();

  // 차트 도메인 계산
  const calculateYDomain = () => {
    if (chartData.length === 0) return [0, 100];

    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;

    chartData.forEach((dataPoint) => {
      // 각 시리즈의 값 확인
      activeSeriesData.forEach((series) => {
        if (dataPoint[series.id] !== undefined) {
          minValue = Math.min(minValue, dataPoint[series.id]);
          maxValue = Math.max(maxValue, dataPoint[series.id]);
        }
      });


    });

    // 무한대 값 처리
    if (minValue === Number.POSITIVE_INFINITY) minValue = 0;
    if (maxValue === Number.NEGATIVE_INFINITY) maxValue = 100;

    // 로그 스케일을 위한 도메인 조정 (0이나 음수 방지)
    return useLogScale
      ? [Math.max(minValue, 1), maxValue * 1.1]
      : [0, maxValue * 1.1];
  };

  const yDomain = calculateYDomain();

  // 수익률 및 수익금 계산 - 각 시리즈별로 계산
  const calculateReturns = (data) => {
    if (!data || data.length < 2)
      return { percentReturn: 0, absoluteReturn: 0 };

    const initialValue = data[0].displayValue;
    const currentValue = data[data.length - 1].displayValue;

    const absoluteReturn = currentValue - initialValue;
    const percentReturn = (absoluteReturn / initialValue) * 100;

    return {
      percentReturn,
      absoluteReturn,
    };
  };



  // X축 포맷터 - 시간 범위에 따라 다른 형식 사용
  const getXAxisTickFormatter = () => {
    switch (timeRange) {
      case '1w':
        return (dateStr) => format(parseISO(dateStr), 'M/d', { locale: ko });
      case '1m':
        return (dateStr) => format(parseISO(dateStr), 'M/d', { locale: ko });
      case '3m':
      case '6m':
        return (dateStr) =>
          format(parseISO(dateStr), 'M월 d일', { locale: ko });
      case 'ytd':
      case '1y':
        return (dateStr) => format(parseISO(dateStr), 'M월', { locale: ko });
      default:
        return (dateStr) => format(parseISO(dateStr), 'yyyy', { locale: ko });
    }
  };

  // 툴팁 라벨 포맷터
  const getTooltipLabelFormatter = () => {
    return (dateStr) =>
      format(parseISO(dateStr), 'yyyy년 M월 d일', { locale: ko });
  };

  // 데이터 포인트 간격 조정 - 시간 범위에 따라 다르게 표시
  const getDataPointInterval = () => {
    if (chartData.length <= 30) return 1; // 데이터가 적으면 모든 포인트 표시

    switch (timeRange) {
      case '1w':
        return 1; // 매일
      case '1m':
        return 2; // 2일마다
      case '3m':
        return 7; // 1주일마다
      case '6m':
        return 14; // 2주일마다
      case '1y':
      case 'ytd':
        return 30; // 1개월마다
      case '3y':
        return 60; // 2개월마다
      case '5y':
        return 90; // 3개월마다
      case '10y':
      case 'all':
        return 180; // 6개월마다
      default:
        return 30;
    }
  };

  // 데이터 포인트 표시 여부 결정
  const shouldShowDot = (index) => {
    const interval = getDataPointInterval();
    return index % interval === 0 || index === chartData.length - 1; // 마지막 포인트는 항상 표시
  };

  // 시리즈 토글 핸들러
  const toggleSeries = (seriesId: string) => {
    setActiveSeries((prev) => {
      if (prev.includes(seriesId)) {
        return prev.filter((id) => id !== seriesId);
      } else {
        return [...prev, seriesId];
      }
    });
  };

  // 시간 범위에 따른 틱 개수 결정
  const getTickCountByTimeRange = () => {
    switch (timeRange) {
      case '1w':
        return 7; // 매일
      case '1m':
        return 8; // 약 4일마다
      case '3m':
        return 6; // 약 2주마다
      case '6m':
        return 6; // 약 1개월마다
      case '1y':
      case 'ytd':
        return 6; // 약 2개월마다
      case '3y':
        return 6; // 약 6개월마다
      case '5y':
        return 5; // 약 1년마다
      case '10y':
        return 5; // 약 2년마다
      case 'all':
        return 8; // 적절한 간격
      default:
        return 6;
    }
  };

  // X축 틱 계산 - 중복 방지
  const calculateXAxisTicks = useMemo(() => {
    if (chartData.length === 0) return [];

    const tickCount = getTickCountByTimeRange();
    const step = Math.max(1, Math.floor(chartData.length / tickCount));

    // 시간 범위에 따라 적절한 간격으로 틱 선택
    const ticks: string[] = [];
    let lastFormattedTick = '';

    for (let i = 0; i < chartData.length; i += step) {
      const date = chartData[i].date;
      const formattedTick = getXAxisTickFormatter()(date);

      // 중복 방지: 이전 틱과 다른 경우에만 추가
      if (formattedTick !== lastFormattedTick) {
        ticks.push(date);
        lastFormattedTick = formattedTick;
      }
    }

    // 마지막 데이터 포인트가 포함되어 있지 않으면 추가
    const lastDate = chartData[chartData.length - 1].date;
    const lastFormattedDate = getXAxisTickFormatter()(lastDate);

    if (lastFormattedDate !== lastFormattedTick) {
      ticks.push(lastDate);
    }

    return ticks;
  }, [chartData, timeRange]);

  const glassmorphismTooltipStyle = {
    backgroundColor: 'var(--card)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    color: 'var(--card-foreground)',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formattedLabel = label
        ? format(parseISO(label), 'yyyy년 M월 d일', { locale: ko })
        : '';

      return (
        <div
          style={glassmorphismTooltipStyle}
          className="p-3 rounded-lg shadow-lg"
        >
          <p className="text-center font-bold text-base mb-2">
            {formattedLabel}
          </p>
          <hr className="border-border my-1" />
          <div className="space-y-1 mt-2">
            {payload.map((pld, index) => {
              const series = seriesWithColors.find((s) => s.id === pld.name);
              const seriesName = series ? series.name : pld.name;
              const seriesColor = series ? series.color : '#8884d8';

              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center">
                    <div
                      className="w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: seriesColor }}
                    />
                    <span>{seriesName}</span>
                  </div>
                  <span className="font-semibold ml-4">
                    {new Intl.NumberFormat('ko-KR', {
                      style: 'currency',
                      currency: 'KRW',
                      maximumFractionDigits: 0,
                    }).format(pld.value as number)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  // 시리즈가 없을 경우 안내 메시지 표시
  if (series.length === 0) {
    return (
      <Card className="w-full glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 theme-overview" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">
            데이터가 없습니다. 자산 데이터를 추가해주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full glass-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 theme-overview" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center space-x-2">
              <Switch
                id="log-scale"
                checked={useLogScale}
                onCheckedChange={setUseLogScale}
                style={{ '--switch-bg': themeColor } as React.CSSProperties}
              />
              <Label htmlFor="log-scale" className="text-sm font-medium">
                로그 스케일
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="inflation-adjust"
                checked={adjustForInflation}
                onCheckedChange={setAdjustForInflation}
                style={{ '--switch-bg': themeColor } as React.CSSProperties}
              />
              <Label htmlFor="inflation-adjust" className="text-sm font-medium">
                인플레이션 보정
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              defaultValue="all"
              value={timeRange}
              onValueChange={setTimeRange}
              className="w-full"
              style={
                { '--active-tab-color': themeColor } as React.CSSProperties
              }
            >
              <TabsList className="grid w-full grid-cols-10">
                <TabsTrigger value="1w" className="rounded-full text-xs">
                  1주
                </TabsTrigger>
                <TabsTrigger value="1m" className="rounded-full text-xs">
                  1개월
                </TabsTrigger>
                <TabsTrigger value="3m" className="rounded-full text-xs">
                  3개월
                </TabsTrigger>
                <TabsTrigger value="6m" className="rounded-full text-xs">
                  6개월
                </TabsTrigger>
                <TabsTrigger value="1y" className="rounded-full text-xs">
                  1년
                </TabsTrigger>
                <TabsTrigger value="ytd" className="rounded-full text-xs">
                  YTD
                </TabsTrigger>
                <TabsTrigger value="3y" className="rounded-full text-xs">
                  3년
                </TabsTrigger>
                <TabsTrigger value="5y" className="rounded-full text-xs">
                  5년
                </TabsTrigger>
                <TabsTrigger value="10y" className="rounded-full text-xs">
                  10년
                </TabsTrigger>
                <TabsTrigger value="all" className="rounded-full text-xs">
                  전체
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={getXAxisTickFormatter()}
                  type="category"
                  ticks={calculateXAxisTicks}
                  interval={0}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  axisLine={false}
                  fontSize={12}
                  scale={useLogScale ? 'log' : 'linear'}
                  domain={yDomain}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat('ko-KR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1,
                    }).format(value)
                  }
                  reversed={reverseYAxis}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 각 시리즈별 라인 */}
                {activeSeriesData.map((series) => (
                  <Area
                    key={series.id}
                    type="monotone"
                    dataKey={series.id}
                    name={series.id}
                    stroke={series.color}
                    fill={series.color}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: series.color,
                      strokeWidth: 2,
                      fill: series.color,
                    }}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={getXAxisTickFormatter()}
                  type="category"
                  ticks={calculateXAxisTicks}
                  interval={0}
                  axisLine={false}
                />
                <YAxis
                  scale={useLogScale ? 'log' : 'linear'}
                  domain={yDomain}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat('ko-KR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1,
                    }).format(value)
                  }
                  reversed={reverseYAxis}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 각 시리즈별 라인 */}
                {activeSeriesData.map((series) => (
                  <Line
                    key={series.id}
                    type="monotone"
                    dataKey={series.id}
                    name={series.id}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: series.color,
                      strokeWidth: 2,
                      fill: series.color,
                    }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 시리즈 선택 토글 */}
        {seriesWithColors.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {seriesWithColors.map((series) => (
              <Button
                key={series.id}
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-full h-8 transition-all duration-200 ease-in-out flex items-center justify-center',
                  {
                    'bg-transparent text-muted-foreground border-dashed hover:text-muted-foreground':
                      !activeSeries.includes(series.id),
                    'shadow-md': activeSeries.includes(series.id),
                  }
                )}
                onClick={() => toggleSeries(series.id)}
                style={{
                  borderColor: activeSeries.includes(series.id)
                    ? series.color
                    : '' /* 비활성 상태에서는 기본 테두리 사용 */,
                  background: activeSeries.includes(series.id)
                    ? `${series.color}20`
                    : 'transparent',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2 transition-all duration-200"
                  style={{
                    backgroundColor: series.color,
                    opacity: activeSeries.includes(series.id) ? 1 : 0.4,
                  }}
                />
                <span
                  className="font-medium transition-colors duration-200"
                  style={{
                    color: activeSeries.includes(series.id)
                      ? series.color
                      : '' /* 기본 텍스트 색상 사용 */,
                  }}
                >
                  {series.name}
                </span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
