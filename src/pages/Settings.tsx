import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Timetable, BaselineAttendance, DAYS_OF_WEEK } from '../types';
import { toast } from 'react-hot-toast';
import { Clock, BarChart3, ShieldAlert, Check, Save, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const { userData, updateTimetable, updateBaseline } = useAttendance();
  const [timetable, setTimetable] = useState<Timetable>(userData?.timetable || {} as Timetable);
  const [baseline, setBaseline] = useState<BaselineAttendance>(userData?.baseline || { conducted: 0, attended: 0, isSet: false });
  const [showBaselineConfirm, setShowBaselineConfirm] = useState(false);

  const handleTogglePeriod = (day: keyof Timetable, index: number) => {
    const newDay = [...timetable[day]];
    newDay[index] = !newDay[index];
    setTimetable({ ...timetable, [day]: newDay });
  };

  const handleSaveTimetable = async () => {
    await updateTimetable(timetable);
    toast.success('Timetable updated! Changes apply to future logs.');
  };

  const handleSaveBaseline = async () => {
    if (baseline.attended > baseline.conducted) {
      toast.error('Attended periods cannot be more than conducted periods');
      return;
    }
    await updateBaseline(baseline);
    setShowBaselineConfirm(false);
    toast.success('Baseline updated!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900">Settings</h1>
        <p className="text-zinc-500">Manage your timetable and baseline configuration.</p>
      </header>

      {/* Timetable Section */}
      <section className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Weekly Timetable</h2>
              <p className="text-xs text-zinc-500">Configure your class schedule.</p>
            </div>
          </div>
          <button 
            onClick={handleSaveTimetable}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>

        <div className="space-y-6">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="border-b border-zinc-100 last:border-0 pb-6 last:pb-0">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">{day}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {timetable[day]?.map((isActive, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTogglePeriod(day, idx)}
                    className={`h-10 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                      isActive 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                    }`}
                  >
                    <span>P{idx + 1}</span>
                    {isActive ? <Check className="w-3 h-3 mt-0.5" /> : <span className="text-[10px] mt-0.5">FREE</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Baseline Section */}
      <section className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Baseline Attendance</h2>
            <p className="text-xs text-zinc-500">Update your mid-semester starting point.</p>
          </div>
        </div>

        {!showBaselineConfirm ? (
          <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Conducted</span>
                <span className="text-xl font-bold text-zinc-900">{baseline.conducted}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Attended</span>
                <span className="text-xl font-bold text-zinc-900">{baseline.attended}</span>
              </div>
            </div>
            <button 
              onClick={() => setShowBaselineConfirm(true)}
              className="px-4 py-2 border border-zinc-300 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
            >
              Edit Baseline
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">Total Periods Conducted</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={baseline.conducted}
                  onChange={(e) => setBaseline({ ...baseline, conducted: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">Total Periods Attended</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={baseline.attended}
                  onChange={(e) => setBaseline({ ...baseline, attended: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">
                Updating baseline will immediately recalculate your overall attendance percentage. 
                Ensure these numbers match your official records.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleSaveBaseline}
                className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors"
              >
                Confirm & Save
              </button>
              <button 
                onClick={() => {
                  setBaseline(userData?.baseline || { conducted: 0, attended: 0, isSet: false });
                  setShowBaselineConfirm(false);
                }}
                className="px-6 py-3 border border-zinc-300 rounded-xl font-bold hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </section>

      {/* Disclaimer Section */}
      <section className="bg-zinc-900 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-bold">Disclaimer</h2>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed">
          This application is for personal attendance tracking only. It does not represent official college attendance records. 
          The data stored here is based on your manual entries and is intended to help you stay above the 75% criteria. 
          Always refer to your college's official portal for final attendance status.
        </p>
      </section>
    </div>
  );
}