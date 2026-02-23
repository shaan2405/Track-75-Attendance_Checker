import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { DayStatus, PeriodStatus, getDayName, DAYS_OF_WEEK } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X, Ban, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const VALID_DAYS = new Set(DAYS_OF_WEEK as readonly string[]);

export default function Attendance() {
  const { userData, dailyLogs, saveDailyLog } = useAttendance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const currentLog = dailyLogs[dateStr] || { dayStatus: 'NORMAL' as DayStatus, periods: {} };

  // Safe day name — falls back to empty timetable for Sunday or unknown days
  const dayName = getDayName(selectedDate);
  const isValidDay = VALID_DAYS.has(dayName);
  const dayTimetable = isValidDay && userData
    ? userData.timetable[dayName as keyof typeof userData.timetable] || []
    : [];

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleStatusChange = async (status: DayStatus) => {
    try {
      await saveDailyLog(dateStr, { ...currentLog, dayStatus: status });
    } catch {
      toast.error('Failed to save. Please try again.');
    }
  };

  const handlePeriodChange = async (idx: number, status: PeriodStatus) => {
    const newPeriods = { ...currentLog.periods, [idx]: status };
    try {
      await saveDailyLog(dateStr, { ...currentLog, periods: newPeriods });
    } catch {
      toast.error('Failed to save. Please try again.');
    }
  };

  const getDayColor = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    const log = dailyLogs[dStr];
    if (!log) return 'bg-white';

    switch (log.dayStatus) {
      case 'HOLIDAY':      return 'bg-zinc-200';
      case 'CANCELLED':    return 'bg-amber-100';
      case 'PRESENT_ALL':  return 'bg-emerald-100';
      case 'NORMAL': {
        const statuses = Object.values(log.periods);
        if (statuses.length === 0) return 'bg-white';
        if (statuses.includes('ABSENT')) return 'bg-red-100';
        return 'bg-emerald-100';
      }
      default: return 'bg-white';
    }
  };

  const isSunday = selectedDate.getDay() === 0;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Calendar Section */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-zinc-400 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              const isSelected = isSameDay(date, selectedDate);
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all border",
                    isSelected ? "border-indigo-600 ring-2 ring-indigo-100 z-10" : "border-transparent",
                    !isCurrentMonth && "opacity-20",
                    getDayColor(date)
                  )}
                >
                  <span className={cn("font-medium", isSelected ? "text-indigo-600" : "text-zinc-700")}>
                    {format(date, 'd')}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-100 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
              <div className="w-3 h-3 rounded-full bg-emerald-100" /> Present
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
              <div className="w-3 h-3 rounded-full bg-red-100" /> Absent
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
              <div className="w-3 h-3 rounded-full bg-amber-100" /> Cancelled
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
              <div className="w-3 h-3 rounded-full bg-zinc-200" /> Holiday
            </div>
          </div>
        </div>
      </div>

      {/* Marking Section */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm min-h-[500px] flex flex-col">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">{format(selectedDate, 'EEEE, MMM do')}</h2>
              <p className="text-zinc-500 text-sm">Update your attendance for this day.</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
            </div>
          </header>

          {/* Sunday Notice */}
          {isSunday ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <CalendarIcon className="w-8 h-8 text-zinc-400" />
              </div>
              <h4 className="font-bold text-zinc-900">Sunday</h4>
              <p className="text-sm text-zinc-500 mt-1">No classes are scheduled on Sundays.</p>
            </div>
          ) : (
            <div className="space-y-8 flex-1">
              {/* Day Status */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Day Status</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'NORMAL',      label: 'Classes Held' },
                    { id: 'HOLIDAY',     label: 'Holiday' },
                    { id: 'CANCELLED',   label: 'All Cancelled' },
                    { id: 'PRESENT_ALL', label: 'Present All' },
                  ].map((status) => (
                    <button
                      key={status.id}
                      onClick={() => handleStatusChange(status.id as DayStatus)}
                      className={cn(
                        "px-3 py-3 rounded-xl text-xs font-bold border transition-all",
                        currentLog.dayStatus === status.id
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      )}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Period Marking */}
              <AnimatePresence mode="wait">
                {currentLog.dayStatus === 'NORMAL' ? (
                  <motion.section
                    key="normal"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Periods</h3>
                    <div className="space-y-3">
                      {dayTimetable.length === 0 ? (
                        <div className="py-12 text-center text-zinc-400 italic text-sm">
                          No classes scheduled for this day in your timetable.
                        </div>
                      ) : (
                        dayTimetable.map((isClass, idx) => {
                          if (!isClass) return null;
                          const status = currentLog.periods[idx];
                          return (
                            <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                              <span className="font-bold text-zinc-900">Period {idx + 1}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handlePeriodChange(idx, 'PRESENT')}
                                  className={cn(
                                    "p-2 rounded-lg transition-all border",
                                    status === 'PRESENT'
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "bg-white border-zinc-200 text-zinc-400 hover:border-emerald-200"
                                  )}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handlePeriodChange(idx, 'ABSENT')}
                                  className={cn(
                                    "p-2 rounded-lg transition-all border",
                                    status === 'ABSENT'
                                      ? "bg-red-500 border-red-500 text-white"
                                      : "bg-white border-zinc-200 text-zinc-400 hover:border-red-200"
                                  )}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handlePeriodChange(idx, 'CANCELLED')}
                                  className={cn(
                                    "p-2 rounded-lg transition-all border",
                                    status === 'CANCELLED'
                                      ? "bg-amber-500 border-amber-500 text-white"
                                      : "bg-white border-zinc-200 text-zinc-400 hover:border-amber-200"
                                  )}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                      {dayTimetable.length > 0 && dayTimetable.every(v => !v) && (
                        <div className="py-12 text-center text-zinc-400 italic text-sm">
                          No classes scheduled for this day in your timetable.
                        </div>
                      )}
                    </div>
                  </motion.section>
                ) : (
                  <motion.div
                    key="non-normal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      {currentLog.dayStatus === 'HOLIDAY'     && <CalendarIcon className="w-8 h-8 text-zinc-400" />}
                      {currentLog.dayStatus === 'CANCELLED'   && <Ban className="w-8 h-8 text-amber-400" />}
                      {currentLog.dayStatus === 'PRESENT_ALL' && <Check className="w-8 h-8 text-emerald-400" />}
                    </div>
                    <h4 className="font-bold text-zinc-900">
                      {currentLog.dayStatus === 'HOLIDAY'     && "It's a Holiday!"}
                      {currentLog.dayStatus === 'CANCELLED'   && "Classes Cancelled"}
                      {currentLog.dayStatus === 'PRESENT_ALL' && "Marked as Present for All"}
                    </h4>
                    <p className="text-sm text-zinc-500 mt-1">
                      {currentLog.dayStatus === 'HOLIDAY'     && "No periods will be counted for this day."}
                      {currentLog.dayStatus === 'CANCELLED'   && "No periods will be counted for this day."}
                      {currentLog.dayStatus === 'PRESENT_ALL' && "All valid class periods are counted as present."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}