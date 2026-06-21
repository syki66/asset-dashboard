const TRADING_DAYS_PER_YEAR = 252;

type InterestRatePoint = {
  date: string;
  interestRate: number;
};

export const calculateVolatility = (returns: number[]): number => {
  if (returns.length < 2) return 0;

  const averageReturn =
    returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - averageReturn) ** 2, 0) /
    (returns.length - 1);

  return Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR);
};

export const calculateSharpeRatio = (
  returns: number[],
  riskFreeRate = 0,
): number => {
  const volatility = calculateVolatility(returns);
  if (volatility === 0) return 0;

  const averageReturn =
    returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const annualizedReturn = averageReturn * TRADING_DAYS_PER_YEAR;

  return (annualizedReturn - riskFreeRate) / volatility;
};

export const toRoundedRiskMetric = (value: number): number =>
  Number.isFinite(value) ? Number(value.toFixed(2)) : 0;

export const isWeekendDate = (date: string): boolean => {
  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();

  return dayOfWeek === 0 || dayOfWeek === 6;
};

export const getAnnualRiskFreeRate = (
  rates: InterestRatePoint[],
  date: string,
): number => {
  if (rates.length === 0) return 0;

  const targetDate = new Date(date);
  const pastRates = rates.filter((rate) => new Date(rate.date) <= targetDate);

  if (pastRates.length === 0) {
    const oldestRate = rates.reduce((oldest, rate) =>
      new Date(rate.date) < new Date(oldest.date) ? rate : oldest,
    );
    return oldestRate.interestRate / 100;
  }

  const latestRate = pastRates.reduce((latest, rate) =>
    new Date(rate.date) > new Date(latest.date) ? rate : latest,
  );

  return latestRate.interestRate / 100;
};
