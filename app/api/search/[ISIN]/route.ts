import { NextResponse } from 'next/server';

const BASE_URL = 'https://query2.finance.yahoo.com/v1/finance/search';
const REVALIDATE_SECONDS = 60 * 60 * 24;

// US 종목 코드를 받아서 티커를 반환
export async function GET(
  request: Request,
  context: { params: Promise<{ ISIN: string }> }
) {
  // 경로 파라미터에서 ISIN 추출
  const { ISIN } = await context.params;

  const fetchUrl = `${BASE_URL}?q=${ISIN}&newsCount=0`;

  try {
    const response = await fetch(fetchUrl, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from fetchUrl' },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      symbol: data.quotes[0].symbol,
      shortName: data.quotes[0].shortname,
      longName: data.quotes[0].longname,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
