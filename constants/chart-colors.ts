export const OVERVIEW_CHART_COLORS = {
  primary: 'var(--overview-theme)',
  currentValue: '#f43f5e',
  secondary: 'oklch(0.67 0.19 225)',
  benchmarkBest: '#facc15',
  benchmarkWorst: '#ca8a04',
  benchmarkAverage: '#e2ad0d',
  neutral: 'oklch(0.55 0.035 240)',
} as const;

export const PERFORMANCE_CHART_COLORS = {
  primary: 'var(--performance-theme)',
  cumulativeReturn: 'oklch(0.58 0.17 165)',
  currentValue: '#f43f5e',
  secondary: 'oklch(0.62 0.18 225)',
  tertiary: 'oklch(0.64 0.19 300)',
  quaternary: 'oklch(0.73 0.16 80)',
  averageAnnualReturn: 'oklch(0.66 0.19 45)',
  benchmarkBest: '#facc15',
  benchmarkWorst: '#ca8a04',
  benchmarkAverage: '#e2ad0d',
  neutral: 'oklch(0.55 0.035 240)',
} as const;

export const DIVIDENDS_CHART_COLORS = {
  primary: 'oklch(0.88 0.14 92)',
  secondary: 'oklch(0.82 0.16 65)',
} as const;

export const RISK_CHART_COLORS = {
  primary: 'var(--risk-theme)',
  secondary: 'oklch(0.67 0.2 38)',
  tertiary: 'oklch(0.62 0.2 345)',
  quaternary: 'oklch(0.73 0.17 62)',
  rollingBest: 'oklch(0.8 0.15 28)',
  rollingWorst: 'oklch(0.76 0.17 8)',
  rollingVolatility: 'oklch(0.76 0.16 335)',
} as const;

export const PORTFOLIO_CHART_COLORS = [
  'var(--portfolio-theme)',
  'oklch(0.64 0.19 245)',
  'oklch(0.67 0.18 190)',
  'oklch(0.68 0.18 145)',
  'oklch(0.76 0.16 95)',
  'oklch(0.7 0.19 55)',
  'oklch(0.64 0.2 25)',
  'oklch(0.64 0.19 345)',
  'oklch(0.65 0.18 300)',
  'oklch(0.62 0.17 275)',
  'oklch(0.65 0.17 170)',
  'oklch(0.72 0.15 70)',
] as const;

export const TRANSACTION_CHART_COLORS = [
  'var(--transaction-theme)',
  'oklch(0.68 0.2 35)',
  'oklch(0.73 0.17 75)',
  'oklch(0.62 0.19 15)',
  'oklch(0.68 0.17 350)',
  'oklch(0.64 0.16 185)',
  'oklch(0.7 0.16 105)',
  'oklch(0.61 0.17 300)',
  'oklch(0.7 0.14 55)',
  'oklch(0.62 0.15 220)',
  'oklch(0.65 0.14 140)',
  'oklch(0.58 0.13 45)',
] as const;
