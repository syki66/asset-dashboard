'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useInterestRateStore } from '@/store/account';

type MonthRate = { year: number; month: number; rate: number; active: boolean };

interface InterestRatePanelProps {
  startYear?: number;
  className?: string;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function getMonthRange(
  startYear = 2000,
  endYear = new Date().getFullYear(),
  endMonth = new Date().getMonth() + 1
) {
  const months: { year: number; month: number }[] = [];

  // Generate from latest to earliest
  for (let year = endYear; year >= startYear; year--) {
    const maxMonth = year === endYear ? endMonth : 12;
    const minMonth = year === startYear ? 1 : 1;

    for (let month = maxMonth; month >= minMonth; month--) {
      months.push({ year, month });
    }
  }

  return months;
}

function defaultRateForMonth(year: number, month: number): number {
  const rate = useInterestRateStore
    .getState()
    .interestRates.find(
      (r) =>
        new Date(r.date).getFullYear() === year &&
        new Date(r.date).getMonth() + 1 === month
    );
  return rate ? rate.interestRate : 0;
}

function makeDefaults(months: { year: number; month: number }[]): MonthRate[] {
  return months.map(({ year, month }) => {
    const rate = defaultRateForMonth(year, month);
    return {
      year,
      month,
      rate,
      active: rate !== 0, // 금리가 0이면 비활성화
    };
  });
}

function formatMonthLabel(month: number): string {
  const monthNames = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];
  return monthNames[month - 1];
}

function groupByYear(rates: MonthRate[]): Record<number, MonthRate[]> {
  const grouped: Record<number, MonthRate[]> = {};

  for (const rate of rates) {
    if (!grouped[rate.year]) {
      grouped[rate.year] = [];
    }
    grouped[rate.year].push(rate);
  }

  // Sort months within each year (earliest first)
  for (const year in grouped) {
    grouped[Number(year)].sort((a, b) => a.month - b.month);
  }

  return grouped;
}

function getYearStats(yearData: MonthRate[]) {
  if (!yearData || yearData.length === 0)
    return { avg: 0, min: 0, max: 0, activeCount: 0 };

  const activeData = yearData.filter((d) => d.active);
  if (activeData.length === 0)
    return { avg: 0, min: 0, max: 0, activeCount: 0 };

  const rates = activeData.map((d) => d.rate);
  const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const min = Math.min(...rates);
  const max = Math.max(...rates);

  return {
    avg: round2(avg),
    min: round2(min),
    max: round2(max),
    activeCount: activeData.length,
  };
}

