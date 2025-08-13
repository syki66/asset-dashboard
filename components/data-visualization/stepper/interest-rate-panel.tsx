'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

type MonthRate = { year: number; month: number; rate: number };

interface InterestRatePanelProps {
  startYear?: number;
  storageKey?: string;
  className?: string;
}

// Generate default rate for a given year and month
function defaultRateForMonth(year: number, month: number): number {
  // Base yearly rate
  let baseRate: number;

  if (year <= 2007) {
    baseRate = 6 - 0.25 * (year - 2000);
  } else if (year <= 2015) {
    baseRate = 0.5;
  } else if (year === 2016) {
    baseRate = 0.75;
  } else if (year === 2017) {
    baseRate = 1.25;
  } else if (year === 2018) {
    baseRate = 2.25;
  } else if (year === 2019) {
    baseRate = 1.75;
  } else if (year === 2020) {
    baseRate = 0.25;
  } else if (year === 2021) {
    baseRate = 0.25;
  } else if (year === 2022) {
    baseRate = 2.5;
  } else if (year === 2023) {
    baseRate = 4.5;
  } else if (year === 2024) {
    baseRate = 4.0;
  } else if (year === 2025) {
    baseRate = 3.5;
  } else {
    // Beyond 2025, glide toward ~3.0
    const steps = Math.max(0, year - 2025);
    baseRate = Math.max(3.0, 3.5 - steps * 0.25);
  }

  // Add small monthly variation (±0.1%)
  const monthVariation = Math.sin(month * 0.5) * 0.1;
  return round2(Math.max(0, baseRate + monthVariation));
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

function loadFromStorage(
  months: { year: number; month: number }[],
  storageKey: string
): MonthRate[] | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MonthRate[];

    const map = new Map<string, number>();
    for (const item of parsed) {
      if (
        typeof item?.year === 'number' &&
        typeof item?.month === 'number' &&
        typeof item?.rate === 'number'
      ) {
        map.set(`${item.year}-${item.month}`, item.rate);
      }
    }

    return months.map(({ year, month }) => ({
      year,
      month,
      rate: map.get(`${year}-${month}`) ?? defaultRateForMonth(year, month),
    }));
  } catch {
    return null;
  }
}

function makeDefaults(months: { year: number; month: number }[]): MonthRate[] {
  return months.map(({ year, month }) => ({
    year,
    month,
    rate: defaultRateForMonth(year, month),
  }));
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
  if (!yearData || yearData.length === 0) return { avg: 0, min: 0, max: 0 };

  const rates = yearData.map((d) => d.rate);
  const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const min = Math.min(...rates);
  const max = Math.max(...rates);

  return { avg: round2(avg), min: round2(min), max: round2(max) };
}

export default function InterestRatePanel({
  startYear = 2000,
  storageKey = 'interest-rates-monthly-2000',
  className = '',
}: InterestRatePanelProps) {
  const months = useMemo(() => getMonthRange(startYear), [startYear]);
  const [rates, setRates] = useState<MonthRate[]>(() => makeDefaults(months));
  const [loading, setLoading] = useState(true);
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());

  const groupedRates = useMemo(() => groupByYear(rates), [rates]);
  const years = useMemo(
    () =>
      Object.keys(groupedRates)
        .map(Number)
        .sort((a, b) => b - a),
    [groupedRates]
  );

  useEffect(() => {
    // Initialize from localStorage or defaults
    const stored = loadFromStorage(months, storageKey);
    setRates(stored ?? makeDefaults(months));
    setLoading(false);
  }, [months, storageKey]);

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
            단위: % (소수점 둘째 자리까지 권장)
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
                {isCollapsed && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>평균 {stats.avg}%</span>
                    <span>최저 {stats.min}%</span>
                    <span>최고 {stats.max}%</span>
                  </div>
                )}
              </div>

              {isCollapsed && (
                <div className="ml-6 p-3 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                    {yearData.map(({ month, rate }) => (
                      <div
                        key={month}
                        className="text-center p-1 rounded text-xs"
                        title={`${month}월: ${rate}%`}
                      >
                        <div className="text-muted-foreground mb-1">
                          {month}
                        </div>
                        <div className="font-mono text-xs">{rate}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isCollapsed && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {yearData.map(({ year, month, rate }) => (
                    <div
                      key={`${year}-${month}`}
                      className="rounded-lg border bg-card p-3 space-y-2"
                    >
                      <div className="text-xs font-medium text-center text-muted-foreground">
                        {formatMonthLabel(month)}
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
                          className="h-8 text-center text-sm cursor-text"
                          placeholder="0.00"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
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
