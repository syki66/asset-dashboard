import { differenceInCalendarDays } from 'date-fns';

export interface CashFlow {
  amount: number;
  date: string | Date;
}

const DAYS_IN_YEAR = 365;
const MAX_ITERATIONS = 100;
const MIN_RATE = -0.999999;
const TOLERANCE = 1e-7;

/**
 * 주어진 현금흐름 배열과 할인율(discount rate)을 바탕으로 순현재가치(NPV)를 계산합니다.
 */
function calculateNPV(rate: number, cashFlows: CashFlow[]): number {
  if (cashFlows.length === 0 || rate <= -1) return NaN;

  const startDate = new Date(cashFlows[0].date);

  return cashFlows.reduce((npv, cf) => {
    const cfDate = new Date(cf.date);
    const days = differenceInCalendarDays(cfDate, startDate);
    const years = days / DAYS_IN_YEAR;

    // npv += amount / (1 + rate)^years
    return npv + cf.amount / Math.pow(1 + rate, years);
  }, 0);
}

/**
 * 할인율(discount rate)에 대한 순현재가치(NPV) 함수의 도함수를 계산합니다.
 */
function calculateNPVDerivative(rate: number, cashFlows: CashFlow[]): number {
  if (cashFlows.length === 0 || rate <= -1) return NaN;

  const startDate = new Date(cashFlows[0].date);

  return cashFlows.reduce((npvPrime, cf) => {
    const cfDate = new Date(cf.date);
    const days = differenceInCalendarDays(cfDate, startDate);
    const years = days / DAYS_IN_YEAR;

    if (years === 0) return npvPrime;

    // npvPrime += -years * amount / (1 + rate)^(years + 1)
    return npvPrime - (years * cf.amount) / Math.pow(1 + rate, years + 1);
  }, 0);
}

function calculateWithBisection(cashFlows: CashFlow[]): number | null {
  let low = MIN_RATE;
  let high = 100;
  let lowNpv = calculateNPV(low, cashFlows);
  const highNpv = calculateNPV(high, cashFlows);

  if (!Number.isFinite(lowNpv) || !Number.isFinite(highNpv)) return null;
  if (lowNpv * highNpv > 0) return null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    const midNpv = calculateNPV(mid, cashFlows);

    if (!Number.isFinite(midNpv)) return null;
    if (Math.abs(midNpv) < TOLERANCE || high - low < TOLERANCE) {
      return mid;
    }

    if (lowNpv * midNpv <= 0) {
      high = mid;
    } else {
      low = mid;
      lowNpv = midNpv;
    }
  }

  return null;
}

/**
 * 비정기적인 현금흐름에 대한 내부수익률(XIRR)을 계산합니다.
 * Newton-Raphson 방식을 먼저 사용하고, 실패하면 간단한 이분법을 시도합니다.
 *
 * @param cashFlows 금액(amount)과 날짜(date)를 포함하는 현금흐름 배열.
 * @param guess 수익률의 초기 추정값 (기본값: 0.1)
 * @returns 퍼센트 단위로 계산된 XIRR 값 (예: 15%일 경우 15 반환), 계산할 수 없으면 0을 반환.
 */
export function calculateXIRR(
  cashFlows: CashFlow[],
  guess: number = 0.1,
): number {
  if (cashFlows.length < 2) return 0;

  // 현금흐름을 날짜 순으로 정렬합니다.
  const sortedCashFlows = [...cashFlows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // 양수 및 음수 현금흐름이 모두 존재하는지 확인합니다.
  const hasPositive = sortedCashFlows.some((cf) => cf.amount > 0);
  const hasNegative = sortedCashFlows.some((cf) => cf.amount < 0);

  // 모든 현금흐름의 부호가 같으면 내부수익률을 계산할 수 없습니다.
  if (!hasPositive || !hasNegative) return 0;

  let rate = guess;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const npv = calculateNPV(rate, sortedCashFlows);
    const npvPrime = calculateNPVDerivative(rate, sortedCashFlows);

    if (!Number.isFinite(npv) || Math.abs(npvPrime) < 1e-10) break;

    const newRate = rate - npv / npvPrime;

    if (!Number.isFinite(newRate) || newRate <= -1) break;
    if (Math.abs(newRate - rate) <= TOLERANCE) {
      return Number((newRate * 100).toFixed(2));
    }

    rate = newRate;
  }

  const fallbackRate = calculateWithBisection(sortedCashFlows);
  return fallbackRate === null ? 0 : Number((fallbackRate * 100).toFixed(2));
}
