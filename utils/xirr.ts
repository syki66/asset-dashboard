import { differenceInCalendarDays } from 'date-fns';

export interface CashFlow {
  amount: number;
  date: string | Date;
}

export interface CompileCashFlowsOptions {
  /**
   * 입력이 날짜 오름차순임을 호출자가 보장할 때 정렬과 정렬용 복사를
   * 생략합니다. 이 조건은 별도로 검증하지 않으므로, 위반하면 첫 항목이
   * 기준일로 사용되어 계산 결과가 달라질 수 있습니다.
   */
  assumeSorted?: boolean;
}

const COMPILED_CASH_FLOWS = Symbol('compiled-cash-flows');

/**
 * XIRR 반복 계산에 필요한 값만 한 번 전처리한 현금흐름입니다.
 *
 * 직접 생성하거나 내부 TypedArray를 변경하지 말고
 * {@link compileCashFlows}의 불변 결과로 재사용하세요.
 */
export interface CompiledCashFlows {
  readonly [COMPILED_CASH_FLOWS]: true;
  readonly amounts: Float64Array;
  readonly yearFractions: Float64Array;
  readonly startDate: Date | null;
  readonly hasPositive: boolean;
  readonly hasNegative: boolean;
  readonly hasValidDates: boolean;
}

const DAYS_IN_YEAR = 365;
const MAX_ITERATIONS = 100;
const MIN_RATE = -0.999999;
const TOLERANCE = 1e-7;
const DEFAULT_GUESS = 0.1;

interface PreparedCashFlow {
  amount: number;
  date: Date;
  timestamp: number;
}

interface TerminalCashFlow {
  amount: number;
  yearFraction: number;
}

interface NpvAndDerivative {
  npv: number;
  derivative: number;
}

function toPreparedCashFlow(cashFlow: CashFlow): PreparedCashFlow {
  const date = new Date(cashFlow.date);

  return {
    amount: cashFlow.amount,
    date,
    timestamp: date.getTime(),
  };
}

/**
 * 현금흐름의 날짜 정렬 및 연 단위 날짜 차이 계산을 한 번만 수행합니다.
 * 원본 배열은 변경하지 않으며, 반환값은 같은 입출금 이력에 대한 여러
 * XIRR 계산에서 재사용할 수 있습니다.
 */
export function compileCashFlows(
  cashFlows: readonly CashFlow[],
  options: CompileCashFlowsOptions = {},
): CompiledCashFlows {
  if (cashFlows.length === 0) {
    return {
      [COMPILED_CASH_FLOWS]: true,
      amounts: new Float64Array(),
      yearFractions: new Float64Array(),
      startDate: null,
      hasPositive: false,
      hasNegative: false,
      hasValidDates: true,
    };
  }

  const preparedCashFlows = options.assumeSorted
    ? null
    : cashFlows
        .map(toPreparedCashFlow)
        .sort((a, b) => a.timestamp - b.timestamp);
  const startDate =
    preparedCashFlows?.[0].date ?? new Date(cashFlows[0].date);
  const amounts = new Float64Array(cashFlows.length);
  const yearFractions = new Float64Array(cashFlows.length);
  let hasPositive = false;
  let hasNegative = false;
  let hasValidDates = Number.isFinite(startDate.getTime());

  for (let index = 0; index < cashFlows.length; index++) {
    const amount = preparedCashFlows
      ? preparedCashFlows[index].amount
      : cashFlows[index].amount;
    const date = preparedCashFlows
      ? preparedCashFlows[index].date
      : index === 0
        ? startDate
        : new Date(cashFlows[index].date);
    const days = differenceInCalendarDays(date, startDate);

    amounts[index] = amount;
    yearFractions[index] = days / DAYS_IN_YEAR;
    hasPositive ||= amount > 0;
    hasNegative ||= amount < 0;
    hasValidDates &&= Number.isFinite(days);
  }

  return {
    [COMPILED_CASH_FLOWS]: true,
    amounts,
    yearFractions,
    startDate,
    hasPositive,
    hasNegative,
    hasValidDates,
  };
}

function calculateNPVAndDerivative(
  rate: number,
  cashFlows: CompiledCashFlows,
  terminalCashFlow?: TerminalCashFlow,
  yearOffset: number = 0,
): NpvAndDerivative {
  if (rate <= -1) {
    return { npv: NaN, derivative: NaN };
  }

  const rateBase = 1 + rate;
  let npv = 0;
  let derivative = 0;

  for (let index = 0; index < cashFlows.amounts.length; index++) {
    const years = cashFlows.yearFractions[index] - yearOffset;
    const discountedAmount =
      cashFlows.amounts[index] / Math.pow(rateBase, years);

    npv += discountedAmount;
    if (years !== 0) {
      derivative -=
        (years * cashFlows.amounts[index]) /
        Math.pow(rateBase, years + 1);
    }
  }

  if (terminalCashFlow) {
    const years = terminalCashFlow.yearFraction - yearOffset;
    const discountedAmount =
      terminalCashFlow.amount / Math.pow(rateBase, years);

    npv += discountedAmount;
    if (years !== 0) {
      derivative -=
        (years * terminalCashFlow.amount) /
        Math.pow(rateBase, years + 1);
    }
  }

  return { npv, derivative };
}

