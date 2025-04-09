import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '../date-range-picker';
import { Button } from '@/components/ui/button';
import { addDays, format } from 'date-fns';
import { CalendarRange } from 'lucide-react';

interface DateStepProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
}

export default function DateStep({
  dateRange,
  onDateRangeChange,
}: DateStepProps) {
  return (
    <>
      <div className="space-y-4">
        <div className="mt-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              onDateRangeChange({
                from: addDays(today, -30),
                to: today,
              });
            }}
          >
            최근 1개월
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              onDateRangeChange({
                from: addDays(today, -90),
                to: today,
              });
            }}
          >
            최근 3개월
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              onDateRangeChange({
                from: addDays(today, -180),
                to: today,
              });
            }}
          >
            최근 6개월
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              onDateRangeChange({
                from: addDays(today, -365),
                to: today,
              });
            }}
          >
            최근 1년
          </Button>
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onDateRangeChange(undefined);
            }}
          >
            날짜 범위 초기화
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            날짜 범위를 초기화하면 모든 데이터가 표시됩니다.
          </p>
        </div>

        {dateRange?.from && dateRange?.to && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <div className="flex items-center">
              <CalendarRange className="h-5 w-5 mr-2 text-primary" />
              <span className="font-medium">현재 선택된 날짜 범위:</span>
            </div>
            <p className="mt-1">
              {format(dateRange.from, 'yyyy년 MM월 dd일')} -{' '}
              {format(dateRange.to, 'yyyy년 MM월 dd일')}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
