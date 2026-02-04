
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StockProps } from '@/types';
import { getAverage } from '@/utils/math';

interface DetailedHoldingsTableProps {
  stocks: StockProps[];
  themeColor: string;
}

export function DetailedHoldingsTable({ stocks, themeColor }: DetailedHoldingsTableProps) {
  const hoverBgVar = themeColor.replace('-theme)', '-hover-bg)');

  const calculateAveragePurchasePrice = (stock: StockProps) => {
    return getAverage(stock.balance.map((item) => item.price));
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>종목명</TableHead>
          <TableHead>티커</TableHead>
          <TableHead className="text-right">보유수량</TableHead>
          <TableHead className="text-right">평가금액</TableHead>
          <TableHead className="text-right">매수금액</TableHead>
          <TableHead className="text-right">손익</TableHead>
          <TableHead className="text-right">수익률</TableHead>
          <TableHead className="text-right">현재가</TableHead>
          <TableHead className="text-right">평균단가</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody style={{ '--row-hover-bg': hoverBgVar } as React.CSSProperties}>
        {stocks.map((stock) => {
          const avgPrice = calculateAveragePurchasePrice(stock);
          const currentValue = stock.price * stock.balance.length;
          const purchaseAmount = avgPrice * stock.balance.length; // 매수금액
          const gainLoss = currentValue - purchaseAmount; // 손익
          const returnRate = purchaseAmount > 0 ? (gainLoss / purchaseAmount) * 100 : 0; // 수익률

          return (
            <TableRow
              key={stock.symbol}
              className="transition-colors hover:bg-[var(--row-hover-bg)]"
            >
              <TableCell>{stock.shortName}</TableCell>
              <TableCell>{stock.symbol}</TableCell>
              <TableCell className="text-right">
                {stock.balance.length}
              </TableCell>
              <TableCell className="text-right">{currentValue.toFixed(2)}</TableCell>
              <TableCell className="text-right">{purchaseAmount.toFixed(2)}</TableCell>
              <TableCell className={`text-right ${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {gainLoss >= 0 ? '+' : ''}
                {gainLoss.toFixed(2)}
              </TableCell>
              <TableCell className={`text-right ${returnRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {returnRate >= 0 ? '+' : ''}
                {returnRate.toFixed(2)}%
              </TableCell>
              <TableCell className="text-right">{stock.price.toFixed(2)}</TableCell>
              <TableCell className="text-right">{avgPrice.toFixed(2)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