function calculateNPV(
  rate: number,
  cashFlows: CompiledCashFlows,
  terminalCashFlow?: TerminalCashFlow,
  yearOffset: number = 0,
): number {
  if (rate <= -1) return NaN;

  const rateBase = 1 + rate;
  let npv = 0;

  for (let index = 0; index < cashFlows.amounts.length; index++) {
    const years = cashFlows.yearFractions[index] - yearOffset;
    npv += cashFlows.amounts[index] / Math.pow(rateBase, years);
  }

  if (terminalCashFlow) {
    const years = terminalCashFlow.yearFraction - yearOffset;
    npv += terminalCashFlow.amount / Math.pow(rateBase, years);
  }

  return npv;
}

function calculateWithBisection(
  cashFlows: CompiledCashFlows,
  terminalCashFlow?: TerminalCashFlow,
  yearOffset: number = 0,
): number | null {
  let low = MIN_RATE;
  let high = 100;
  let lowNpv = calculateNPV(low, cashFlows, terminalCashFlow, yearOffset);
  const highNpv = calculateNPV(high, cashFlows, terminalCashFlow, yearOffset);

  if (!Number.isFinite(lowNpv) || !Number.isFinite(highNpv)) return null;
  if (lowNpv * highNpv > 0) return null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    const midNpv = calculateNPV(
      mid,
      cashFlows,
      terminalCashFlow,
      yearOffset,
    );

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

function calculateFromCompiled(
  cashFlows: CompiledCashFlows,
  guess: number,
  terminalCashFlow?: TerminalCashFlow,
): number {
  const length = cashFlows.amounts.length + (terminalCashFlow ? 1 : 0);
  if (length < 2 || !cashFlows.hasValidDates) return 0;

  const hasPositive =
    cashFlows.hasPositive || (terminalCashFlow?.amount ?? 0) > 0;
  const hasNegative =
    cashFlows.hasNegative || (terminalCashFlow?.amount ?? 0) < 0;

  if (!hasPositive || !hasNegative) return 0;
  if (
    terminalCashFlow &&
    !Number.isFinite(terminalCashFlow.yearFraction)
  ) {
    return 0;
  }

  // terminal이 기준일보다 이른 경우에도 원래 calculateXIRR와 동일하게
  // 가장 이른 날짜를 시간축의 원점으로 사용합니다.
  const yearOffset = Math.min(0, terminalCashFlow?.yearFraction ?? 0);
  let rate = guess;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const { npv, derivative } = calculateNPVAndDerivative(
      rate,
      cashFlows,
      terminalCashFlow,
      yearOffset,
    );

    if (!Number.isFinite(npv) || Math.abs(derivative) < 1e-10) break;

    const newRate = rate - npv / derivative;

    if (!Number.isFinite(newRate) || newRate <= -1) break;
    if (Math.abs(newRate - rate) <= TOLERANCE) {
      return Number((newRate * 100).toFixed(2));
    }

    rate = newRate;
  }

  const fallbackRate = calculateWithBisection(
    cashFlows,
    terminalCashFlow,
    yearOffset,
  );
  return fallbackRate === null ? 0 : Number((fallbackRate * 100).toFixed(2));
}

/**
 * 전처리된 현금흐름의 XIRR을 계산합니다.
 *
 * 동일한 현금흐름을 여러 번 계산할 때 `calculateXIRR` 대신 사용하면
 * 날짜 변환과 정렬을 반복하지 않습니다.
 */
export function calculateCompiledXIRR(
  cashFlows: CompiledCashFlows,
  guess: number = DEFAULT_GUESS,
): number {
  return calculateFromCompiled(cashFlows, guess);
}

/**
 * 동일한 입출금 이력에 서로 다른 최종 평가금액을 붙인 XIRR을 일괄
 * 계산합니다. 예를 들어 현재가·세후 현재가·벤치마크 평가금액을 한 번의
 * 날짜 전처리 결과로 계산할 수 있습니다.
 *
 * 각 최종 현금흐름은 base에 복사하거나 정렬하지 않고 독립적인 마지막
 * 항목으로만 평가하므로, 호출 후에도 base를 다음 배치에서 재사용할 수
 * 있습니다.
 *
 * `guesses`가 배열이면 각 최종 현금흐름과 같은 인덱스의 초기 추정값을
 * 사용하며, 값이 없으면 기본값 0.1을 사용합니다.
 */
export function calculateXIRRBatch(
  baseCashFlows: CompiledCashFlows,
  terminalCashFlows: readonly CashFlow[],
  guesses: number | readonly number[] = DEFAULT_GUESS,
): number[] {
  if (baseCashFlows.startDate === null) {
    return terminalCashFlows.map(() => 0);
  }

  const terminalDateCache = new Map<number, number>();

  return terminalCashFlows.map((terminalCashFlow, index) => {
    const terminalDate = new Date(terminalCashFlow.date);
    const terminalTimestamp = terminalDate.getTime();
    let yearFraction = terminalDateCache.get(terminalTimestamp);

    if (yearFraction === undefined) {
      yearFraction =
        differenceInCalendarDays(terminalDate, baseCashFlows.startDate!) /
        DAYS_IN_YEAR;
      terminalDateCache.set(terminalTimestamp, yearFraction);
    }

    const guess = Array.isArray(guesses)
      ? (guesses[index] ?? DEFAULT_GUESS)
      : guesses;

    return calculateFromCompiled(
      baseCashFlows,
      guess,
      {
        amount: terminalCashFlow.amount,
        yearFraction,
      },
    );
  });
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
  guess: number = DEFAULT_GUESS,
): number {
  if (cashFlows.length < 2) return 0;

  return calculateCompiledXIRR(compileCashFlows(cashFlows), guess);
}
