import { useDashboardDateStore } from '@/store/options';
import { CalendarPicker } from '../ui/calendar-picker';

export function DateStep() {
  const { dashboardDate, setDashboardDate } = useDashboardDateStore();
  const today = new Date();

  return (
    <div className='flex justify-center'>
      <CalendarPicker
        selectedDate={dashboardDate}
        onDateSelect={setDashboardDate}
        maxDate={today}
        className='border-white/10'
      />
    </div>
  );
}
