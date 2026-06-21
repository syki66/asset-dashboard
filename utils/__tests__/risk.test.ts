import {
  calculateSharpeRatio,
  calculateVolatility,
  getAnnualRiskFreeRate,
  isWeekendDate,
  toRoundedRiskMetric,
} from '../risk';

describe('risk metrics', () => {
  it('수익률 변동성이 없으면 변동성과 샤프지수를 0으로 계산한다', () => {
    const returns = [0.01, 0.01, 0.01];

    expect(calculateVolatility(returns)).toBe(0);
    expect(calculateSharpeRatio(returns)).toBe(0);
  });

  it('일별 수익률로 연환산 변동성과 샤프지수를 계산한다', () => {
    const returns = [0.01, -0.005, 0.002, 0.006, -0.003];

    expect(toRoundedRiskMetric(calculateVolatility(returns) * 100)).toBe(9.85);
    expect(toRoundedRiskMetric(calculateSharpeRatio(returns))).toBe(5.12);
  });

  it('가장 가까운 과거 금리를 연환산 무위험수익률로 사용한다', () => {
    const rates = [
      { date: '2024-01-01', interestRate: 4 },
      { date: '2024-06-01', interestRate: 3.5 },
    ];

    expect(getAnnualRiskFreeRate(rates, '2024-05-01')).toBe(0.04);
    expect(getAnnualRiskFreeRate(rates, '2024-06-10')).toBe(0.035);
  });

  it('무위험수익률을 차감해 샤프지수를 계산한다', () => {
    const returns = [0.01, -0.005, 0.002, 0.006, -0.003];

    expect(toRoundedRiskMetric(calculateSharpeRatio(returns, 0.04))).toBe(4.71);
  });

  it('주말 날짜를 판별한다', () => {
    expect(isWeekendDate('2026-06-20')).toBe(true);
    expect(isWeekendDate('2026-06-21')).toBe(true);
    expect(isWeekendDate('2026-06-22')).toBe(false);
  });
});
