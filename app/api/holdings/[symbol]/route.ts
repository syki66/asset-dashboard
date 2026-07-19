import { NextResponse } from 'next/server';

type Holding = {
  name: string;
  ticker: string;
  weight: number;
};

type InvescoHolding = {
  issuerName?: string;
  ticker?: string;
  percentageOfTotalNetAssets?: number | string;
};

type VanguardHolding = {
  longName?: string;
  ticker?: string;
  percentWeight?: number | string;
};

type InvescoHoldingsResponse = {
  holdings?: InvescoHolding[];
};

type VanguardHoldingsResponse = {
  fund?: {
    entity?: VanguardHolding[];
  };
};

type HoldingsProvider = 'invesco' | 'vanguard';

const isCusip = (value: string | null) =>
  Boolean(value && /^[A-Z0-9]{9}$/.test(value));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  const searchParams = new URL(request.url).searchParams;
  const provider = searchParams.get('provider');
  const cusip = searchParams.get('cusip')?.toUpperCase() ?? null;

  const vanguardUrl = `https://investor.vanguard.com/investment-products/etfs/profile/api/${upperSymbol}/portfolio-holding/stock?count=20000&asOfType=`; // 상위 500개 종목만 가져옴
  const vtiUrl =
    'https://investor.vanguard.com/vmf/api/0970/portfolio-holding/stock.json?start=1&count=20000&asOfType='; // only VTI url (모든 종목 가져옴)

  if (upperSymbol === 'VTI') {
    return fetchHoldings(vtiUrl, symbol, 'vanguard');
  }

  if (provider === 'invesco') {
    const identifier = isCusip(cusip) ? cusip : upperSymbol;
    const idType = isCusip(cusip) ? 'cusip' : 'ticker';
    const invescoUrl = `https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/${encodeURIComponent(identifier)}/holdings/fund?idType=${idType}&productType=ETF`; // idType이 ticker인 경우 호출 안되는 ETF가 있음 (QQQ는 가능, QQQM은 불가능)

    return fetchHoldings(invescoUrl, symbol, 'invesco');
  }

  return fetchHoldings(vanguardUrl, symbol, 'vanguard');
}

async function fetchHoldings(
  url: string,
  symbol: string,
  provider: HoldingsProvider,
) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch holdings for ${symbol}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    let formattedData: Holding[] = [];

    if (provider === 'invesco') {
      // Invesco ETF
      const invescoData = data as InvescoHoldingsResponse;

      if (Array.isArray(invescoData.holdings)) {
        formattedData = invescoData.holdings.map((item) => ({
          name: item.issuerName ?? '',
          ticker: item.ticker ?? '',
          weight: Number(item.percentageOfTotalNetAssets),
        }));
      }
    } else {
      // Vanguard ETF
      const vanguardData = data as VanguardHoldingsResponse;

      if (Array.isArray(vanguardData.fund?.entity)) {
        formattedData = vanguardData.fund.entity.map((item) => ({
          name: item.longName ?? '',
          ticker: item.ticker ?? '',
          weight: Number(item.percentWeight),
        }));
      }
    }

    // weight가 0이거나 유효하지 않은 항목, 그리고 ticker나 name이 없는 항목 제외
    const result = formattedData.filter(
      (item) => item.ticker && item.name && item.weight,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
