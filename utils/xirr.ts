import { differenceInCalendarDays } from 'date-fns';

export interface CashFlow {
  amount: number;
  date: string | Date;
}

const DAYS_IN_YEAR = 365;

/**
 * 주어진 현금흐름 배열과 할인율(discount rate)을 바탕으로 순현재가치(NPV)를 계산합니다.
 */
function calculateNPV(rate: number, cashFlows: CashFlow[]): number {
  if (cashFlows.length === 0) return 0;
  
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
  if (cashFlows.length === 0) return 0;
  
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

/**
 * 비정기적인 현금흐름에 대한 내부수익률(XIRR)을 계산합니다.
 * Newton-Raphson 방식을 사용합니다.
 * 
 * @param cashFlows 금액(amount)과 날짜(date)를 포함하는 현금흐름 배열.
 * @param guess 수익률의 초기 추정값 (기본값: 0.1)
 * @returns 퍼센트 단위로 계산된 XIRR 값 (예: 15%일 경우 15 반환), 수렴하지 않으면 0을 반환.
 */
export function calculateXIRR(cashFlows: CashFlow[], guess: number = 0.1): number {
  if (cashFlows.length < 2) return 0;
  
  // 현금흐름을 날짜 순으로 정렬합니다.
  const sortedCashFlows = [...cashFlows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // 양수 및 음수 현금흐름이 모두 존재하는지 확인합니다.
  let hasPositive = false;
  let hasNegative = false;
  
  for (const cf of sortedCashFlows) {
    if (cf.amount > 0) hasPositive = true;
    if (cf.amount < 0) hasNegative = true;
    if (hasPositive && hasNegative) break;
  }
  
  // 모든 현금흐름의 부호가 같으면 내부수익률을 계산할 수 없습니다.
  if (!hasPositive || !hasNegative) return 0;

  const maxIterations = 100;
  const tolerance = 1e-6;
  
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPV(rate, sortedCashFlows);
    const npvPrime = calculateNPVDerivative(rate, sortedCashFlows);
    
    if (Math.abs(npvPrime) < 1e-10) {
      // 도함수가 0에 너무 가까우면 Newton 방식이 실패합니다.
      return 0;
    }
    
    const newRate = rate - npv / npvPrime;
    
    // 오차 범위(tolerance) 내에 들어오면 해당 수익률을 찾은 것입니다.
    if (Math.abs(newRate - rate) <= tolerance) {
      // CAGR 및 returnRate와 형식을 맞추기 위해 소수점이 아닌 퍼센트 단위로 반환합니다.
      return Number((newRate * 100).toFixed(2));
    }
    
    // rate <= -1 이 되는 것을 방지합니다. (Math.pow(1 + rate, ...) 가 복소수나 유효하지 않은 값이 될 수 있음)
    if (newRate <= -1) {
      rate = -0.999999; // -1에 매우 가까운 값으로 제한합니다.
    } else {
      rate = newRate;
    }
  }

  // 최대 반복 횟수 내에 수렴하지 못한 경우
  return 0;
}
