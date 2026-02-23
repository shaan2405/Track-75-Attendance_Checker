import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttendance } from '../context/AttendanceContext';
import { getDayName, DAYS_OF_WEEK } from '../types';
import { parseISO, format } from 'date-fns';
import { AlertCircle, TrendingUp, Calendar as CalendarIcon, Info } from 'lucide-react';
import { motion } from 'motion/react';

const VALID_DAYS = new Set(DAYS_OF_WEEK as readonly string[]);

export default function Dashboard() {
  const { userData, dailyLogs } = useAttendance();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (!userData) return { conducted: 0, attended: 0, percentage: 0, requiredToReach75: 0, canSkip: 0 };

    let liveConducted = 0;
    let liveAttended = 0;

    Object.entries(dailyLogs).forEach(([dateStr, log]) => {
      const date = parseISO(dateStr);
      const dayName = getDayName(date);
      if (!VALID_DAYS.has(dayName)) return;

      const dayTimetable = userData.timetable[dayName as keyof typeof userData.timetable] || [];

      if (log.dayStatus === 'NORMAL') {
        Object.values(log.periods).forEach((status) => {
          if (status === 'PRESENT') {
            liveConducted++;
            liveAttended++;
          } else if (status === 'ABSENT') {
            liveConducted++;
          }
          // CANCELLED periods are not counted
        });
      } else if (log.dayStatus === 'PRESENT_ALL') {
        dayTimetable.forEach((isClass) => {
          if (isClass) {
            liveConducted++;
            liveAttended++;
          }
        });
      }
      // HOLIDAY and CANCELLED day statuses contribute 0
    });

    const totalConducted = userData.baseline.conducted + liveConducted;
    const totalAttended = userData.baseline.attended + liveAttended;
    const percentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;

    // Classes needed to reach 75%: (attended + x) / (conducted + x) = 0.75
    const requiredToReach75 = percentage < 75
      ? Math.ceil((0.75 * totalConducted - totalAttended) / 0.25)
      : 0;

    // Classes you can safely skip: attended / (conducted + x) = 0.75
    const canSkip = percentage >= 75
      ? Math.floor((totalAttended - 0.75 * totalConducted) / 0.75)
      : 0;

    return { conducted: totalConducted, attended: totalAttended, percentage, requiredToReach75, canSkip };
  }, [userData, dailyLogs]);

  const isLow = stats.percentage < 75;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900">Attendance Overview</h1>
        <p className="text-zinc-500">Track your progress and stay above the 75% limit.</p>
      </header>

      {/* Main Stats Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-8"
        >
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-100" />
              <circle
                cx="96" cy="96" r="88"
                stroke="currentColor" strokeWidth="12" fill="transparent"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - Math.min(stats.percentage, 100) / 100)}
                strokeLinecap="round"
                className={isLow ? "text-red-500 transition-all duration-700" : "text-emerald-500 transition-all duration-700"}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-zinc-900">{stats.percentage.toFixed(1)}%</span>
              <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Overall</span>
            </div>
          </div>

          <div className="flex-1 space-y-6 text-center md:text-left">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">
                {isLow ? "Below Criteria" : "Safe Zone"}
              </h2>
              <p className="text-zinc-500 mt-1">
                {isLow
                  ? "You need to attend more classes to reach 75%."
                  : "You are doing great! Keep it up to stay safe."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Conducted</span>
                <span className="text-2xl font-bold text-zinc-900">{stats.conducted}</span>
              </div>
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Attended</span>
                <span className="text-2xl font-bold text-zinc-900">{stats.attended}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Insights Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 rounded-3xl p-8 text-white flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Insights</span>
            </div>

            {isLow ? (
              <div className="space-y-2">
                <p className="text-3xl font-bold text-red-400">+{stats.requiredToReach75}</p>
                <p className="text-sm text-zinc-300">Periods required to reach 75% attendance.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl font-bold text-emerald-400">{stats.canSkip}</p>
                <p className="text-sm text-zinc-300">Periods you can safely skip while staying above 75%.</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-3 text-zinc-400 text-xs">
              <Info className="w-4 h-4" />
              <span>Calculated based on your baseline and daily logs.</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-zinc-900">Mark Today</h3>
            <p className="text-sm text-zinc-500">Log your classes for {format(new Date(), 'MMMM do')}.</p>
          </div>
          <button
            onClick={() => navigate('/attendance')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go
          </button>
        </div>

        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900">Disclaimer</h3>
            <p className="text-xs text-amber-700">This is for personal tracking only. Not an official record.</p>
          </div>
        </div>
      </div>
    </div>
  );
}