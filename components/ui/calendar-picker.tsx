'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarPickerProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  className,
}: CalendarPickerProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewDate, setViewDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );

  const today = new Date();
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  ).getDay();
  const monthNames = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setCurrentDate(newDate);
    onDateSelect?.(newDate);
  };

  const handleTodayClick = () => {
    const todayDate = new Date();
    setCurrentDate(todayDate);
    setViewDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    onDateSelect?.(todayDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newViewDate = new Date(viewDate);
    if (direction === 'prev') {
      newViewDate.setMonth(newViewDate.getMonth() - 1);
    } else {
      newViewDate.setMonth(newViewDate.getMonth() + 1);
    }
    setViewDate(newViewDate);
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      currentDate.getDate() === day &&
      currentDate.getMonth() === viewDate.getMonth() &&
      currentDate.getFullYear() === viewDate.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day);
      const isSelectedDay = isSelected(day);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={cn(
            'h-10 w-10 rounded-md text-sm font-medium transition-colors cursor-pointer',
            'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300',
            'focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
            isCurrentDay &&
              !isSelectedDay &&
              'bg-accent/20 text-accent-foreground font-semibold',
            isSelectedDay && 'bg-primary text-primary-foreground font-semibold',
            !isCurrentDay && !isSelectedDay && 'text-foreground'
          )}
          aria-label={`${viewDate.getFullYear()}년 ${
            viewDate.getMonth() + 1
          }월 ${day}일`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <Card className={cn('p-4 w-fit', className)}>
      <div className="space-y-4">
        {/* Header with navigation and today button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 cursor-pointer"
              aria-label="이전 달"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h2 className="text-lg font-semibold text-foreground min-w-[120px] text-center">
              {viewDate.getFullYear()}년 {monthNames[viewDate.getMonth()]}
            </h2>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 cursor-pointer"
              aria-label="다음 달"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleTodayClick}
            className="ml-4 font-medium cursor-pointer"
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            오늘
          </Button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

        {/* Selected date display */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            선택된 날짜:{' '}
            <span className="font-medium text-foreground">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월{' '}
              {currentDate.getDate()}일
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}
