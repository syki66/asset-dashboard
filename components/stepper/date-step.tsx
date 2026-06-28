import { useDashboardDateStore } from '@/store/options';
import { CalendarPicker } from '../ui/calendar-picker';

export function DateStep() {
  const { dashboardDate, setDashboardDate } = useDashboardDateStore();
  const today = new Date();

  return (
    <div className='flex justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-sm'>
      <div className='rounded-xl border border-white/10 bg-white/[0.02] p-2'>
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
