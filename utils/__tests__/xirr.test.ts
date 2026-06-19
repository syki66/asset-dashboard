import { calculateXIRR } from '../xirr';

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
