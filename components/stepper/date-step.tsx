import { useDashboardDateStore } from '@/store/options';
import { CalendarPicker } from '../ui/calendar-picker';

export function DateStep() {
  const { dashboardDate, setDashboardDate } = useDashboardDateStore();

  return (
    <div className="flex justify-center">
      <CalendarPicker
        selectedDate={dashboardDate}
        onDateSelect={setDashboardDate}
      />
    </div>
  );
}
