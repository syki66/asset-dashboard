import { NextResponse } from 'next/server';

const BASE_URL = 'https://query2.finance.yahoo.com/v1/finance/search';

// US 종목 코드를 받아서 티커를 반환
export async function GET(
  request: Request,
  { params }: { params: { ISIN: string } }
) {
  // 경로 파라미터에서 심볼 추출
  const { ISIN } = params;

  const fetchUrl = `${BASE_URL}?q=${ISIN}&newsCount=0`;

  try {
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from fetchUrl' },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({ symbol: data.quotes[0].symbol });
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
