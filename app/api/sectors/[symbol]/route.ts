import { NextResponse } from 'next/server';

type SectorWeight = {
  name: string;
  weight: number;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  if (upperSymbol === 'VTI') {
    return fetchSectors(
      'https://investor.vanguard.com/vmf/api/VTI/diversification?isInternal=true&isBfpDiversificationToggle=false',
      upperSymbol,
    );
  }

  if (upperSymbol === 'QQQM') {
    return fetchSectors(
      'https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/QQQM/weightedHoldings/fund?idType=ticker&productType=ETF&breakdown=sector',
      upperSymbol,
    );
  }

  return NextResponse.json([]);
}

async function fetchSectors(url: string, symbol: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch sectors for ${symbol}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const formattedData =
      symbol === 'QQQM'
        ? formatInvescoSectors(data)
        : formatVanguardSectors(data);

    const result = formattedData.filter(
      (item) => item.name && Number.isFinite(item.weight) && item.weight > 0,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching sectors:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

function formatInvescoSectors(data: any): SectorWeight[] {
  if (!Array.isArray(data.holdingWeights)) return [];

  return data.holdingWeights.map((item: any) => ({
    name: item.name,
    weight: Number(item.value),
  }));
}

function formatVanguardSectors(data: any): SectorWeight[] {
  const sectors = data.sector?.long?.[0]?.item;
  if (!Array.isArray(sectors)) return [];

  return sectors.map((item: any) => ({
    name: item.name,
    weight: Number(item.currYrPct),
  }));
}
