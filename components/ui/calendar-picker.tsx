'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarPickerProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
  category?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  className,
  category,
  minDate,
  maxDate,
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

  const normalizeDate = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const isSelectableDate = (date: Date) => {
    const target = normalizeDate(date);
    if (minDate && target < normalizeDate(minDate)) return false;
    if (maxDate && target > normalizeDate(maxDate)) return false;
    return true;
  };
  const isTodaySelectable = isSelectableDate(today);

  const getMonthIndex = (date: Date) =>
    date.getFullYear() * 12 + date.getMonth();

  const canNavigateToMonth = (date: Date) => {
    const target = getMonthIndex(date);
    if (minDate && target < getMonthIndex(minDate)) return false;
    if (maxDate && target > getMonthIndex(maxDate)) return false;
    return true;
  };

  const clampViewDate = (date: Date) => {
    if (minDate && getMonthIndex(date) < getMonthIndex(minDate)) {
      return new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    }
    if (maxDate && getMonthIndex(date) > getMonthIndex(maxDate)) {
      return new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    }
    return date;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (!isSelectableDate(newDate)) return;
    setCurrentDate(newDate);
    onDateSelect?.(newDate);
  };

  const handleTodayClick = () => {
    const todayDate = new Date();
    if (!isSelectableDate(todayDate)) return;
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
    if (!canNavigateToMonth(newViewDate)) return;
    setViewDate(newViewDate);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newViewDate = new Date(viewDate);
    if (direction === 'prev') {
      newViewDate.setFullYear(newViewDate.getFullYear() - 1);
    } else {
      newViewDate.setFullYear(newViewDate.getFullYear() + 1);
    }
    setViewDate(clampViewDate(newViewDate));
  };

  const prevMonthDate = new Date(viewDate);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const nextMonthDate = new Date(viewDate);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

  const canNavigatePrevMonth = canNavigateToMonth(prevMonthDate);
  const canNavigateNextMonth = canNavigateToMonth(nextMonthDate);
  const canNavigatePrevYear =
    !minDate || getMonthIndex(viewDate) > getMonthIndex(minDate);
  const canNavigateNextYear =
    !maxDate || getMonthIndex(viewDate) < getMonthIndex(maxDate);

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
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const isSelectable = isSelectableDate(date);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={!isSelectable}
          className={cn(
            'h-10 w-10 rounded-md text-sm font-medium transition-colors cursor-pointer',
            !isSelectable &&
              'cursor-not-allowed text-muted-foreground/35 opacity-45 hover:bg-transparent hover:text-muted-foreground/35',
            isSelectable &&
              !isSelectedDay &&
              'hover:bg-[var(--calendar-hover)] hover:text-[color:var(--calendar-theme)]',
            'focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
            isCurrentDay &&
              isSelectable &&
              !isSelectedDay &&
              'border border-[color:var(--calendar-theme)]/25 bg-[var(--calendar-hover)] text-[color:var(--calendar-theme)] font-semibold',
            isSelectedDay &&
              isSelectable &&
              'bg-[image:var(--calendar-selected-bg)] text-white font-semibold hover:text-white',
            isSelectable && !isCurrentDay && !isSelectedDay && 'text-foreground'
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

  const calendarStyle = {
    '--calendar-theme': category
      ? `var(--${category}-theme)`
      : 'var(--setup-primary,var(--primary))',
    '--calendar-hover': category
      ? `var(--${category}-hover-bg)`
      : 'color-mix(in oklch, var(--setup-primary,var(--primary)) 8%, transparent)',
    '--calendar-selected-bg': category
      ? `linear-gradient(135deg, color-mix(in oklch, var(--${category}-theme) 86%, transparent), color-mix(in oklch, var(--${category}-theme) 62%, transparent))`
      : 'linear-gradient(135deg, color-mix(in oklch, var(--setup-primary,var(--primary)) 86%, transparent), color-mix(in oklch, var(--setup-secondary,var(--primary)) 62%, transparent))',
  } as React.CSSProperties;

  return (
    <Card
      className={cn(
        'liquid-glass-surface p-4 w-fit',
        className,
      )}
      style={calendarStyle}
    >
      <div className="space-y-4">
        {/* Header with navigation and today button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              title="이전 연도"
              onClick={() => navigateYear('prev')}
              disabled={!canNavigatePrevYear}
              className={cn(
                "h-7 w-7 cursor-pointer",
                "border-white/10 bg-transparent text-[color:var(--calendar-theme)] hover:bg-[var(--calendar-hover)] hover:text-[color:var(--calendar-theme)]",
                !canNavigatePrevYear && "cursor-not-allowed opacity-45",
              )}
              aria-label="이전 연도"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              title="이전 달"
              onClick={() => navigateMonth('prev')}
              disabled={!canNavigatePrevMonth}
              className={cn(
                "h-7 w-7 cursor-pointer",
                "border-white/10 bg-transparent text-[color:var(--calendar-theme)] hover:bg-[var(--calendar-hover)] hover:text-[color:var(--calendar-theme)]",
                !canNavigatePrevMonth && "cursor-not-allowed opacity-45",
              )}
              aria-label="이전 달"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h2
              className={cn(
                "text-base font-semibold min-w-[6.25rem] text-center",
                "text-[color:var(--calendar-theme)]"
              )}
            >
              {viewDate.getFullYear()}년 {monthNames[viewDate.getMonth()]}
            </h2>

            <Button
              variant="outline"
              size="icon"
              title="다음 달"
              onClick={() => navigateMonth('next')}
              disabled={!canNavigateNextMonth}
              className={cn(
                "h-7 w-7 cursor-pointer",
                "border-white/10 bg-transparent text-[color:var(--calendar-theme)] hover:bg-[var(--calendar-hover)] hover:text-[color:var(--calendar-theme)]",
                !canNavigateNextMonth && "cursor-not-allowed opacity-45",
              )}
              aria-label="다음 달"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              title="다음 연도"
              onClick={() => navigateYear('next')}
              disabled={!canNavigateNextYear}
              className={cn(
                "h-7 w-7 cursor-pointer",
                "border-white/10 bg-transparent text-[color:var(--calendar-theme)] hover:bg-[var(--calendar-hover)] hover:text-[color:var(--calendar-theme)]",
                !canNavigateNextYear && "cursor-not-allowed opacity-45",
              )}
              aria-label="다음 연도"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleTodayClick}
            disabled={!isTodaySelectable}
            className={cn(
              'interactive-lift ml-1 h-7 cursor-pointer border-transparent px-2 text-xs font-medium shadow-sm',
              !isTodaySelectable && "cursor-not-allowed opacity-45",
              "bg-[color:var(--calendar-theme)] text-white hover:bg-[color:var(--calendar-theme)]",
            )}
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
