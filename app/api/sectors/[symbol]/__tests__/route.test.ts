import { GET } from '../route';

global.fetch = jest.fn() as jest.Mock;

const mockedFetch = global.fetch as jest.Mock;

const mockJsonResponse = (data: unknown, status = 200) => {
  mockedFetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });
};

describe('GET /api/sectors/[symbol]', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it.each(['VTI', 'VOO'])(
    'Vanguard %s를 티커별 API로 조회하고 섹터 데이터를 변환한다',
    async (symbol) => {
      mockJsonResponse({
        sector: {
          long: [
            {
              item: [
                { name: 'Technology', currYrPct: '42.30' },
                { name: 'Other', currYrPct: '0.00' },
                { name: '', currYrPct: '1.00' },
              ],
            },
          ],
        },
      });

      const request = new Request(
        `http://localhost:3000/api/sectors/${symbol}?provider=vanguard`,
      );
      const response = await GET(request, {
        params: Promise.resolve({ symbol }),
      });

      expect(await response.json()).toEqual([
        { name: 'Technology', weight: 42.3 },
      ]);
      expect(mockedFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/vmf/api/${symbol}/diversification`),
        expect.objectContaining({
          headers: { Accept: 'application/json' },
          next: { revalidate: 60 * 60 * 24 },
        }),
      );
    },
  );

  it.each(['QQQ', 'QQQM', 'RSP'])(
    'Invesco %s를 자체 티커로 조회하고 섹터 데이터를 변환한다',
    async (symbol) => {
      mockJsonResponse({
        holdingWeights: [
          { name: 'Technology', value: '66.9' },
          { name: 'Other', value: 0 },
          { name: '', value: 1 },
        ],
      });

      const request = new Request(
        `http://localhost:3000/api/sectors/${symbol}?provider=invesco`,
      );
      const response = await GET(request, {
        params: Promise.resolve({ symbol }),
      });

      expect(await response.json()).toEqual([
        { name: 'Technology', weight: 66.9 },
      ]);
      expect(mockedFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/shareclasses/${symbol}/weightedHoldings`),
        expect.objectContaining({
          headers: { Accept: 'application/json' },
          next: { revalidate: 60 * 60 * 24 },
        }),
      );
    },
  );

  it('provider가 없으면 외부 API를 호출하지 않고 빈 배열을 반환한다', async () => {
    const request = new Request('http://localhost:3000/api/sectors/VOO');
    const response = await GET(request, {
      params: Promise.resolve({ symbol: 'VOO' }),
    });

    expect(await response.json()).toEqual([]);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('외부 API 오류 상태를 그대로 반환한다', async () => {
    mockJsonResponse({}, 503);

    const request = new Request(
      'http://localhost:3000/api/sectors/VOO?provider=vanguard',
    );
    const response = await GET(request, {
      params: Promise.resolve({ symbol: 'VOO' }),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Failed to fetch sectors for VOO',
    });
  });

  it('외부 API 호출 중 예외가 발생하면 500을 반환한다', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockedFetch.mockRejectedValue(new Error('network error'));

    const request = new Request(
      'http://localhost:3000/api/sectors/VOO?provider=vanguard',
    );
    const response = await GET(request, {
      params: Promise.resolve({ symbol: 'VOO' }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal Server Error' });
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching sectors:',
      expect.any(Error),
    );
    consoleError.mockRestore();
  });
});
