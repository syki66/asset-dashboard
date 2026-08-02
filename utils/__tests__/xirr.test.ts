import {
  calculateCompiledXIRR,
  calculateXIRR,
  calculateXIRRBatch,
  compileCashFlows,
  type CashFlow,
} from '../xirr';

describe('calculateXIRR', () => {
  it('1년 투자 수익률을 연환산 수익률로 계산한다', () => {
    const result = calculateXIRR([
      { date: '2021-01-01', amount: -1000 },
      { date: '2022-01-01', amount: 1100 },
    ]);

    expect(result).toBe(10);
  });

  it('중간 추가 입금을 외부 현금흐름으로 반영한다', () => {
    const result = calculateXIRR([
      { date: '2021-01-01', amount: -1000 },
      { date: '2021-07-01', amount: -500 },
      { date: '2022-01-01', amount: 1700 },
    ]);

    expect(result).toBe(16.09);
  });

  it('출금을 양수 현금흐름으로 반영한다', () => {
    const result = calculateXIRR([
      { date: '2021-01-01', amount: -1000 },
      { date: '2021-07-01', amount: 200 },
      { date: '2022-01-01', amount: 900 },
    ]);

    expect(result).toBe(11.09);
  });

  it('IRR을 계산할 수 없는 현금흐름이면 0을 반환한다', () => {
    const result = calculateXIRR([
      { date: '2021-01-01', amount: -1000 },
      { date: '2021-02-01', amount: -100 },
    ]);

    expect(result).toBe(0);
  });
});

describe('compiled XIRR', () => {
  it('정렬되지 않은 현금흐름도 기존 API와 같은 결과를 반환한다', () => {
    const cashFlows: CashFlow[] = [
      { date: '2022-01-01', amount: 1700 },
      { date: new Date(2021, 0, 1), amount: -1000 },
      { date: '2021-07-01', amount: -500 },
    ];

    const compiled = compileCashFlows(cashFlows);

    expect(calculateCompiledXIRR(compiled)).toBe(calculateXIRR(cashFlows));
    expect(calculateCompiledXIRR(compiled)).toBe(16.09);
  });

  it('정렬된 원본을 변경하지 않고 전처리 결과를 재사용한다', () => {
    const cashFlows: CashFlow[] = [
      { date: '2021-01-01', amount: -1000 },
      { date: '2021-07-01', amount: -500 },
      { date: '2022-01-01', amount: 1700 },
    ];
    const originalCashFlows = cashFlows.map((cashFlow) => ({ ...cashFlow }));
    const compiled = compileCashFlows(cashFlows, { assumeSorted: true });

    expect(cashFlows).toEqual(originalCashFlows);

    cashFlows[0].amount = -9000;
    cashFlows.reverse();

    expect(calculateCompiledXIRR(compiled)).toBe(16.09);
    expect(calculateCompiledXIRR(compiled)).toBe(16.09);
  });

  it('빈 배열과 한 방향 현금흐름의 기존 반환 규약을 유지한다', () => {
    expect(calculateCompiledXIRR(compileCashFlows([]))).toBe(0);
    expect(
      calculateCompiledXIRR(
        compileCashFlows(
          [
            { date: '2021-01-01', amount: -1000 },
            { date: '2022-01-01', amount: -100 },
          ],
          { assumeSorted: true },
        ),
      ),
    ).toBe(0);
  });
});

describe('calculateXIRRBatch', () => {
  const baseCashFlows: CashFlow[] = [
    { date: '2021-01-01', amount: -1000 },
    { date: '2021-07-01', amount: -500 },
    { date: '2021-10-01', amount: 100 },
  ];

  it('공통 입출금 이력에 여러 최종 평가금액을 일괄 계산한다', () => {
    const terminalCashFlows: CashFlow[] = [
      { date: '2022-01-01', amount: 1500 },
      { date: '2022-01-01', amount: 1600 },
      { date: '2022-01-01', amount: 1700 },
      { date: '2022-01-01', amount: 1800 },
      { date: '2022-01-01', amount: 1900 },
      { date: '2022-01-01', amount: 2000 },
    ];
    const compiled = compileCashFlows(baseCashFlows, {
      assumeSorted: true,
    });

    const results = calculateXIRRBatch(compiled, terminalCashFlows);
    const individualResults = terminalCashFlows.map((terminalCashFlow) =>
      calculateXIRR([...baseCashFlows, terminalCashFlow]),
    );

    expect(results).toEqual(individualResults);
  });

  it('항목별 초기 추정값을 지원한다', () => {
    const terminalCashFlows: CashFlow[] = [
      { date: '2022-01-01', amount: 1700 },
      { date: '2022-01-01', amount: 1800 },
    ];
    const guesses = [0.05, 0.2];
    const compiled = compileCashFlows(baseCashFlows, {
      assumeSorted: true,
    });

    expect(calculateXIRRBatch(compiled, terminalCashFlows, guesses)).toEqual(
      terminalCashFlows.map((terminalCashFlow, index) =>
        calculateXIRR(
          [...baseCashFlows, terminalCashFlow],
          guesses[index],
        ),
      ),
    );
  });

  it('최종 현금흐름의 날짜가 기준일보다 빨라도 기존 API와 일치한다', () => {
    const base: CashFlow[] = [
      { date: '2021-06-01', amount: -500 },
      { date: '2022-01-01', amount: 100 },
    ];
    const terminal = { date: '2021-01-01', amount: -1000 };
    const compiled = compileCashFlows(base, { assumeSorted: true });

    expect(calculateXIRRBatch(compiled, [terminal])).toEqual([
      calculateXIRR([...base, terminal]),
    ]);
  });
});
