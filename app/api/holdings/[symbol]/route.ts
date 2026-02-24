import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    const vanguardUrl = `https://investor.vanguard.com/investment-products/etfs/profile/api/${symbol.toUpperCase()}/portfolio-holding/stock?count=20000&asOfType=` // 상위 500개 종목만 가져옴
    const vtiUrl = `https://investor.vanguard.com/vmf/api/0970/portfolio-holding/stock.json?start=1&count=20000&asOfType=` // only VTI url (모든 종목 가져옴)
    const qqqUrl = `https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/QQQ/holdings/fund?idType=ticker&interval=monthly&productType=ETF`; // only QQQ url
    const qqqmUrl = `https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/46138G649/holdings/fund?idType=cusip&productType=ETF` // cusip 코드를 사용하면 다른 invesco ETF도 가져올 수 있음
    
    if (symbol.toUpperCase() === 'VTI') {
        return await fetchHoldings(vtiUrl, symbol);
    } else if (symbol.toUpperCase() === 'QQQ') {
        return await fetchHoldings(qqqUrl, symbol);
    } else if (symbol.toUpperCase() === 'QQQM') {
        return await fetchHoldings(qqqmUrl, symbol);
    } else {
        return await fetchHoldings(vanguardUrl, symbol);
    }
}

async function fetchHoldings(url: string, symbol: string) {
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch holdings for ${symbol}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        let formattedData: any[] = [];

        if (['QQQ', 'QQQM'].includes(symbol.toUpperCase())) {
            // Invesco (QQQ, QQQM)
            if (data.holdings && Array.isArray(data.holdings)) {
                formattedData = data.holdings.map((item: any) => ({
                    name: item.issuerName,
                    ticker: item.ticker,
                    weight: item.percentageOfTotalNetAssets
                }));
            }
        } else {
            // Vanguard (VTI, etc.)
            if (data.fund && data.fund.entity && Array.isArray(data.fund.entity)) {
                formattedData = data.fund.entity.map((item: any) => ({
                    name: item.longName,
                    ticker: item.ticker,
                    weight: parseFloat(item.percentWeight)
                }));
            }
        }

        // weight가 0이거나 유효하지 않은 항목, 그리고 ticker나 name이 없는 항목 제외
        const result = formattedData.filter(item => item.ticker && item.name && item.weight);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching holdings:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
