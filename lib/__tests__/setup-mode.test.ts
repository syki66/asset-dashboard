import { getSetupMode } from '../setup-mode';

describe('getSetupMode', () => {
  it.each([
    ['demo', 'demo'],
    ['admin', 'admin'],
    ['unknown', 'default'],
    [undefined, 'default'],
  ] as const)(
    'mode=%s를 %s 모드로 해석한다',
    (mode, expected) => {
      expect(getSetupMode(mode)).toBe(expected);
    },
  );
});
