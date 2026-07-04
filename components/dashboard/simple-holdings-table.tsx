
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
import { DollarSign } from 'lucide-react';

interface SimpleHoldingsTableProps {
  stocks: StockProps[];
  themeColor: string;
}

export function SimpleHoldingsTable({ stocks, themeColor }: SimpleHoldingsTableProps) {
  const hoverBgVar = themeColor.replace('-theme)', '-hover-bg)');
  const currency = useCurrencyStore((state) => state.currency);
  const currencyUnit = currency === 'usd' ? 'USD' : '원';
  const formatAmount = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'usd' ? 2 : 0,
      maximumFractionDigits: currency === 'usd' ? 2 : 0,
    });

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[40px]"></TableHead>
          <TableHead>종목/수량</TableHead>
          <TableHead className="text-right">평가금/수익</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody style={{ '--row-hover-bg': hoverBgVar } as React.CSSProperties}>
        {stocks.map((stock) => {
          const isKoreanStock = stock.code?.startsWith('A');
          const avgPrice = getAverage(stock.balance.map((item) => item.price));
          const currentValue = stock.price * stock.balance.length;
          const profit = currentValue - (avgPrice * stock.balance.length);
          const returnRate = avgPrice > 0 ? (profit / (avgPrice * stock.balance.length)) * 100 : 0;
          const formattedQuantity = stock.balance.length.toLocaleString();
          const formattedCurrentValue = formatAmount(currentValue);
          const formattedProfit = formatAmount(profit);

          return (
            <TableRow
              key={stock.symbol}
              className="transition-colors hover:bg-[var(--row-hover-bg)]"
            >
              <TableCell>
                {isKoreanStock ? (
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center text-sm font-bold leading-none"
                    style={{ color: themeColor }}
                  >
                    ₩
                  </span>
                ) : (
                  <DollarSign className="h-4 w-4" style={{ color: themeColor }} />
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">{stock.shortName}</div>
                <div className="text-sm text-muted-foreground">{formattedQuantity} 주</div>
              </TableCell>
              <TableCell className="text-right">
                <div className="font-medium">
                  {formattedCurrentValue}
                  <span
                    className={`text-xs font-normal text-muted-foreground ${
                      currency === 'usd' ? 'ml-1' : ''
                    }`}
                  >
                    {currencyUnit}
                  </span>
                </div>
                <div className={`text-sm ${profit >= 0 ? 'text-rose-500' : 'text-blue-600'}`}>
                  {profit >= 0 ? '+' : ''}{formattedProfit}
                  <span
                    className={`text-xs font-normal ${
                      currency === 'usd' ? 'ml-1' : ''
                    }`}
                  >
                    {currencyUnit}
                  </span>
                  {' '}({returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%)
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
