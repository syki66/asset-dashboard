import type {
  AccountProps,
  DashboardProps,
  StockTradeHistoryProps,
} from '@/types';
import {
  convertToDashboardData,
  getDashboardDataByDate,
  mergeAccountData,
} from '@/utils/converter';
import { calculateXIRR } from '@/utils/xirr';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }

  return value;
};

const makeAccountDetails = (
  principalAmount: number,
  cash: number,
  benchmarkValue: number,
) => ({
  principalAmount,
  dividends: [],
  cash,
  stocksProfit: 0,
  stocks: [],
  stockTradeHistory: [],
  benchmarkBestValue: benchmarkValue,
  benchmarkBestNetValue: benchmarkValue,
  benchmarkWorstValue: benchmarkValue,
  benchmarkWorstNetValue: benchmarkValue,
});

const makeAccount = (
  date: string,
  principal: number,
  currentValue: number,
): AccountProps => ({
  date,
  lastUpdated: date,
  fxRate: 1300,
  krw: makeAccountDetails(principal, currentValue, currentValue),
  usd: makeAccountDetails(principal / 1300, 0, currentValue / 1300),
});

const getMwrScalars = (
  data: Pick<
    DashboardProps,
    'performance' | 'benchmarkBest' | 'benchmarkWorst'
  >,
) => ({
  performanceMwr: data.performance.mwr,
  performanceNetMwr: data.performance.netMwr,
  benchmarkBestMwr: data.benchmarkBest.mwr,
  benchmarkBestNetMwr: data.benchmarkBest.netMwr,
  benchmarkWorstMwr: data.benchmarkWorst.mwr,
  benchmarkWorstNetMwr: data.benchmarkWorst.netMwr,
});

