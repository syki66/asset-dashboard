import { GET } from '../route';

global.fetch = jest.fn() as jest.Mock;

describe('GET /api/sectors/[symbol]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Vanguard VTI 섹터 데이터를 표준 형태로 변환한다', async () => {
    const mockData = {
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
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const request = new Request('http://localhost:3000/api/sectors/VTI');
    const params = Promise.resolve({ symbol: 'VTI' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(data).toEqual([{ name: 'Technology', weight: 42.3 }]);
  });

  it('Invesco QQQM 섹터 데이터를 표준 형태로 변환한다', async () => {
    const mockData = {
      holdingWeights: [
        { name: 'Technology', value: 66.9 },
        { name: 'Other', value: 0 },
        { name: '', value: 1 },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const request = new Request('http://localhost:3000/api/sectors/QQQM');
    const params = Promise.resolve({ symbol: 'QQQM' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(data).toEqual([{ name: 'Technology', weight: 66.9 }]);
  });
});
