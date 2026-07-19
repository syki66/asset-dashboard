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

describe('GET /api/holdings/[symbol]', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('일반 Vanguard ETF를 티커로 조회하고 유효한 구성 종목만 반환한다', async () => {
    mockJsonResponse({
      fund: {
        entity: [
          { ticker: 'AAPL', longName: 'Apple', percentWeight: '5.0' },
          { ticker: 'MSFT', longName: 'Microsoft', percentWeight: 3.5 },
          { ticker: 'CASH', longName: 'Cash', percentWeight: '0.0' },
          { ticker: '', longName: 'Missing Ticker', percentWeight: 1 },
          { ticker: 'NONAME', longName: '', percentWeight: 1 },
          { ticker: 'NOWEIGHT', longName: 'No Weight', percentWeight: null },
        ],
      },
    });

    const request = new Request('http://localhost:3000/api/holdings/VOO');
    const response = await GET(request, {
      params: Promise.resolve({ symbol: 'VOO' }),
    });

    expect(await response.json()).toEqual([
      { ticker: 'AAPL', name: 'Apple', weight: 5 },
      { ticker: 'MSFT', name: 'Microsoft', weight: 3.5 },
    ]);
    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/profile/api/VOO/portfolio-holding/stock'),
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('VTI는 전체 구성 종목을 제공하는 전용 Vanguard API를 호출한다', async () => {
    mockJsonResponse({ fund: { entity: [] } });

    const request = new Request('http://localhost:3000/api/holdings/VTI');
    await GET(request, { params: Promise.resolve({ symbol: 'VTI' }) });

    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/vmf/api/0970/portfolio-holding/stock.json'),
      expect.anything(),
    );
  });

  it('Invesco ETF를 CUSIP로 조회하고 유효한 구성 종목만 반환한다', async () => {
    mockJsonResponse({
      holdings: [
        {
          ticker: 'GOOGL',
          issuerName: 'Google',
          percentageOfTotalNetAssets: '5.0',
        },
        {
          ticker: 'NVDA',
          issuerName: 'NVIDIA',
          percentageOfTotalNetAssets: 3.5,
        },
        {
          ticker: 'CASH',
          issuerName: 'Cash',
          percentageOfTotalNetAssets: 0,
        },
        {
          ticker: '',
          issuerName: 'Missing Ticker',
          percentageOfTotalNetAssets: 1,
        },
      ],
    });

    const request = new Request(
      'http://localhost:3000/api/holdings/QQQ?provider=invesco&cusip=46090E103',
    );
    const response = await GET(request, {
      params: Promise.resolve({ symbol: 'QQQ' }),
    });

    expect(await response.json()).toEqual([
      { ticker: 'GOOGL', name: 'Google', weight: 5 },
      { ticker: 'NVDA', name: 'NVIDIA', weight: 3.5 },
    ]);
    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringMatching(
        /shareclasses\/46090E103\/holdings\/fund\?idType=cusip/,
      ),
      expect.anything(),
    );
  });

  it('유효한 CUSIP가 없으면 Invesco ETF를 티커로 조회한다', async () => {
    mockJsonResponse({ holdings: [] });

    const request = new Request(
      'http://localhost:3000/api/holdings/RSP?provider=invesco&cusip=INVALID',
    );
    await GET(request, { params: Promise.resolve({ symbol: 'RSP' }) });

    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringMatching(/shareclasses\/RSP\/holdings\/fund\?idType=ticker/),
      expect.anything(),
    );
  });

  it('외부 API 오류 상태를 그대로 반환한다', async () => {
    mockJsonResponse({}, 429);

    const request = new Request('http://localhost:3000/api/holdings/VOO');
    const response = await GET(request, {
      params: Promise.resolve({ symbol: 'VOO' }),
    });

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: 'Failed to fetch holdings for VOO',
    });
  });

  it('외부 API 호출 중 예외가 발생하면 500을 반환한다', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockedFetch.mockRejectedValue(new Error('network error'));

    const request = new Request('http://localhost:3000/api/holdings/VOO');
    const response = await GET(request, {
      params: Promise.resolve({ symbol: 'VOO' }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal Server Error' });
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching holdings:',
      expect.any(Error),
    );
    consoleError.mockRestore();
  });
});