export function InterestRatePanel({
  startYear = 2000,
  className = '',
}: InterestRatePanelProps) {
  const months = useMemo(() => getMonthRange(startYear), [startYear]);
  const [rates, setRates] = useState<MonthRate[]>(() => makeDefaults(months));
  const [loading, setLoading] = useState(true);
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());

  const setInterestRates = useInterestRateStore(
    (state) => state.setInterestRates
  );

  const groupedRates = useMemo(() => groupByYear(rates), [rates]);
  const years = useMemo(
    () =>
      Object.keys(groupedRates)
        .map(Number)
        .sort((a, b) => b - a),
    [groupedRates]
  );

  useEffect(() => {
    setRates(makeDefaults(months));
    setLoading(false);
  }, [months]);

  // 금리가 변경될 때마다
  useEffect(() => {
    const formattedRates = rates
      .filter(({ active }) => active)
      .map(({ year, month, rate }) => ({
        date: `${year}-${month.toString().padStart(2, '0')}-01`,
        interestRate: rate,
      }));
    setInterestRates(formattedRates);
  }, [rates]);

  function updateRate(year: number, month: number, value: string) {
    const next = value.replace(',', '.'); // support comma decimal
    if (!/^[-+]?\d*\.?\d*$/.test(next)) {
      // ignore invalid keystrokes, keep controlled value unchanged
      return;
    }
    setRates((prev) =>
      prev.map((r) =>
        r.year === year && r.month === month
          ? {
              ...r,
              rate:
                next === '' || next === '-' || next === '+' ? 0 : Number(next),
            }
          : r
      )
    );
  }

  function formatOnBlur(year: number, month: number) {
    setRates((prev) =>
      prev.map((r) =>
        r.year === year && r.month === month
          ? { ...r, rate: round2(Number(r.rate)) }
          : r
      )
    );
  }

  function toggleActive(year: number, month: number) {
    setRates((prev) =>
      prev.map((r) =>
        r.year === year && r.month === month ? { ...r, active: !r.active } : r
      )
    );
  }

  function toggleYear(year: number) {
    setCollapsedYears((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  }

  function toggleAllYears() {
    if (collapsedYears.size === years.length) {
      // All collapsed, expand all
      setCollapsedYears(new Set());
    } else {
      // Some or none collapsed, collapse all
      setCollapsedYears(new Set(years));
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">월별 금리</h3>
            <p className="text-sm text-muted-foreground">
              데이터를 불러오는 중...
            </p>
          </div>
        </div>
        <div className="h-32 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">월별 금리</h3>
          <p className="text-sm text-muted-foreground">
            단위: % (카드 클릭으로 활성화/비활성화)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllYears}
          className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer group bg-transparent"
        >
          <div className="transition-transform duration-200 group-hover:scale-110">
            {collapsedYears.size === years.length ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </div>
          {collapsedYears.size === years.length ? '모두 펼치기' : '모두 접기'}
        </Button>
      </div>

      {/* Content */}
      <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2">
        {years.map((year) => {
          const isCollapsed = collapsedYears.has(year);
          const yearData = groupedRates[year] || [];
          const stats = getYearStats(yearData);

          return (
            <div key={year} className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleYear(year)}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded-md px-2 py-1 transition-colors group"
                >
                  <div className="transition-transform duration-200 group-hover:scale-110">
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                  <h4 className="text-base font-medium text-foreground">
                    {year}년
                  </h4>
                </button>
                <div className="flex-1 h-px bg-border"></div>
                {isCollapsed && stats.activeCount > 0 && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>활성 {stats.activeCount}개월</span>
                    <span>평균 {stats.avg}%</span>
                    <span>최저 {stats.min}%</span>
                    <span>최고 {stats.max}%</span>
                  </div>
                )}
              </div>

              {isCollapsed && (
                <div className="ml-6 p-3 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                    {yearData.map(({ month, rate, active }) => (
                      <div
                        key={month}
                        className={`text-center p-1 rounded text-xs cursor-pointer transition-all duration-200 ${
                          active
                            ? 'bg-primary/10 border border-primary/20 text-foreground'
                            : 'bg-muted/50 text-muted-foreground opacity-50'
                        }`}
                        title={`${month}월: ${rate}% ${
                          active ? '(활성)' : '(비활성)'
                        }`}
                        onClick={() => toggleActive(year, month)}
                      >
                        <div className="mb-1">{month}</div>
                        <div className="font-mono text-xs">{rate}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isCollapsed && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {yearData.map(({ year, month, rate, active }) => (
                    <div
                      key={`${year}-${month}`}
                      className={`rounded-lg border p-3 space-y-2 cursor-pointer transition-all duration-200 ${
                        active
                          ? 'bg-card border-primary/20 shadow-sm'
                          : 'bg-muted/50 border-muted text-muted-foreground opacity-60'
                      }`}
                      onClick={() => toggleActive(year, month)}
                    >
                      <div className="text-xs font-medium text-center">
                        {formatMonthLabel(month)}
                        {!active && (
                          <span className="ml-1 text-xs">(비활성)</span>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          inputMode="decimal"
                          type="text"
                          value={String(rate)}
                          aria-label={`${year}년 ${month}월 금리`}
                          onChange={(e) =>
                            updateRate(year, month, e.target.value)
                          }
                          onBlur={() => formatOnBlur(year, month)}
                          onClick={(e) => e.stopPropagation()}
                          className={`h-8 text-center text-sm cursor-text ${
                            active ? '' : 'bg-muted/50'
                          }`}
                          placeholder="0.00"
                          disabled={!active}
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
