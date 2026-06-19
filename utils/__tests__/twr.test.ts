import { annualizeTwr, calculateTwrFactor } from '../twr';

describe('TWR 계산 유틸', () => {
  it('입출금 영향을 제거한 기간 수익 배율을 계산한다', () => {
    const result = calculateTwrFactor(1200, 1000, 100);

    expect(result).toBe(1.1);
  });

  it('이전 평가금이 없으면 중립 배율을 반환한다', () => {
    const result = calculateTwrFactor(1000, 0, 0);

    expect(result).toBe(1);
  });

  it('누적 수익 배율을 연환산 수익률로 변환한다', () => {
    const result = annualizeTwr(1.21, 2);

    expect(result).toBe(10);
  });
});
