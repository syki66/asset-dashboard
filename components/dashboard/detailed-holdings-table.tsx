
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StockProps } from '@/types';
import { useCurrencyStore } from '@/store/options';
import { getAverage } from '@/utils/math';

interface DetailedHoldingsTableProps {
  stocks: StockProps[];
  themeColor: string;
}

export function DetailedHoldingsTable({ stocks, themeColor }: DetailedHoldingsTableProps) {
  const hoverBgVar = themeColor.replace('-theme)', '-hover-bg)');
  const currency = useCurrencyStore((state) => state.currency);
  const currencyUnit = currency === 'usd' ? 'USD' : 'KRW';
  const formatAmount = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'usd' ? 2 : 0,
      maximumFractionDigits: currency === 'usd' ? 2 : 0,
    });

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
          const formattedQuantity = stock.balance.length.toLocaleString();
          const formattedCurrentValue = formatAmount(currentValue);
          const formattedPurchaseAmount = formatAmount(purchaseAmount);
          const formattedGainLoss = formatAmount(gainLoss);
          const formattedPrice = formatAmount(stock.price);
          const formattedAvgPrice = formatAmount(avgPrice);
          const amountWithUnit = (value: string) => (
            <>
              {value}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                {currencyUnit}
              </span>
            </>
          );

          return (
            <TableRow
              key={stock.symbol}
              className="transition-colors hover:bg-[var(--row-hover-bg)]"
            >
              <TableCell>{stock.shortName}</TableCell>
              <TableCell>{stock.symbol}</TableCell>
              <TableCell className="text-right">
                {formattedQuantity}
              </TableCell>
              <TableCell className="text-right">{amountWithUnit(formattedCurrentValue)}</TableCell>
              <TableCell className="text-right">{amountWithUnit(formattedPurchaseAmount)}</TableCell>
              <TableCell className={`text-right ${gainLoss >= 0 ? 'text-rose-500' : 'text-sky-500'}`}>
                {gainLoss >= 0 ? '+' : ''}
                {amountWithUnit(formattedGainLoss)}
              </TableCell>
              <TableCell className={`text-right ${returnRate >= 0 ? 'text-rose-500' : 'text-sky-500'}`}>
                {returnRate >= 0 ? '+' : ''}
                {returnRate.toFixed(2)}%
              </TableCell>
              <TableCell className="text-right">{amountWithUnit(formattedPrice)}</TableCell>
              <TableCell className="text-right">{amountWithUnit(formattedAvgPrice)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
