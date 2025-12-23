import { useState } from 'react';
import type { Booking, User } from '../types';

interface CalendarViewProps {
  bookings: Booking[];
  users: User[];
  currentUserId: string;
  onSelectBooking?: (bookingId: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-400 border-amber-500 text-amber-900';
    case 'confirmed':
      return 'bg-blue-400 border-blue-500 text-blue-900';
    case 'in-progress':
      return 'bg-green-400 border-green-500 text-green-900';
    case 'completed':
      return 'bg-zinc-300 border-zinc-400 text-zinc-700';
    case 'cancelled':
      return 'bg-red-400 border-red-500 text-red-900';
    default:
      return 'bg-zinc-300 border-zinc-400 text-zinc-700';
  }
};

export function CalendarView({ bookings, onSelectBooking }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar days
  const calendarDays: Array<{ date: number; isCurrentMonth: boolean; fullDate: Date }> = [];

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      date: daysInPrevMonth - i,
      isCurrentMonth: false,
      fullDate: new Date(year, month - 1, daysInPrevMonth - i),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: i,
      isCurrentMonth: true,
      fullDate: new Date(year, month, i),
    });
  }

  // Next month days to fill grid
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      date: i,
      isCurrentMonth: false,
      fullDate: new Date(year, month + 1, i),
    });
  }

  // Get bookings for a specific day
  const getBookingsForDay = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return (
        (bookingStart >= dayStart && bookingStart <= dayEnd) ||
        (bookingEnd >= dayStart && bookingEnd <= dayEnd) ||
        (bookingStart <= dayStart && bookingEnd >= dayEnd)
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'month'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'week'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayBookings = getBookingsForDay(day.fullDate);
            const isTodayDate = isToday(day.fullDate);

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 rounded-lg border transition-colors ${
                  day.isCurrentMonth
                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50'
                } ${
                  isTodayDate
                    ? 'ring-2 ring-amber-400 dark:ring-amber-600'
                    : ''
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-400 dark:text-zinc-600'
                  } ${
                    isTodayDate
                      ? 'flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white'
                      : ''
                  }`}
                >
                  {day.date}
                </div>

                {/* Bookings for this day */}
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => onSelectBooking?.(booking.id)}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-medium border truncate transition-colors hover:opacity-80 ${getStatusColor(
                        booking.status
                      )}`}
                      title={booking.title}
                    >
                      {booking.title}
                    </button>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 px-2">
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-400 border border-amber-500"></div>
          <span className="text-zinc-600 dark:text-zinc-400">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-400 border border-blue-500"></div>
          <span className="text-zinc-600 dark:text-zinc-400">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-400 border border-green-500"></div>
          <span className="text-zinc-600 dark:text-zinc-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-zinc-300 border border-zinc-400"></div>
          <span className="text-zinc-600 dark:text-zinc-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-400 border border-red-500"></div>
          <span className="text-zinc-600 dark:text-zinc-400">Cancelled</span>
        </div>
      </div>
    </div>
  );
}
