
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
import { DollarSign } from 'lucide-react'; // Placeholder icon

interface SimpleHoldingsTableProps {
  stocks: StockProps[];
  themeColor: string;
}

export function SimpleHoldingsTable({ stocks, themeColor }: SimpleHoldingsTableProps) {
  const hoverBgVar = themeColor.replace('-theme)', '-hover-bg)');

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
          const avgPrice = getAverage(stock.balance.map((item) => item.price));
          const currentValue = stock.price * stock.balance.length;
          const profit = currentValue - (avgPrice * stock.balance.length);
          const returnRate = avgPrice > 0 ? (profit / (avgPrice * stock.balance.length)) * 100 : 0;

          return (
            <TableRow
              key={stock.symbol}
              className="transition-colors hover:bg-[var(--row-hover-bg)]"
            >
              <TableCell><DollarSign className="h-4 w-4" style={{ color: themeColor }} /></TableCell>
              <TableCell>
                <div className="font-medium">{stock.shortName}</div>
                <div className="text-sm text-muted-foreground">{stock.balance.length} 주</div>
              </TableCell>
              <TableCell className="text-right">
                <div className="font-medium">{currentValue.toFixed(2)}</div>
                <div className={`text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%)
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
