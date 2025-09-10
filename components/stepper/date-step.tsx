import { useAccountDateStore } from '@/store/options';
import { CalendarPicker } from '../ui/calendar-picker';

export function DateStep() {
  const { accountDate, setAccountDate } = useAccountDateStore();

  return (
    <div className="flex justify-center">
      <CalendarPicker
        selectedDate={accountDate}
        onDateSelect={setAccountDate}
      />
    </div>
  );
}
