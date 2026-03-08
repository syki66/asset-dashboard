'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
  Line,
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
import {
  SeriesToggleButtons,
  SeriesInfo,
} from '../ui/series-toggle-buttons';

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
  unit?: 'currency' | 'percent';
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
  icon?: React.ElementType;
  showLogScaleToggle?: boolean;
  showInflationAdjustToggle?: boolean;
  fillBetween?: [string, string]; // [bottomKey, topKey]
}

export function AssetChart({
  series = [],
  title = '자산 내역 차트',
  description = '',
  reverseYAxis = false,
  chartType = 'area',
  themeColor = 'var(--overview-theme)',
  icon: Icon,
  showLogScaleToggle = true,
  showInflationAdjustToggle = true,
  fillBetween,
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

      // 두 라인 사이의 영역 채우기 데이터 추가
      if (
        fillBetween &&
        dataPoint[fillBetween[0]] !== undefined &&
        dataPoint[fillBetween[1]] !== undefined
      ) {
        // [min, max] 형태로 배열 저장. (정렬하지 않아도 recharts가 아래부터 위로 채움)
        dataPoint['fillArea'] = [
          dataPoint[fillBetween[0]],
          dataPoint[fillBetween[1]],
        ];
      }

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
    if (useLogScale) {
      const minLogValue = minValue <= 0 ? 0.1 : minValue; // Ensure min is positive for log scale
      // Ensure max value is greater than minLogValue for log scale
      const adjustedMaxValue =
        maxValue <= minLogValue ? minLogValue + 1 : maxValue * 1.1;
      return [minLogValue, adjustedMaxValue];
    } else {
      return [0, maxValue * 1.1];
    }
  };

  const yDomain = calculateYDomain();

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formattedLabel = label
        ? format(parseISO(label), 'yyyy년 M월 d일', { locale: ko })
        : '';

      return (
        <div
          className="glassmorphism-tooltip"
        >
          <p className="text-center font-bold text-base mb-2">
            {formattedLabel}
          </p>
          <hr className="border-border my-1" />
          <div className="space-y-1 mt-2">
            {payload.map((pld: any, index: number) => {
              if (pld.name === 'fillArea') return null;
              
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
                {series?.unit === 'percent'
                  ? `${(pld.value as number).toFixed(2)}%`
                  : new Intl.NumberFormat('ko-KR', {
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
            {Icon ? (
              <Icon style={{ color: themeColor }} className="h-5 w-5" />
            ) : (
              <TrendingUp style={{ color: themeColor }} className="h-5 w-5" />
            )}
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[18.75rem]">
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
              {Icon ? (
                <Icon style={{ color: themeColor }} className="h-5 w-5" />
              ) : (
                <TrendingUp style={{ color: themeColor }} className="h-5 w-5" />
              )}
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-4 pt-1">
            {(showLogScaleToggle === undefined || showLogScaleToggle) && (
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
            )}
            {(showInflationAdjustToggle === undefined ||
              showInflationAdjustToggle) && (
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
            )}
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
                <TabsTrigger value="ytd" className="rounded-full text-xs">
                  YTD
                </TabsTrigger>
                <TabsTrigger value="1y" className="rounded-full text-xs">
                  1년
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
              <ComposedChart data={chartData}>
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

                {/* 두 라인 사이의 영역 채우기 */}
                {fillBetween &&
                  activeSeries.includes(fillBetween[0]) &&
                  activeSeries.includes(fillBetween[1]) && (
                    <Area
                      type="monotone"
                      dataKey="fillArea"
                      name="fillArea"
                      fill={
                        activeSeriesData.find((s) => s.id === fillBetween[1])
                          ?.color || '#FF9800'
                      }
                      fillOpacity={0.15}
                      stroke="none"
                      activeDot={false}
                      isAnimationActive={false}
                    />
                  )}

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
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 시리즈 선택 토글 */}
        <SeriesToggleButtons
          series={seriesWithColors}
          activeSeries={activeSeries}
          onToggle={toggleSeries}
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
}
