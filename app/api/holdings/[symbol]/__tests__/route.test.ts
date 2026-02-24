import { GET } from '../route';

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('GET /api/holdings/[symbol]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Vanguard & (VTI) 데이터에서 티커, 이름, 가중치가 없거나 가중치가 0인 항목을 필터링한다', async () => {
        const mockData = {
            fund: {
                entity: [
                    { ticker: 'AAPL', longName: 'Apple', percentWeight: "5.0" }, // 유지
                    { ticker: 'MSFT', longName: 'Microsoft', percentWeight: 3.5 }, // 유지 (숫자 입력)
                    { ticker: 'CASH', longName: 'Cash', percentWeight: "0.0" }, // 제거 (0 문자열)
                    { ticker: 'ZERO', longName: 'Zero', percentWeight: 0 }, // 제거 (0 숫자)
                    { ticker: '', longName: 'Missing Ticker', percentWeight: 1.0 }, // 제거 (빈 티커)
                    { ticker: 'NONAME', longName: '', percentWeight: 1.0 }, // 제거 (빈 이름)
                    { ticker: 'NOWEIGHT', longName: 'No Weight', percentWeight: '' }, // 제거 (빈 가중치)
                    { ticker: null, longName: 'Null Ticker', percentWeight: 1.0 }, // 제거 (null 티커)
                    { ticker: 'NULLNAME', longName: null, percentWeight: 1.0 }, // 제거 (null 이름)
                    { ticker: 'MISSING', longName: 'Missing Weight', percentWeight: null }, // 제거 (null 가중치)
                ]
            }
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockData,
        });

        const request = new Request('http://localhost:3000/api/holdings/VOO');
        const params = Promise.resolve({ symbol: 'VOO' });

        const response = await GET(request, { params });
        const data = await response.json();

        expect(data).toHaveLength(2);
        expect(data).toEqual(expect.arrayContaining([
            expect.objectContaining({ ticker: 'AAPL', name: 'Apple', weight: 5.0 }),
            expect.objectContaining({ ticker: 'MSFT', name: 'Microsoft', weight: 3.5 }),
        ]));
    });

    it('Invesco & (QQQ, QQQM) 데이터에서 티커, 이름, 가중치가 없거나 가중치가 0인 항목을 필터링한다', async () => {
        const mockData = {
            holdings: [
                { ticker: 'GOOGL', issuerName: 'Google', percentageOfTotalNetAssets: 5.0 }, // 유지
                { ticker: 'NVDA', issuerName: 'NVIDIA', percentageOfTotalNetAssets: 3.5 }, // 유지
                { ticker: 'CASH', issuerName: 'Cash', percentageOfTotalNetAssets: 0 }, // 제거 (0 가중치)
                { ticker: '', issuerName: 'Missing Ticker', percentageOfTotalNetAssets: 1.0 }, // 제거 (빈 티커)
                { ticker: 'NONAME', issuerName: '', percentageOfTotalNetAssets: 1.0 }, // 제거 (빈 이름)
                { ticker: 'ZERO', issuerName: 'Zero', percentageOfTotalNetAssets: null }, // 제거 (null 가중치)
            ]
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockData,
        });

        const request = new Request('http://localhost:3000/api/holdings/QQQ');
        const params = Promise.resolve({ symbol: 'QQQ' });

        const response = await GET(request, { params });
        const data = await response.json();

        expect(data).toHaveLength(2);
        expect(data).toEqual(expect.arrayContaining([
            expect.objectContaining({ ticker: 'GOOGL', name: 'Google', weight: 5.0 }),
            expect.objectContaining({ ticker: 'NVDA', name: 'NVIDIA', weight: 3.5 }),
        ]));
    });
});
