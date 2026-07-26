import { useDashboardDateStore } from '@/store/options';
import { CalendarPicker } from '../ui/calendar-picker';

export function DateStep() {
  const { dashboardDate, setDashboardDate } = useDashboardDateStore();
  const today = new Date();

  return (
    <div className='flex justify-center lg:rounded-2xl lg:border lg:border-white/10 lg:bg-white/[0.02] lg:p-4 lg:shadow-sm'>
      <div className='contents lg:block lg:rounded-xl lg:border lg:border-white/10 lg:bg-white/[0.02] lg:p-2'>
        <CalendarPicker
          selectedDate={dashboardDate}
          onDateSelect={setDashboardDate}
          maxDate={today}
          className='border-white/10'
        />
      </div>
    </div>
  );
}
