import { NextResponse } from 'next/server';

type SectorWeight = {
  name: string;
  weight: number;
};

type InvescoSector = {
  name?: string;
  value?: number | string;
};

type InvescoSectorsResponse = {
  holdingWeights?: InvescoSector[];
};

type VanguardSector = {
  name?: string;
  currYrPct?: number | string;
};

type VanguardSectorsResponse = {
  sector?: {
    long?: {
      item?: VanguardSector[];
    }[];
  };
};

type SectorProvider = 'invesco' | 'vanguard';

const REVALIDATE_SECONDS = 60 * 60 * 24;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  const provider = new URL(request.url).searchParams.get('provider');

  if (provider === 'vanguard') {
    return fetchSectors(
      `https://investor.vanguard.com/vmf/api/${encodeURIComponent(upperSymbol)}/diversification?isInternal=true&isBfpDiversificationToggle=false`,
      upperSymbol,
      'vanguard',
    );
  }

  if (provider === 'invesco') {
    return fetchSectors(
      `https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/${encodeURIComponent(upperSymbol)}/weightedHoldings/fund?idType=ticker&productType=ETF&breakdown=sector`,
      upperSymbol,
      'invesco',
    );
  }

  return NextResponse.json([]);
}

async function fetchSectors(
  url: string,
  symbol: string,
  provider: SectorProvider,
) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch sectors for ${symbol}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const formattedData =
      provider === 'invesco'
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

function formatInvescoSectors(data: InvescoSectorsResponse): SectorWeight[] {
  if (!Array.isArray(data.holdingWeights)) return [];

  return data.holdingWeights.map((item) => ({
    name: item.name ?? '',
    weight: Number(item.value),
  }));
}

function formatVanguardSectors(data: VanguardSectorsResponse): SectorWeight[] {
  const sectors = data.sector?.long?.[0]?.item;
  if (!Array.isArray(sectors)) return [];

  return sectors.map((item) => ({
    name: item.name ?? '',
    weight: Number(item.currYrPct),
  }));
}
