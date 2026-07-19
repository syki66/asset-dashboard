import { getCusipFromUsIsin } from '../security-identifiers';

describe('getCusipFromUsIsin', () => {
  it.each([
    ['US9229087690', '922908769'],
    [' us46138g6492 ', '46138G649'],
  ])('미국 ISIN %s에서 CUSIP를 추출한다', (isin, expected) => {
    expect(getCusipFromUsIsin(isin)).toBe(expected);
  });

  it.each(['A005930', 'USD', 'KRW', 'M04020000', ''])(
    '신한 CSV의 미국 ISIN 형식이 아닌 %s는 변환하지 않는다',
    (isin) => {
      expect(getCusipFromUsIsin(isin)).toBeUndefined();
    },
  );
});