describe('대시보드 변환 데이터셋', () => {
  // snapshots/charts 분리와 날짜 구간 조회를 검증하는 최소 시계열 데이터입니다.
  const accountData = [
    makeAccount('2024-01-01', 1000, 1000),
    makeAccount('2024-01-03', 1000, 1025),
    makeAccount('2024-01-05', 1000, 1050),
  ];

  test('날짜별 스냅샷과 전체 차트를 한 번만 분리해 생성한다', () => {
    const dataset = convertToDashboardData(accountData, 'krw');

    expect(dataset.snapshots).toHaveLength(3);
    expect(dataset.snapshots[0]).not.toHaveProperty('charts');
    expect(dataset.snapshots[0]).not.toHaveProperty('stocks');
    expect(dataset.accountData).toBe(accountData);
    expect(dataset.currency).toBe('krw');
    expect(dataset.charts.currentValue).toEqual([
      { date: '2024-01-01', value: 1000 },
      { date: '2024-01-03', value: 1025 },
      { date: '2024-01-05', value: 1050 },
    ]);

    const expectedMwr = calculateXIRR([
      { date: '2024-01-01', amount: -1000 },
      { date: '2024-01-05', amount: 1050 },
    ]);
    expect(dataset.snapshots.at(-1)?.performance.mwr).toBe(expectedMwr);
  });

  test('과거 조회는 가장 가까운 이전 스냅샷과 차트 prefix만 반환한다', () => {
    const dataset = convertToDashboardData(accountData, 'krw');
    const selected = getDashboardDataByDate(dataset, '2024-01-04');

    expect(selected?.date).toBe('2024-01-03');
    expect(selected?.charts.currentValue).toHaveLength(2);
    expect(selected?.charts.currentValue.at(-1)?.date).toBe('2024-01-03');
    expect(dataset.charts.currentValue).toHaveLength(3);
  });

  test('과거 날짜의 보유 종목만 조회 통화로 변환해 독립적으로 반환한다', () => {
    const pastAccount = makeAccount('2024-01-01', 1000, 1000);
    const latestAccount = makeAccount('2024-01-03', 1000, 1100);
    pastAccount.krw.stocks = [
      {
        shortName: 'KR',
        longName: 'Korean Stock',
        symbol: 'KR',
        code: 'KR',
        price: 100,
        balance: [{ date: '2024-01-01', price: 90, fxRate: 1200 }],
      },
    ];
    pastAccount.usd.stocks = [
      {
        shortName: 'US',
        longName: 'US Stock',
        symbol: 'US',
        code: 'US',
        price: 10,
        balance: [{ date: '2024-01-01', price: 8, fxRate: 1250 }],
      },
    ];
    latestAccount.krw.stocks = [
      {
        shortName: 'LATEST',
        longName: 'Latest Stock',
        symbol: 'LATEST',
        code: 'LATEST',
        price: 200,
        balance: [{ date: '2024-01-03', price: 180, fxRate: 1300 }],
      },
    ];
    const source = [pastAccount, latestAccount];
    const before = structuredClone(source);
    const dataset = convertToDashboardData(source, 'krw');

    const selected = getDashboardDataByDate(dataset, '2024-01-02');

    expect(selected?.date).toBe('2024-01-01');
    expect(selected?.stocks).toEqual([
      pastAccount.krw.stocks[0],
      {
        ...pastAccount.usd.stocks[0],
        price: 13000,
        balance: [
          {
            date: '2024-01-01',
            price: 10000,
            fxRate: 1250,
          },
        ],
      },
    ]);
    expect(selected?.stocks.map((stock) => stock.symbol)).not.toContain(
      'LATEST',
    );
    expect(selected?.stocks[0]).not.toBe(pastAccount.krw.stocks[0]);
    expect(selected?.stocks[0].balance[0]).not.toBe(
      pastAccount.krw.stocks[0].balance[0],
    );

    selected!.stocks[0].price = 999;
    selected!.stocks[0].balance[0].price = 999;
    selected!.stocks[1].balance.push({
      date: '2024-01-02',
      price: 999,
      fxRate: 1300,
    });

    expect(source).toEqual(before);
    expect(
      getDashboardDataByDate(dataset, '2024-01-02')?.stocks[0].price,
    ).toBe(100);

    const usdSelected = getDashboardDataByDate(
      convertToDashboardData(source, 'usd'),
      '2024-01-02',
    );
    expect(usdSelected?.stocks).toEqual([
      pastAccount.usd.stocks[0],
      {
        ...pastAccount.krw.stocks[0],
        price: 100 / 1300,
        balance: [
          {
            date: '2024-01-01',
            price: 90 / 1200,
            fxRate: 1200,
          },
        ],
      },
    ]);
    expect(source).toEqual(before);
  });

  test('최소일 이전은 첫 스냅샷을 사용한다', () => {
    const dataset = convertToDashboardData(accountData, 'krw');
    const selected = getDashboardDataByDate(dataset, '2023-12-01');

    expect(selected?.date).toBe('2024-01-01');
    expect(selected?.charts.currentValue).toHaveLength(1);
  });

  test('최신 조회는 전체 차트 객체를 복사하지 않고 재사용한다', () => {
    const dataset = convertToDashboardData(accountData, 'krw');
    const selected = getDashboardDataByDate(dataset, null);

    expect(selected?.date).toBe('2024-01-05');
    expect(selected?.charts).toBe(dataset.charts);
  });

  test('계좌 적용 시 모든 날짜의 MWR 차트를 미리 계산한다', () => {
    const dataset = convertToDashboardData(accountData, 'krw');

    expect(dataset.charts.mwr).toEqual(
      dataset.snapshots.map((snapshot) => ({
        date: snapshot.date,
        value: snapshot.performance.mwr,
      })),
    );
    expect(dataset.charts.netMwr).toEqual(
      dataset.snapshots.map((snapshot) => ({
        date: snapshot.date,
        value: snapshot.performance.netMwr,
      })),
    );
  });

  test.each([
    ['첫 스냅샷', '2024-01-01'],
    ['중간 스냅샷', '2024-08-01'],
    ['최신 스냅샷', '2025-01-01'],
  ])(
    '선계산된 %s의 6개 MWR 값은 선택 날짜 조회에서도 유지된다',
    (_label, targetDate) => {
      const multiFlowAccountData = [
        makeAccount('2024-01-01', 1000, 1050),
        makeAccount('2024-04-01', 1500, 1650),
        makeAccount('2024-08-01', 1200, 1480),
        makeAccount('2025-01-01', 1700, 2250),
      ];

      multiFlowAccountData.forEach((account, index) => {
        const benchmarkBestValue = [1100, 1750, 1600, 2400][index];
        const benchmarkWorstValue = [1020, 1570, 1350, 1950][index];

        account.krw.benchmarkBestValue = benchmarkBestValue;
        account.krw.benchmarkBestNetValue = benchmarkBestValue - 25;
        account.krw.benchmarkWorstValue = benchmarkWorstValue;
        account.krw.benchmarkWorstNetValue = benchmarkWorstValue - 25;
        account.usd.benchmarkBestValue = benchmarkBestValue / account.fxRate;
        account.usd.benchmarkBestNetValue =
          (benchmarkBestValue - 25) / account.fxRate;
        account.usd.benchmarkWorstValue = benchmarkWorstValue / account.fxRate;
        account.usd.benchmarkWorstNetValue =
          (benchmarkWorstValue - 25) / account.fxRate;
      });

      const dataset = convertToDashboardData(multiFlowAccountData, 'krw');
      const selected = getDashboardDataByDate(dataset, targetDate);
      const snapshot = dataset.snapshots.find(
        (item) => item.date === targetDate,
      );

      expect(selected).toBeDefined();
      expect(snapshot).toBeDefined();
      expect(getMwrScalars(selected!)).toEqual(getMwrScalars(snapshot!));
    },
  );

  test('과거 조회의 모든 차트는 선택 스냅샷 이후 배당과 거래를 제외한다', () => {
    // 실제 AccountData처럼 각 날짜가 그날까지의 배당·거래를 누적해 보유합니다.
    const dividendEvents = [
      {
        date: '2024-01-01',
        price: 10,
        fxRate: 1300,
        dividendSource: 'domestic' as const,
      },
      {
        date: '2024-01-03',
        price: 20,
        fxRate: 1300,
        dividendSource: 'domestic' as const,
      },
      {
        date: '2024-01-05',
        price: 30,
        fxRate: 1300,
        dividendSource: 'domestic' as const,
      },
    ];
    const usdDividendEvents = [
      {
        date: '2024-01-03',
        price: 1,
        fxRate: 1300,
        dividendSource: 'foreign' as const,
      },
      {
        date: '2024-01-05',
        price: 2,
        fxRate: 1300,
        dividendSource: 'foreign' as const,
      },
    ];
    const tradeEvents: StockTradeHistoryProps[] = [
      {
        date: '2024-01-01',
        type: 'buy' as const,
        fxRate: 1300,
        pricesBySymbol: { BASE: [100] },
        namesBySymbol: { BASE: 'Base' },
      },
      {
        date: '2024-01-03',
        type: 'buy' as const,
        fxRate: 1300,
        pricesBySymbol: { MID: [200] },
        namesBySymbol: { MID: 'Middle' },
      },
      {
        date: '2024-01-03',
        type: 'sell' as const,
        fxRate: 1300,
        pricesBySymbol: { BASE: [110] },
        namesBySymbol: { BASE: 'Base' },
      },
      {
        date: '2024-01-05',
        type: 'buy' as const,
        fxRate: 1300,
        pricesBySymbol: { FUTURE: [300] },
        namesBySymbol: { FUTURE: 'Future' },
      },
    ];
    const eventAccountData = [
      makeAccount('2024-01-01', 1000, 1000),
      makeAccount('2024-01-03', 1000, 1025),
      makeAccount('2024-01-05', 1000, 1050),
    ].map((account) => {
      account.krw.dividends = dividendEvents
        .filter((dividend) => dividend.date <= account.date)
        .map((dividend) => ({ ...dividend }));
      account.usd.dividends = usdDividendEvents
        .filter((dividend) => dividend.date <= account.date)
        .map((dividend) => ({ ...dividend }));
      account.krw.stockTradeHistory = tradeEvents
        .filter((trade) => trade.date <= account.date)
        .map((trade) => ({
          ...trade,
          pricesBySymbol: Object.fromEntries(
            Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
              symbol,
              [...prices],
            ]),
          ),
          namesBySymbol: { ...trade.namesBySymbol },
        }));
      return account;
    });

    const dataset = convertToDashboardData(eventAccountData, 'krw');
    const selected = getDashboardDataByDate(dataset, '2024-01-04');

    expect(selected?.date).toBe('2024-01-03');
    expect(dataset.charts.dividendHistory).toEqual([
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-03', value: 1300 },
      { date: '2024-01-03', value: 20 },
      { date: '2024-01-05', value: 2600 },
      { date: '2024-01-05', value: 30 },
    ]);
    expect(
      dataset.charts.stockTradeHistory.map(
        ({ date, type, priceBySymbol }) => ({
          date,
          type,
          priceBySymbol,
        }),
      ),
    ).toEqual([
      { date: '2024-01-01', type: 'buy', priceBySymbol: { BASE: 100 } },
      { date: '2024-01-03', type: 'buy', priceBySymbol: { MID: 200 } },
      { date: '2024-01-03', type: 'sell', priceBySymbol: { BASE: 110 } },
      { date: '2024-01-05', type: 'buy', priceBySymbol: { FUTURE: 300 } },
    ]);
    expect(
      dataset.charts.dividendHistory.some(
        (point) => point.date === '2024-01-05',
      ),
    ).toBe(true);
    expect(
      dataset.charts.stockTradeHistory.some(
        (point) => point.date === '2024-01-05',
      ),
    ).toBe(true);
    expect(
      selected?.charts.stockTradeHistory.filter(
        (point) => point.date === '2024-01-03',
      ),
    ).toHaveLength(2);

    Object.entries(selected!.charts).forEach(([seriesName, series]) => {
      expect({
        seriesName,
        futureDates: series
          .filter((point) => point.date > selected!.date)
          .map((point) => point.date),
      }).toEqual({
        seriesName,
        futureDates: [],
      });
    });
  });

  test('다계좌 병합은 입력을 변경하지 않고 누적 배열을 합산한다', () => {
    const first = makeAccount('2024-01-01', 1000, 1000);
    const second = makeAccount('2024-01-01', 2000, 2000);
    first.krw.benchmarkBestValue = 0;
    first.krw.benchmarkBestNetValue = 0;
    second.krw.benchmarkBestValue = 0;
    second.krw.benchmarkBestNetValue = 0;
    first.krw.dividends = [
      { date: '2024-01-01', price: 10, fxRate: 1300 },
    ];
    second.krw.dividends = [
      { date: '2024-01-01', price: 20, fxRate: 1300 },
    ];
    first.krw.stocks = [
      {
        shortName: 'A',
        longName: 'Stock A',
        symbol: 'A',
        code: 'A',
        price: 100,
        balance: [{ date: '2024-01-01', price: 100, fxRate: 1300 }],
      },
    ];
    second.krw.stocks = [
      {
        shortName: 'A',
        longName: 'Stock A',
        symbol: 'A',
        code: 'A',
        price: 100,
        balance: [{ date: '2024-01-01', price: 110, fxRate: 1300 }],
      },
    ];
    first.krw.stockTradeHistory = [
      {
        date: '2024-01-01',
        type: 'buy',
        fxRate: 1300,
        pricesBySymbol: { A: [100] },
      },
    ];
    second.krw.stockTradeHistory = [
      {
        date: '2024-01-01',
        type: 'buy',
        fxRate: 1300,
        pricesBySymbol: { A: [110] },
      },
    ];

    const inputs = [
      {
        name: 'first.csv',
        accountData: [first],
        benchmarkBestData: [
          {
            date: '2024-01-01',
            benchmarkValueKrw: 1000,
            benchmarkValueUsd: 1,
            benchmarkNetValueKrw: 900,
            benchmarkNetValueUsd: 0.9,
          },
        ],
      },
      {
        name: 'second.csv',
        accountData: [second],
        benchmarkBestData: [
          {
            date: '2024-01-01',
            benchmarkValueKrw: 2000,
            benchmarkValueUsd: 2,
            benchmarkNetValueKrw: 1800,
            benchmarkNetValueUsd: 1.8,
          },
        ],
      },
    ];
    const before = structuredClone(inputs);
    // readonly 입력을 구조적으로 공유해도 병합 중 변경되지 않아야 합니다.
    deepFreeze(inputs);

    const [merged] = mergeAccountData(inputs);

    expect(inputs).toEqual(before);
    expect(merged).not.toBe(first);
    expect(merged.krw).not.toBe(first.krw);
    expect(merged.usd).not.toBe(first.usd);
    expect(merged.krw.principalAmount).toBe(3000);
    expect(merged.krw.dividends).toEqual([
      { date: '2024-01-01', price: 30, fxRate: 1300 },
    ]);
    expect(merged.krw.dividends[0]).not.toBe(first.krw.dividends[0]);
    expect(merged.krw.stocks[0]).not.toBe(first.krw.stocks[0]);
    expect(merged.krw.stocks[0].balance).not.toBe(
      first.krw.stocks[0].balance,
    );
    expect(merged.krw.stocks[0].balance).toHaveLength(2);
    expect(merged.krw.stocks[0].balance[0]).toBe(
      first.krw.stocks[0].balance[0],
    );
    expect(merged.krw.stocks[0].balance[1]).toBe(
      second.krw.stocks[0].balance[0],
    );
    expect(merged.krw.stockTradeHistory[0]).not.toBe(
      first.krw.stockTradeHistory[0],
    );
    expect(merged.krw.stockTradeHistory[0].pricesBySymbol.A).not.toBe(
      first.krw.stockTradeHistory[0].pricesBySymbol.A,
    );
    expect(merged.krw.stockTradeHistory[0].pricesBySymbol.A).toEqual([
      100, 110,
    ]);
    expect(merged.krw.benchmarkBestValue).toBe(3000);
    expect(merged.krw.benchmarkBestNetValue).toBe(2700);
  });

  test('단일 계좌 병합은 shell만 복제하고 immutable collection을 공유한다', () => {
    const account = makeAccount('2024-01-01', 1000, 1000);
    account.krw.dividends = [
      { date: '2024-01-01', price: 10, fxRate: 1300 },
    ];
    account.krw.stocks = [
      {
        shortName: 'A',
        longName: 'Stock A',
        symbol: 'A',
        code: 'A',
        price: 100,
        balance: [{ date: '2024-01-01', price: 100, fxRate: 1300 }],
      },
    ];
    account.krw.stockTradeHistory = [
      {
        date: '2024-01-01',
        type: 'buy',
        fxRate: 1300,
        pricesBySymbol: { A: [100] },
        namesBySymbol: { A: 'Stock A' },
      },
    ];
    account.usd.dividends = [
      { date: '2024-01-01', price: 1, fxRate: 1300 },
    ];
    const inputs = [{ name: 'only.csv', accountData: [account] }];
    const before = structuredClone(inputs);
    // 단일 계좌의 collection 참조 재사용은 readonly 계약이 보장합니다.
    deepFreeze(inputs);

    const [merged] = mergeAccountData(inputs);

    expect(inputs).toEqual(before);
    expect(merged).not.toBe(account);
    expect(merged.krw).not.toBe(account.krw);
    expect(merged.usd).not.toBe(account.usd);
    expect(merged.krw.dividends).toBe(account.krw.dividends);
    expect(merged.krw.stocks).toBe(account.krw.stocks);
    expect(merged.krw.stocks[0]).toBe(account.krw.stocks[0]);
    expect(merged.krw.stocks[0].balance).toBe(
      account.krw.stocks[0].balance,
    );
    expect(merged.krw.stocks[0].balance[0]).toBe(
      account.krw.stocks[0].balance[0],
    );
    expect(merged.krw.stockTradeHistory).toBe(
      account.krw.stockTradeHistory,
    );
    expect(merged.krw.stockTradeHistory[0].pricesBySymbol.A).toBe(
      account.krw.stockTradeHistory[0].pricesBySymbol.A,
    );
    expect(merged.krw.stockTradeHistory[0].namesBySymbol).toBe(
      account.krw.stockTradeHistory[0].namesBySymbol,
    );
  });
});
